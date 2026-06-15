import os
import re

def polish_modals_and_empty_states(directory):
    modified_count = 0
    
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

            # 1. Upgrade Modal Overlays
            # Looks for common modal backdrops like bg-black/50, bg-slate-900/40, backdrop-blur
            # We replace the whole className with premium-modal-overlay
            content = re.sub(
                r'className=["\']fixed\s+inset-0\s+z-50\s+flex\s+items-center\s+justify-center\s+bg-(?:slate|gray|black)[^\'"]*["\']',
                r'className="premium-modal-overlay"',
                content
            )

            # 2. Upgrade Modal Containers
            # Looks for w-full max-w-* rounded-* bg-white ... inside motion.div or div
            # We want to replace these with premium-modal
            content = re.sub(
                r'className=["\']w-full\s+max-w-(?:sm|md|lg|xl|2xl|3xl|4xl|5xl)\s+rounded-[a-z0-9-]+\s+bg-white\s+p-[0-9]+[^\'"]*["\']',
                r'className="premium-modal p-6 space-y-4"',
                content
            )

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_count += 1
                print(f"Polished modals in: {file}")

    print(f"\nSuccessfully polished modals in {modified_count} files.")

if __name__ == "__main__":
    polish_modals_and_empty_states("src/components/features")
