#!/usr/bin/env python3
"""
Generate manifest.json files for texture folders
Lists which texture files are available in each folder
"""

import os
import json
from pathlib import Path

# Texture folder path
TEXTURE_BASE = Path('public/img')

# Possible texture file names
TEXTURE_TYPES = [
    'albedo.jpg',
    'normal.jpg',
    'height.jpg',
    'roughness.jpg',
    'metallic.jpg',
    'ao.jpg'
]

# Texture folders to process (subdirectories of img/)
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

def generate_manifest(folder_path):
    """Generate manifest.json for a texture folder"""
    available_textures = []
    
    for texture_type in TEXTURE_TYPES:
        texture_path = folder_path / texture_type
        if texture_path.exists():
            available_textures.append(texture_type)
    
    manifest = {
        'textures': available_textures
    }
    
    manifest_path = folder_path / 'manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Generated manifest for {folder_path.name}: {', '.join(available_textures)}")
    return manifest

def main():
    """Generate manifests for all texture folders"""
    for folder_name in TEXTURE_FOLDERS:
        folder_path = TEXTURE_BASE / folder_name
        if folder_path.exists() and folder_path.is_dir():
            generate_manifest(folder_path)
        else:
            print(f"Warning: Texture folder {folder_name} not found")

if __name__ == '__main__':
    main()

