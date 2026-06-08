import os
import re

src_dir = r"d:\newfuelstation5\fuelpro\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace literal '$' with 'Rs.' ONLY if it's not a template string (${)
    # and not part of a regex or variable name (like $1, $foo).
    # Specifically, look for things like '$ ' or '$123' or 'PKR' things.
    # Actually, a safe regex for $ representing money is \$(\d) -> Rs. \1
    # or \$ (\d) -> Rs. \1
    # or >\$< -> >Rs.<
    # Let's replace 'USD' with 'PKR'
    content = content.replace("'USD'", "'PKR'")
    content = content.replace('"USD"', '"PKR"')
    
    # Replace '$' when it's clearly currency (e.g. followed by number or space then number, or at end of string)
    # Examples: $500 -> Rs. 500,  $ 500 -> Rs. 500
    content = re.sub(r'\$(\s*\d)', r'Rs.\1', content)
    # $ sign in text like "Total: $" -> "Total: Rs."
    content = re.sub(r'\$(\s*</)', r'Rs.\1', content)
    # $ sign before {  (e.g. ${amount} ) - wait, if it's template string ${val}, we DO NOT WANT Rs.{val}.
    # BUT if the code has `${val}` meaning "$ <val>", sometimes they do `$${val}` or `$ ${val}` or `\$${val}`.
    # Let's look for `$${` which means literal $ then template.
    content = re.sub(r'\$\$\{', r'Rs. ${', content)
    # And `$ ${` -> `Rs. ${`
    content = re.sub(r'\$\s+\$\{', r'Rs. ${', content)
    
    # Replace 'GAL' -> 'L', 'Gallons' -> 'Liters', 'gal' -> 'L'
    content = re.sub(r'\bGAL\b', 'L', content)
    content = re.sub(r'\bGallons\b', 'Liters', content)
    content = re.sub(r'\bgallons\b', 'liters', content)
    content = re.sub(r'\bGallon\b', 'Liter', content)
    content = re.sub(r'\bgallon\b', 'liter', content)
    content = re.sub(r'\bgal\b', 'L', content)
    
    # If the file had changes, write it back
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, file))

print("Done.")
