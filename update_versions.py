#!/usr/bin/env python3
import os
import re
import sys

def update_version_in_file(filepath, new_version):
    """Update all ?v=XX parameters to new version in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match ?v=any_number
        pattern = r'\?v=\d+'
        replacement = f'?v={new_version}'
        
        # Count replacements
        matches = re.findall(pattern, content)
        if not matches:
            return 0
        
        # Replace all occurrences
        new_content = re.sub(pattern, replacement, content)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return len(matches)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def find_and_update_html_files(root_dir, new_version):
    """Find all HTML files and update version parameters"""
    total_replacements = 0
    files_updated = 0
    
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and other unwanted directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__']]
        
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                replacements = update_version_in_file(filepath, new_version)
                if replacements > 0:
                    total_replacements += replacements
                    files_updated += 1
                    print(f"✓ {filepath}: {replacements} version(s) updated")
    
    return files_updated, total_replacements

if __name__ == "__main__":
    # Get new version from command line or use default
    new_version = sys.argv[1] if len(sys.argv) > 1 else "20"
    
    # Get project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Updating all version parameters to v={new_version}...")
    print(f"Scanning directory: {project_root}")
    print("-" * 60)
    
    files_updated, total_replacements = find_and_update_html_files(project_root, new_version)
    
    print("-" * 60)
    print(f"✓ Complete!")
    print(f"  Files updated: {files_updated}")
    print(f"  Total replacements: {total_replacements}")
    print(f"  New version: v={new_version}")
