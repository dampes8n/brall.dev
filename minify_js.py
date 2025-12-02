#!/usr/bin/env python3
"""
Minify JavaScript files using rjsmin (pure Python JavaScript minifier)
"""

import os
import sys
from pathlib import Path

try:
    import rjsmin
except ImportError:
    print("rjsmin not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'rjsmin', '--quiet'])
    import rjsmin

# Files to minify (relative to public/)
JS_FILES = [
    'js/router.js',
    'js/loader.js',
    'components/base/b-json-loader.js',
    # Component files that need minification
    'components/b-3d-scene.js',
    'components/b-flavor-selector.js',
    'components/b-breadcrumbs.js',
    'components/b-timeline.js',
    'components/b-layer.js',
    'components/b-date.js',
    'components/b-skillsets.js',
    'components/b-projects.js',
    'components/b-subdomain-projects.js',
    'components/b-xp.js',
    'components/b-yt.js',
    'components/b-hamburger.js',
    'components/b-skip-link.js'
]

PUBLIC_DIR = Path('public')

def minify_file(file_path):
    """Minify a single JavaScript file using rjsmin"""
    full_path = PUBLIC_DIR / file_path
    
    if not full_path.exists():
        print(f"Warning: {file_path} not found, skipping")
        return False
    
    print(f"Minifying {file_path}...")
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_size = len(content)
    
    # Minify using rjsmin
    minified = rjsmin.jsmin(content)
    
    minified_size = len(minified)
    reduction = ((original_size - minified_size) / original_size) * 100
    
    # Create minified version
    min_path = full_path.with_suffix('.min.js')
    with open(min_path, 'w', encoding='utf-8') as f:
        f.write(minified)
    
    print(f"  Original: {original_size:,} bytes")
    print(f"  Minified: {minified_size:,} bytes")
    print(f"  Reduction: {reduction:.1f}%")
    
    return True

def main():
    """Minify all JavaScript files"""
    print("Minifying JavaScript files with rjsmin...\n")
    
    for js_file in JS_FILES:
        minify_file(js_file)
        print()
    
    print("Minification complete!")

if __name__ == '__main__':
    main()
