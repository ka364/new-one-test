import os
import datetime

# --- الهدف المتوقع ---
TARGET_FILE_COUNT = 492

# --- المجلدات اللي لازم نتجاهلها عشان الزحمة ---
EXCLUDE_DIRS = {
    ".git", ".idea", ".vscode", "__pycache__", "node_modules", 
    "venv", ".venv", "env", "build", "dist", ".DS_Store", "_archive"
}

# --- أنواع الملفات وتصنيفها ---
CATEGORIES = {
    "🏛️ Architecture & Governance": ["architecture", "governance", "raci", "constitution", "دستور"],
    "💻 Code, Servers & KB": [".py", ".js", "server", "knowledge", "kb_", "kaia", "src"],
    "🌐 Project Hub (Web)": ["haderos_project_hub", "index.html", "web", "html", "css"],
    "📈 Strategy & Reports": ["strategic", "review", "roadmap", "achievement", "summary", "report", "consolidation"],
    "📝 Drafts & Text": [".md", ".txt", ".csv", ".docx"],
    "📦 Others": [] 
}

def classify_file(filename, path):
    name_lower = filename.lower()
    path_lower = path.lower()
    for category, keywords in CATEGORIES.items():
        if category == "📦 Others": continue
        for kw in keywords:
            if kw in name_lower or kw in path_lower:
                return category
    return "📦 Others"

def generate_audit():
    total_files = 0
    file_index = {cat: [] for cat in CATEGORIES}
    
    print(f"🚀 Starting Smart Audit (Target: {TARGET_FILE_COUNT})...")
    print(f"🚫 Ignoring clutter: {EXCLUDE_DIRS}")

    for root, dirs, files in os.walk("."):
        # استبعاد مجلدات الزحمة
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file in ["audit_haderos.py", ".DS_Store"]: continue
            
            total_files += 1
            full_path = os.path.join(root, file)
            category = classify_file(file, full_path)
            file_index[category].append(full_path)

    # طباعة النتيجة في التيرمينال
    print("-" * 50)
    print(f"📊 Final Count: {total_files} files (Filtered)")
    print("-" * 50)
    
    for cat, items in file_index.items():
        print(f"{cat}: {len(items)} files")
        # لو عايز تشوف أسامي الملفات، شيل علامة الهاش من السطر الجاي
        # for item in items: print(f"  - {item}")
    
    print("-" * 50)
    
    if total_files == TARGET_FILE_COUNT:
        print("✅ MATCH! العدد مضبوط بالظبط.")
    elif total_files > TARGET_FILE_COUNT:
        print(f"⚠️ زيادة {total_files - TARGET_FILE_COUNT} ملف (ممكن مسودات أو تكرار).")
    else:
        print(f"❌ ناقص {TARGET_FILE_COUNT - total_files} ملف.")

if __name__ == "__main__":
    generate_audit()
