#!/usr/bin/env python3
"""
Script to fetch images from Pexels API for skills and skillsets,
download, resize, and update JSON files with img tags and alt text.
"""

import json
import os
import requests
from PIL import Image
import io
import sys
from pathlib import Path

# Configuration
PEXELS_API_KEY = os.environ.get('PEXELS_API_KEY', '')
PEXELS_API_URL = 'https://api.pexels.com/v1/search'
SKILLS_JSON = 'public/data/skills.json'
SKILLSETS_JSON = 'public/data/skillsets.json'
IMG_DIR = 'public/img/skills'
IMG_DIR_SKILLSETS = 'public/img/skillsets'
PAGE_WIDTH = 1000  # Width for page use

def ensure_directories():
    """Create necessary directories if they don't exist."""
    Path(IMG_DIR).mkdir(parents=True, exist_ok=True)
    Path(IMG_DIR_SKILLSETS).mkdir(parents=True, exist_ok=True)

def search_pexels_image(query, api_key):
    """Search Pexels API for an image matching the query."""
    if not api_key:
        print(f"Warning: No PEXELS_API_KEY found. Skipping image search for '{query}'")
        return None
    
    headers = {'Authorization': api_key}
    params = {'query': query, 'per_page': 1, 'orientation': 'landscape'}
    
    try:
        response = requests.get(PEXELS_API_URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('photos') and len(data['photos']) > 0:
            photo = data['photos'][0]
            return {
                'url': photo['src']['large'],  # Use large size for download
                'photographer': photo['photographer'],
                'photographer_url': photo['photographer_url'],
                'alt': photo.get('alt', query)
            }
    except Exception as e:
        print(f"Error searching Pexels for '{query}': {e}")
    
    return None

def download_image(url, filepath):
    """Download an image from URL and save it."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        return True
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
        return False

def resize_image(input_path, output_path, max_width=None, quality=85):
    """Resize an image, optionally to a max width, and save with compression."""
    try:
        img = Image.open(input_path)
        
        # Convert to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if max_width is specified
        if max_width and img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save with compression
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
        return True
    except Exception as e:
        print(f"Error processing image {input_path}: {e}")
        return False

def generate_alt_text(pexels_alt, title):
    """Generate alt text from Pexels description, with fallback."""
    # Use Pexels alt text if available and meaningful
    if pexels_alt and pexels_alt.strip() and pexels_alt.lower() != title.lower():
        # Clean up the Pexels alt text - it's usually a good description
        return pexels_alt.strip()
    # Fallback: create a simple descriptive alt text
    return f"Image representing {title}"

def process_item(item, item_type, api_key):
    """Process a single skill or skillset item."""
    slug = item.get('slug', '')
    title = item.get('title', '')
    description = item.get('description', '')
    
    if not slug or not title:
        print(f"Skipping item without slug or title: {item}")
        return None
    
    # Determine image directory
    if item_type == 'skill':
        img_dir = IMG_DIR
    else:
        img_dir = IMG_DIR_SKILLSETS
    
    # Search for image
    print(f"Searching for image: {title}...")
    image_data = search_pexels_image(title, api_key)
    
    if not image_data:
        print(f"  No image found for '{title}'")
        return None
    
    # Download original image
    original_filename = f"{slug}_original.jpg"
    original_path = os.path.join(img_dir, original_filename)
    
    print(f"  Downloading image from {image_data['url']}...")
    if not download_image(image_data['url'], original_path):
        return None
    
    # Create resized version (1000px wide) for page use
    page_filename = f"{slug}_1000w.jpg"
    page_path = os.path.join(img_dir, page_filename)
    
    print(f"  Resizing to {PAGE_WIDTH}px wide...")
    if not resize_image(original_path, page_path, max_width=PAGE_WIDTH, quality=85):
        return None
    
    # Create compressed full-size version
    compressed_filename = f"{slug}_full.jpg"
    compressed_path = os.path.join(img_dir, compressed_filename)
    
    print(f"  Creating compressed full-size version...")
    if not resize_image(original_path, compressed_path, max_width=None, quality=85):
        return None
    
    # Generate alt text from Pexels description
    alt_text = generate_alt_text(image_data['alt'], title)
    
    # Return image info for JSON update
    # Fix path: skills -> skills, skillsets -> skillsets
    path_type = 'skills' if item_type == 'skill' else 'skillsets'
    return {
        'img': f"img/{path_type}/{page_filename}",
        'alt': alt_text,
        'photographer': image_data['photographer'],
        'photographer_url': image_data['photographer_url']
    }

def update_json_file(json_path, item_type, api_key):
    """Update JSON file with image tags."""
    # Read existing JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    updated_items = []
    
    for item in items:
        # Process item to get image
        image_info = process_item(item, item_type, api_key)
        
        if image_info:
            # Check if description already has an img tag
            description = item.get('description', '')
            if '<img' in description:
                print(f"  Skipping {item.get('title', '')} - already has an image")
            else:
                # Create img tag HTML
                img_tag = f'<img src="{image_info["img"]}" alt="{image_info["alt"]}" />'
                
                # Add img tag before description
                if description:
                    # Insert img tag before description
                    item['description'] = f'{img_tag}\n{description}'
                else:
                    item['description'] = img_tag
                
                # Store photographer info (optional, for attribution)
                item['image_photographer'] = image_info['photographer']
                item['image_photographer_url'] = image_info['photographer_url']
        
        updated_items.append(item)
    
    # Write updated JSON back
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(updated_items, f, indent=4, ensure_ascii=False)
    
    print(f"\nUpdated {json_path} with {len([i for i in updated_items if 'image_photographer' in i])} images")

def main():
    """Main function."""
    # Check for API key
    api_key = "htNJlJsGyVv8utj3ZInYoF8HKmhU0fUT2gfvjgasQd37HI2feVaw9RXs"
    if not api_key:
        print("PEXELS_API_KEY environment variable not set.")
        print("Please provide your Pexels API key.")
        print("You can get one free at: https://www.pexels.com/api/")
        api_key = input("Enter your Pexels API key: ").strip()
        if not api_key:
            print("Error: API key is required.")
            sys.exit(1)
    
    # Ensure directories exist
    ensure_directories()
    
    # Process skills
    print("=" * 60)
    print("Processing SKILLS...")
    print("=" * 60)
    update_json_file(SKILLS_JSON, 'skill', api_key)
    
    # Process skillsets
    print("\n" + "=" * 60)
    print("Processing SKILLSETS...")
    print("=" * 60)
    update_json_file(SKILLSETS_JSON, 'skillset', api_key)
    
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == '__main__':
    main()

