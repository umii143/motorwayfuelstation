import os
import re

TARGET_DIR = "src/components"

# Patterns to replace
REPLACEMENTS = [
    # General Card Backgrounds
    (re.compile(r'className="([^"]*)bg-white([^"]*)rounded-xl([^"]*)shadow-sm([^"]*)"'), 
     r'className="\1premium-card\2\3\4"'),
    (re.compile(r'className="([^"]*)bg-white([^"]*)rounded-lg([^"]*)shadow-sm([^"]*)"'), 
     r'className="\1premium-card\2\3\4"'),
    (re.compile(r'className="([^"]*)bg-white([^"]*)rounded-2xl([^"]*)shadow-sm([^"]*)"'), 
     r'className="\1premium-card\2\3\4"'),
    
    # Inputs & Textareas
    (re.compile(r'className="([^"]*)w-full([^"]*)rounded-lg([^"]*)border-slate-200([^"]*)"'), 
     r'className="\1premium-input\2\3\4"'),
    (re.compile(r'className="([^"]*)w-full([^"]*)border([^"]*)rounded-md([^"]*)"'), 
     r'className="\1premium-input\2\3\4"'),
    
    # Select elements often share these classes
    (re.compile(r'className="([^"]*)w-full([^"]*)appearance-none([^"]*)rounded-lg([^"]*)"'), 
     r'className="\1premium-input appearance-none\2\3\4"'),

    # Buttons
    (re.compile(r'className="([^"]*)bg-blue-600([^"]*)text-white([^"]*)rounded-xl([^"]*)"'), 
     r'className="\1premium-button\2\3\4"'),
    (re.compile(r'className="([^"]*)bg-indigo-600([^"]*)text-white([^"]*)rounded-lg([^"]*)"'), 
     r'className="\1premium-button\2\3\4"'),
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Clean up redundant classes that might conflict with premium-card
    # Since premium-card includes bg-white, rounded-24px, shadow, border
    # We remove explicit 'bg-white', 'rounded-xl', 'shadow-sm', 'border', 'border-slate-200'
    # if they are in the same string as 'premium-card'
    for pattern, replacement in REPLACEMENTS:
        content = pattern.sub(replacement, content)
        
    # Second pass: clean up redundant classes where premium-card is applied
    if "premium-card" in content:
        content = re.sub(r'premium-card([^"]*)(bg-white|rounded-xl|rounded-lg|rounded-2xl|shadow-sm|border-slate-200|border\s|p-\d+)', r'premium-card\1', content)
        content = re.sub(r'(bg-white|rounded-xl|rounded-lg|rounded-2xl|shadow-sm|border-slate-200|border\s|p-\d+)([^"]*)premium-card', r'\2premium-card', content)
        
    # Same for input
    if "premium-input" in content:
        content = re.sub(r'premium-input([^"]*)(bg-white|rounded-xl|rounded-lg|rounded-md|shadow-sm|border-slate-200|border\s|px-\d+|py-\d+)', r'premium-input\1', content)
        content = re.sub(r'(bg-white|rounded-xl|rounded-lg|rounded-md|shadow-sm|border-slate-200|border\s|px-\d+|py-\d+)([^"]*)premium-input', r'\2premium-input', content)

    if content != original_content:
        # Clean up double spaces in class names
        content = re.sub(r'className="([^"]*)\s+([^"]*)"', lambda m: f'className="{re.sub(r" +", " ", m.group(1) + " " + m.group(2)).strip()}"', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    modified_count = 0
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.endswith(('.tsx', '.jsx')):
                filepath = os.path.join(root, file)
                if process_file(filepath):
                    print(f"Modified: {filepath}")
                    modified_count += 1
                    
    print(f"Total files modified: {modified_count}")

if __name__ == "__main__":
    main()
