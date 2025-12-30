#!/bin/zsh
# جرد كامل لمجلد المشروع: أحجام، أنواع ملفات، وأكبر الملفات

set -e

REPORT_SUMMARY="inventory_summary.txt"
REPORT_CSV="inventory_files.csv"

echo "🚀 Generating inventory for: $(pwd)"
echo

########################################
# 1) ملخص عام في ملف TXT
########################################
{
  echo "=== Project inventory for: $(pwd) ==="
  echo "Generated at: $(date)"
  echo

  echo "----------------------------------------"
  echo "📦 إجمالي حجم المجلد:"
  du -sh . 2>/dev/null
  echo

  echo "----------------------------------------"
  echo "📂 أحجام المجلدات (المستوى الأول):"
  du -sh ./* 2>/dev/null | sort -h
  echo

  echo "----------------------------------------"
  echo "📊 عدد الملفات حسب الامتداد:"
  find . -type f ! -path "./.git/*" \
    | sed 's/.*\.//' \
    | tr '[:upper:]' '[:lower:]' \
    | sort \
    | uniq -c \
    | sort -nr
  echo

  echo "----------------------------------------"
  echo "🏋️‍♂️ أكبر 20 ملف في المشروع:"
  # macOS stat format
  find . -type f ! -path "./.git/*" -exec stat -f "%z %N" {} + \
    | sort -nr \
    | head -20
  echo

} > "$REPORT_SUMMARY"

########################################
# 2) تفاصيل كل ملف في CSV
########################################
echo "path,size_bytes,modified,extension" > "$REPORT_CSV"

find . -type f ! -path "./.git/*" | while IFS= read -r file; do
  size=$(stat -f "%z" "$file")
  mtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
  name="${file##*/}"
  if [[ "$name" == *.* ]]; then
    ext="${name##*.}"
  else
    ext="(no_ext)"
  fi

  # نهرب علامات الاقتباس في المسار لو فيه
  safe_path="${file//\"/\"\"}"

  echo "\"$safe_path\",$size,\"$mtime\",\"$ext\"" >> "$REPORT_CSV"
done

echo "✅ Done!"
echo "Summary: $REPORT_SUMMARY"
echo "Details: $REPORT_CSV"
