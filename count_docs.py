import os
from pathlib import Path

def count_files_in_docs():
    docs_path = Path("/Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/docs")
    if not docs_path.exists():
        print("المجلد غير موجود.")
        return

    total_files = 0
    file_types = {}

    for root, dirs, files in os.walk(docs_path):
        for file in files:
            total_files += 1
            ext = Path(file).suffix.lower()
            if ext in file_types:
                file_types[ext] += 1
            else:
                file_types[ext] = 1

    print(f"إجمالي عدد الملفات: {total_files}")
    print("عدد الملفات حسب النوع:")
    for ext, count in file_types.items():
        print(f"{ext}: {count}")

if __name__ == "__main__":
    count_files_in_docs()