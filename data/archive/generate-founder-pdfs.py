#!/usr/bin/env python3
"""
Generate Personalized PDF Onboarding Documents for HaderOS Founders
Each PDF includes:
- Login credentials
- System overview
- Direct support contact (WhatsApp + Email)
- Troubleshooting guide
"""

import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

# Register Arabic font (using system fonts)
try:
    pdfmetrics.registerFont(TTFont('Arabic', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('Arabic-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
except:
    print("⚠️  Arabic font not found, using default font")

# Load founder credentials
with open('/home/ubuntu/haderos-mvp/founder_credentials.json', 'r', encoding='utf-8') as f:
    founders = json.load(f)

# Support contact information
SUPPORT_WHATSAPP = "+201234567890"  # Replace with actual number
SUPPORT_EMAIL = "support@haderosai.com"
SYSTEM_URL = "https://haderos-mvp.manus.space"

def create_founder_pdf(founder, output_path):
    """Generate personalized PDF for a founder"""
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Container for PDF elements
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Arabic-friendly styles
    title_style = ParagraphStyle(
        'ArabicTitle',
        parent=styles['Title'],
        fontName='Arabic-Bold',
        fontSize=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=20,
    )
    
    heading_style = ParagraphStyle(
        'ArabicHeading',
        parent=styles['Heading1'],
        fontName='Arabic-Bold',
        fontSize=16,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=12,
        spaceBefore=20,
    )
    
    body_style = ParagraphStyle(
        'ArabicBody',
        parent=styles['Normal'],
        fontName='Arabic',
        fontSize=12,
        alignment=TA_RIGHT,
        leading=18,
    )
    
    code_style = ParagraphStyle(
        'Code',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=11,
        alignment=TA_CENTER,
        backColor=colors.HexColor('#f3f4f6'),
        borderPadding=10,
    )
    
    # ====================
    # PAGE 1: WELCOME & CREDENTIALS
    # ====================
    
    # Logo/Header
    story.append(Paragraph("🚀 HaderOS AI", title_style))
    story.append(Paragraph("نظام إدارة أعمال بضمير", heading_style))
    story.append(Spacer(1, 1*cm))
    
    # Welcome message
    welcome_text = f"""
    <b>مرحباً {founder['fullName']}</b><br/>
    <br/>
    يسعدنا انضمامك كمؤسس في HaderOS AI - منصة إدارة الأعمال الذكية المدعومة بالذكاء الاصطناعي والحوكمة الأخلاقية.<br/>
    <br/>
    هذا المستند يحتوي على جميع المعلومات التي تحتاجها للبدء، بما في ذلك بيانات الدخول الخاصة بك وطرق التواصل المباشر معنا.
    """
    story.append(Paragraph(welcome_text, body_style))
    story.append(Spacer(1, 0.8*cm))
    
    # Credentials box
    story.append(Paragraph("🔐 بيانات الدخول الخاصة بك", heading_style))
    
    credentials_data = [
        ['البيان', 'القيمة'],
        ['الاسم الكامل', founder['fullName']],
        ['الدور', founder['title']],
        ['البريد الإلكتروني', founder['email']],
        ['اسم المستخدم', founder['username']],
        ['كلمة المرور', founder['password']],
        ['صلاحية كلمة المرور', '31 ديسمبر 2025'],
        ['رابط النظام', SYSTEM_URL],
    ]
    
    credentials_table = Table(credentials_data, colWidths=[6*cm, 10*cm])
    credentials_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Arabic-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('FONTNAME', (0, 1), (-1, -1), 'Arabic'),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    
    story.append(credentials_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Security notice
    security_notice = """
    <b>⚠️ تنبيه أمني مهم:</b><br/>
    • كلمة المرور تتغير تلقائياً كل شهر لضمان أقصى درجات الأمان<br/>
    • ستصلك كلمة المرور الجديدة عبر البريد الإلكتروني في بداية كل شهر<br/>
    • لا تشارك بيانات الدخول مع أي شخص<br/>
    • يتم تسجيل جميع عمليات الدخول للمراجعة الأمنية
    """
    story.append(Paragraph(security_notice, body_style))
    
    # Page break
    story.append(PageBreak())
    
    # ====================
    # PAGE 2: SYSTEM OVERVIEW & SUPPORT
    # ====================
    
    story.append(Paragraph("📊 نظرة عامة على HaderOS", heading_style))
    
    overview_text = """
    <b>HaderOS AI</b> هو نظام إدارة أعمال متكامل مصمم خصيصاً لشركة NOW SHOES، يجمع بين:<br/>
    <br/>
    <b>1. البحث المرئي بالذكاء الاصطناعي:</b><br/>
    • التعرف على المنتجات من خلال الكاميرا أو الصور<br/>
    • مسح الباركود/QR للوصول السريع<br/>
    • مطابقة المنتجات المشابهة تلقائياً<br/>
    <br/>
    <b>2. إدارة الشحنات الموحدة:</b><br/>
    • تكامل مع Bosta و J&T Express و GT Express و Eshhnly<br/>
    • تتبع الشحنات في الوقت الفعلي<br/>
    • مطابقة تحويلات COD البنكية تلقائياً<br/>
    <br/>
    <b>3. النظام المالي الشامل:</b><br/>
    • تتبع المصروفات والإيرادات<br/>
    • إدارة رواتب 100 موظف<br/>
    • تقارير P&L تلقائية<br/>
    • إدارة الاشتراكات والإعلانات<br/>
    <br/>
    <b>4. نظام الموارد البشرية:</b><br/>
    • حسابات شهرية للموظفين<br/>
    • التحقق من المستندات بالذكاء الاصطناعي<br/>
    • نظام OTP للأمان<br/>
    <br/>
    <b>5. استيراد المنتجات:</b><br/>
    • استيراد 1,019 منتج من Google Sheets<br/>
    • ترحيل الصور تلقائياً من Google Drive إلى S3<br/>
    • توليد embeddings للبحث المرئي
    """
    story.append(Paragraph(overview_text, body_style))
    story.append(Spacer(1, 0.8*cm))
    
    # Support section
    story.append(Paragraph("📞 قنوات الدعم المباشر", heading_style))
    
    support_text = f"""
    <b>نحن هنا لمساعدتك 24/7!</b><br/>
    <br/>
    <b>واتساب (الأسرع):</b><br/>
    {SUPPORT_WHATSAPP}<br/>
    <br/>
    <b>البريد الإلكتروني:</b><br/>
    {SUPPORT_EMAIL}<br/>
    <br/>
    <b>داخل النظام:</b><br/>
    • استخدم زر "تواصل معنا" في أي صفحة<br/>
    • أو افتح تذكرة دعم من لوحة التحكم<br/>
    <br/>
    <b>وقت الاستجابة:</b><br/>
    • واتساب: فوري (أقل من 5 دقائق)<br/>
    • البريد الإلكتروني: خلال ساعة<br/>
    • تذاكر الدعم: خلال ساعتين
    """
    story.append(Paragraph(support_text, body_style))
    
    # Page break
    story.append(PageBreak())
    
    # ====================
    # PAGE 3: TROUBLESHOOTING GUIDE
    # ====================
    
    story.append(Paragraph("🔧 دليل استكشاف الأخطاء", heading_style))
    
    troubleshooting_text = """
    <b>مشكلة: لا أستطيع تسجيل الدخول</b><br/>
    ✅ تأكد من كتابة اسم المستخدم وكلمة المرور بشكل صحيح (حساسة لحالة الأحرف)<br/>
    ✅ تأكد من أن كلمة المرور لم تنتهِ صلاحيتها (تتغير شهرياً)<br/>
    ✅ جرّب مسح ذاكرة التخزين المؤقت (Cache) للمتصفح<br/>
    ✅ تواصل معنا عبر واتساب للحصول على كلمة مرور جديدة<br/>
    <br/>
    <b>مشكلة: البحث المرئي لا يعمل</b><br/>
    ✅ تأكد من منح إذن الكاميرا للمتصفح<br/>
    ✅ تأكد من الإضاءة الجيدة عند التقاط الصورة<br/>
    ✅ جرّب رفع صورة بدلاً من استخدام الكاميرا<br/>
    ✅ تأكد من أن المنتج موجود في قاعدة البيانات<br/>
    <br/>
    <b>مشكلة: لا أرى البيانات المحدثة</b><br/>
    ✅ اضغط F5 أو Ctrl+R لتحديث الصفحة<br/>
    ✅ تأكد من اتصال الإنترنت<br/>
    ✅ تحقق من أن الخادم يعمل (زر الصحة في الأسفل)<br/>
    <br/>
    <b>مشكلة: رسالة خطأ غير مفهومة</b><br/>
    ✅ التقط صورة للشاشة (Screenshot)<br/>
    ✅ أرسلها لنا عبر واتساب مع شرح مختصر<br/>
    ✅ سنرد عليك فوراً بالحل<br/>
    <br/>
    <b>مشكلة: أحتاج ميزة جديدة</b><br/>
    ✅ أرسل لنا وصف الميزة المطلوبة<br/>
    ✅ سنقيّم الطلب ونعطيك تقدير الوقت<br/>
    ✅ معظم الطلبات تُنفذ خلال 24-48 ساعة
    """
    story.append(Paragraph(troubleshooting_text, body_style))
    story.append(Spacer(1, 0.8*cm))
    
    # Quick start guide
    story.append(Paragraph("🚀 دليل البدء السريع", heading_style))
    
    quickstart_text = """
    <b>خطوات البدء (5 دقائق):</b><br/>
    <br/>
    <b>1. تسجيل الدخول:</b><br/>
    • افتح الرابط: """ + SYSTEM_URL + """<br/>
    • أدخل اسم المستخدم وكلمة المرور من الصفحة الأولى<br/>
    <br/>
    <b>2. استكشف لوحة التحكم:</b><br/>
    • الصفحة الرئيسية تعرض ملخص النظام<br/>
    • القائمة الجانبية تحتوي على جميع الأقسام<br/>
    <br/>
    <b>3. جرّب البحث المرئي:</b><br/>
    • اذهب إلى "البحث المرئي"<br/>
    • صوّر أي حذاء في المخزن<br/>
    • شاهد النتائج الفورية!<br/>
    <br/>
    <b>4. استورد المنتجات (مرة واحدة):</b><br/>
    • اذهب إلى "استيراد المنتجات"<br/>
    • الصق رابط Google Sheet<br/>
    • اضغط "استيراد"<br/>
    <br/>
    <b>5. ابدأ العمل!</b><br/>
    • النظام جاهز للاستخدام الفوري<br/>
    • جميع الميزات نشطة<br/>
    • الدعم متاح 24/7
    """
    story.append(Paragraph(quickstart_text, body_style))
    story.append(Spacer(1, 1*cm))
    
    # Footer
    footer_text = f"""
    <br/>
    <br/>
    ────────────────────────────────────────<br/>
    <b>HaderOS AI</b> - Powered by haderosai.com<br/>
    تاريخ الإصدار: {datetime.now().strftime('%d %B %Y')}<br/>
    مستند خاص بـ: {founder['fullName']}<br/>
    ────────────────────────────────────────
    """
    story.append(Paragraph(footer_text, ParagraphStyle(
        'Footer',
        parent=body_style,
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.grey,
    )))
    
    # Build PDF
    doc.build(story)
    print(f"✅ PDF created for {founder['fullName']}: {output_path}")

# Generate PDFs for all founders
print("🎨 Generating personalized PDF documents for 5 founders...\n")

for founder in founders:
    output_filename = f"/home/ubuntu/haderos-mvp/founder_pdfs/{founder['username']}_onboarding.pdf"
    
    # Create output directory if it doesn't exist
    import os
    os.makedirs('/home/ubuntu/haderos-mvp/founder_pdfs', exist_ok=True)
    
    create_founder_pdf(founder, output_filename)

print(f"\n✅ All PDFs generated successfully!")
print(f"📁 Location: /home/ubuntu/haderos-mvp/founder_pdfs/")
print(f"\n📤 Next: Send each PDF to the respective founder via WhatsApp or Email")
