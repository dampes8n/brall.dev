#!/usr/bin/env python3
"""
Script to generate half-size versions of all textures
Creates _half.jpg versions of all texture files in texture folders
"""

import os
from PIL import Image

TEXTURE_FOLDERS = [
    'door',
    'logs',
    'marble',
    'mossy',
    'obsidian',
    'panel',
    'rockmoss',
    'stucco'
]

TEXTURE_BASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'img')

def generate_half_size_texture(folder_path, filename):
    """Generate a half-size version of a texture file"""
    input_path = os.path.join(folder_path, filename)
    output_filename = filename.replace('.jpg', '_half.jpg')
    output_path = os.path.join(folder_path, output_filename)
    
    # Skip if already exists
    if os.path.exists(output_path):
        print(f"  [OK] {output_filename} already exists, skipping")
        return
    
    try:
        # Open image
        with Image.open(input_path) as img:
            # Get original dimensions
            original_width, original_height = img.size
            
            # Calculate half size
            half_width = original_width // 2
            half_height = original_height // 2
            
            # Resize to half size with high quality (LANCZOS resampling)
            resized_img = img.resize((half_width, half_height), Image.Resampling.LANCZOS)
            
            # Save with high quality
            resized_img.save(output_path, 'JPEG', quality=90, optimize=True)
            
            print(f"  [OK] Created {output_filename} ({half_width}x{half_height} from {original_width}x{original_height})")
    except Exception as e:
        print(f"  [ERROR] Error processing {filename}: {e}")

def process_texture_folder(folder_name):
    """Process all textures in a folder"""
    folder_path = os.path.join(TEXTURE_BASE_PATH, folder_name)
    
    if not os.path.exists(folder_path):
        print(f"[WARN] Folder {folder_name} does not exist, skipping")
        return
    
    print(f"\nProcessing folder: {folder_name}")
    
    # Read all files in folder
    files = os.listdir(folder_path)
    
    # Filter for texture files (jpg)
    texture_files = [f for f in files 
                     if f.endswith('.jpg') 
                     and '_half.jpg' not in f 
                     and f != 'manifest.json']
    
    if not texture_files:
        print(f"  No texture files found")
        return
    
    # Process each texture file
    for filename in texture_files:
        generate_half_size_texture(folder_path, filename)

def main():
    """Main function"""
    print("Generating half-size textures...\n")
    print(f"Base path: {TEXTURE_BASE_PATH}\n")
    
    # Process each texture folder
    for folder_name in TEXTURE_FOLDERS:
        process_texture_folder(folder_name)
    
    print("\n[DONE] All half-size textures generated!")

if __name__ == '__main__':
    main()

