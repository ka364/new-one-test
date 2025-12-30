import os
from pathlib import Path
from collections import Counter
import re

def analyze_docs():
    docs_path = Path("/Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/docs")
    if not docs_path.exists():
        print("المجلد غير موجود.")
        return

    total_files = 0
    total_characters = 0
    total_words = 0
    letter_counter = Counter()
    word_counter = Counter()

    for root, dirs, files in os.walk(docs_path):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        total_files += 1
                        total_characters += len(content)
                        words = re.findall(r'\b\w+\b', content.lower())
                        total_words += len(words)
                        letter_counter.update(c for c in content.lower() if c.isalpha())
                        word_counter.update(words)
                except Exception as e:
                    print(f"خطأ في قراءة {file}: {e}")

    print(f"إجمالي عدد الملفات المحللة (.md): {total_files}")
    print(f"إجمالي عدد الحروف: {total_characters}")
    print(f"إجمالي عدد الكلمات: {total_words}")
    print("\nأكثر 10 حروف شيوعاً:")
    for letter, count in letter_counter.most_common(10):
        print(f"{letter}: {count}")
    print("\nأكثر 20 كلمة شيوعاً:")
    for word, count in word_counter.most_common(20):
        print(f"{word}: {count}")

if __name__ == "__main__":
    analyze_docs()