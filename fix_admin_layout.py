import os
import glob
import re

admin_dir = "c:\\Users\\agila\\OneDrive\\Documents\\Agila\\CCTV_SK-tech\\frontend\\src\\app\\admin"

files = glob.glob(os.path.join(admin_dir, "**", "page.tsx"), recursive=True)

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We want to replace `<main className="... w-full ...">` with `<main className="... min-w-0 ...">` 
    # ONLY when it has `flex-1` and `lg:ml-80`.
    
    def replacer(match):
        class_str = match.group(1)
        
        # If it has flex-1 and lg:ml-80 but NO min-w-0
        if "flex-1" in class_str and "lg:ml-80" in class_str:
            if "min-w-0" not in class_str:
                class_str = class_str.replace("flex-1", "flex-1 min-w-0")
            
            # Remove w-full if present
            class_str = re.sub(r'\bw-full\b', '', class_str)
            # Clean up double spaces
            class_str = re.sub(r'\s+', ' ', class_str).strip()
            
            return f'<main className="{class_str}">'
        return match.group(0)

    new_content = re.sub(r'<main\s+className="([^"]+)">', replacer, content)
    
    if new_content != content:
        with open(file, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed layout overflow in {os.path.relpath(file, admin_dir)}")
