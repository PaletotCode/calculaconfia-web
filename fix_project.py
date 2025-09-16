#!/usr/bin/env python3
"""
Script to fix icon names based on the actual LucideIcon component
The component uses keyof typeof icons, so we need camelCase names
"""

def fix_lucide_icons(file_path):
    """Fix icon names to match the lucide-react icons object keys"""
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Based on common lucide-react icon names (camelCase)
    replacements = [
        # Info should work as is
        # But MessageCircleQuestionMark needs to be the exact camelCase from icons object
        
        # Try these common alternatives:
        ('name="MessageCircleQuestionMark"', 'name="messageCircleQuestion"'),
        
        # Or try the more standard help icon
        ('name="MessageCircleQuestionMark"', 'name="helpCircle"'),
        
        # Info might need to be lowercase
        ('name="Info"', 'name="info"'),
    ]
    
    # Apply replacements
    original_content = content
    changes_made = []
    
    for find_text, replace_text in replacements:
        if find_text in content:
            content = content.replace(find_text, replace_text)
            changes_made.append((find_text, replace_text))
    
    # Write back
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Fixed icon names in {file_path}")
        print("Applied fixes:")
        for find_text, replace_text in changes_made:
            print(f"  {find_text} → {replace_text}")
    else:
        print("No changes made.")
    
    print("\nTo find the exact icon names, check the lucide-react source or:")
    print("1. Look at node_modules/lucide-react/dist/esm/icons/")
    print("2. Or check what icons are actually available in the icons object")

def create_icon_checker():
    """Create a small script to check available icon names"""
    
    checker_script = '''// Run this in your Next.js project to see available icons
import { icons } from "lucide-react";

console.log("Available Lucide icons:");
Object.keys(icons).forEach(iconName => {
  if (iconName.toLowerCase().includes('info') || 
      iconName.toLowerCase().includes('question') ||
      iconName.toLowerCase().includes('help')) {
    console.log(iconName);
  }
});
'''
    
    with open('check-icons.js', 'w') as f:
        f.write(checker_script)
    
    print("Created check-icons.js - run this in your project to see available icon names")

if __name__ == "__main__":
    # Try common alternatives first
    print("Trying common camelCase alternatives...")
    
    # Manual suggestions based on typical lucide naming:
    print("\nTry these manual replacements:")
    print('name="MessageCircleQuestionMark" → name="messageCircleQuestion"')
    print('name="Info" → name="info"')
    print("\nOr safer alternatives:")
    print('name="MessageCircleQuestionMark" → name="helpCircle"')  
    print('name="Info" → name="alertCircle"')
    
    create_icon_checker()