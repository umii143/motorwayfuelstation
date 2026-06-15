import os
import re

def polish_files(directory):
    modified_count = 0
    
    # Common tailwind patterns used in tables that we want to strip
    # because they will be handled by our new .premium-table CSS.
    tailwind_classes_to_strip = [
        "min-w-full", "w-full", "border-collapse", "text-left", "text-sm", "text-xs", "font-sans",
        "divide-y", "divide-slate-200", "divide-slate-100", "divide-gray-200",
        "bg-slate-50", "bg-gray-50", "bg-slate-100", "bg-white", "bg-slate-50/50",
        "text-slate-500", "text-gray-500", "text-slate-400", "text-slate-800", "text-slate-900",
        "uppercase", "tracking-wider", "font-medium", "font-bold",
        "px-6", "py-3", "px-4", "py-4", "p-4", "p-2", "py-2", "px-2",
        "border-b", "border-slate-100", "border-slate-200", "border",
        "whitespace-nowrap", "hover:bg-slate-50", "transition-colors"
    ]
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.tsx', '.jsx')):
                continue
            
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                continue

            original_content = content

            # 1. Upgrade <table className="..."> to <table className="premium-table">
            content = re.sub(r'<table\s+className=(["\'][^"\']*["\'])', r'<table className="premium-table"', content)
            # Upgrade <table> without className
            content = re.sub(r'<table(\s*|/)>', r'<table className="premium-table"\1>', content)
            
            # 2. Strip conflicting classes from thead, tbody, tr, th, td
            # This is a bit tricky, we will only do this for specific known table elements
            def clean_classes(match):
                element = match.group(1)
                class_attr = match.group(2)
                classes = match.group(3).split()
                new_classes = [c for c in classes if c not in tailwind_classes_to_strip]
                
                if new_classes:
                    return f'<{element} className="{ " ".join(new_classes) }"'
                else:
                    return f'<{element}' # remove className entirely if empty

            # Matches <thead className="...">, <th className="...">, <tr className="...">, <td className="...">
            content = re.sub(r'<(thead|tbody|th|tr|td)\s+className=(["\'])(.*?)\2', clean_classes, content)

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_count += 1
                print(f"Polished tables in: {file}")

    print(f"\nSuccessfully polished tables in {modified_count} files.")

if __name__ == "__main__":
    polish_files("src/components/features")
