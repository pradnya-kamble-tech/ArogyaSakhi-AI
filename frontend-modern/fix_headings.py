import os
import re
import glob

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    
    # 1. Update big headings
    def replacer(match):
        tag_start = match.group(1) 
        attrs = match.group(2) 
        class_match = re.search(r'className="([^"]+)"', attrs)
        if class_match:
            classes = class_match.group(1)
            if 'font-serif' in classes or 'text-display' in classes:
                return match.group(0)
            
            classes = classes.replace('font-bold', '').replace('font-semibold', '').replace('font-medium', '')
            new_classes = (classes + " font-serif").strip().replace('  ', ' ')
            new_attrs = attrs[:class_match.start()] + f'className="{new_classes}"' + attrs[class_match.end():]
            return f'{tag_start}{new_attrs}>'
        
        return match.group(0)

    new_content = re.sub(r'(<h[1-4])([^>]+)>', replacer, content)

    # 2. Update AI card
    new_content = re.sub(r'>Decision Support<', '>Decision support<', new_content)

    # 3. Fix Roles 
    new_content = new_content.replace("'ASHA_WORKER'", "'PCW (ASHA)'")
    new_content = new_content.replace("'PCW'", "'PCW (ASHA)'")
    
    # ensure it doesn't double replace
    new_content = new_content.replace("'PCW (ASHA) (ASHA)'", "'PCW (ASHA)'")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
             process_file(os.path.join(root, file))

print("Done")
