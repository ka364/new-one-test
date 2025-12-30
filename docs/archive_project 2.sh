#!/bin/bash

# تعريف اسم النسخة
VERSION="v3.0_Golden_Copy"
TARGET="HaderOS_$VERSION"

echo "🚀 بدء تجميع النسخة الذهبية لمشروع HaderOS..."

# 1. إنشاء الهيكل الجديد
mkdir -p "$TARGET"
mkdir -p "$TARGET/01_Knowledge_Base"
mkdir -p "$TARGET/02_Live_System"
mkdir -p "$TARGET/03_Investor_Room"

# 2. نسخ قاعدة المعرفة (من المجلد المنظم سابقاً)
# نفترض وجود المجلد HaderOS_Organized
if [ -d "HaderOS_Organized" ]; then
    cp -r "HaderOS_Organized/"* "$TARGET/01_Knowledge_Base/"
    echo "✅ تم نسخ قاعدة المعرفة."
else
    echo "⚠️  تنبيه: مجلد HaderOS_Organized غير موجود، يرجى التأكد من مكانه."
fi

# نسخ ملف الفهرس الرئيسي إذا كان في الجذر
if [ -f "KB_INDEX_HaderOS.md" ]; then
    cp "KB_INDEX_HaderOS.md" "$TARGET/"
    echo "✅ تم نسخ KB_INDEX."
fi

# 3. نسخ النظام الحي (من do.2)
# نستثني مجلدات node_modules و venv لتقليل الحجم
echo "📦 جاري نسخ الكود المصدري (بدون المكتبات الضخمة)..."
mkdir -p "$TARGET/02_Live_System/Backend"
mkdir -p "$TARGET/02_Live_System/Frontend"

# نسخ ملفات الباك إند
cp "do.2/alfurqan_api.py" "$TARGET/02_Live_System/Backend/" 2>/dev/null
cp "do.2/hader_system_advanced.py" "$TARGET/02_Live_System/Backend/" 2>/dev/null
cp "do.2/run_demo.py" "$TARGET/02_Live_System/Backend/" 2>/dev/null
cp -r "do.2/data" "$TARGET/02_Live_System/Backend/" 2>/dev/null

# نسخ ملفات الفرونت إند (السورس كود فقط)
if [ -d "do.2/dashboard" ]; then
    rsync -av --progress "do.2/dashboard" "$TARGET/02_Live_System/Frontend/" --exclude node_modules --exclude dist
    echo "✅ تم نسخ مشروع React Dashboard."
fi

# 4. إنشاء ملف التشغيل السريع
cat <<EOT >> "$TARGET/HOW_TO_RUN.txt"
★ HaderOS v3.0 - دليل التشغيل السريع ★

1. تشغيل الباك إند (The Brain):
   cd 02_Live_System/Backend
   pip install flask flask-cors mysql-connector-python
   python alfurqan_api.py
   (سيعمل على Port 5050)

2. تشغيل الفرونت إند (The Face):
   cd 02_Live_System/Frontend/dashboard
   npm install
   npm run dev
   (سيعمل على Port 5173)

3. الوثائق والمعرفة:
   راجع المجلد 01_Knowledge_Base
EOT

# 5. الضغط النهائي
echo "🗜️  جاري ضغط الملف النهائي..."
zip -r "${TARGET}.zip" "$TARGET" > /dev/null

echo ""
echo "🎉 تمت المهمة بنجاح!"
echo "📂 الملف الجاهز: ${TARGET}.zip"
echo "📍 المسار الحالي: $(pwd)/${TARGET}.zip"
