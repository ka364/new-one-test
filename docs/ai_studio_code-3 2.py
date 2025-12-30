import sqlite3
import json
from datetime import datetime

# 1. تهيئة الاتصال بقاعدة المعرفة (Brain Initialization)
db_name = "kaia_knowledge.db"
conn = sqlite3.connect(db_name)
cursor = conn.cursor()

print(f"🚀 Initializing KAIA Knowledge Core: {db_name}...")

# ---------------------------------------------------------
# 2. بناء الهيكل العظمي (Schema Design)
# ---------------------------------------------------------

# الجدول الأول: الذاكرة الدستورية (الأخلاق والقيم)
cursor.execute('''
CREATE TABLE IF NOT EXISTS constitutional_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    principle_name TEXT NOT NULL,
    description TEXT,
    source TEXT, -- (Quran, Trust Charter, MAKC)
    enforcement_level TEXT -- (Blocking, Advisory, Log_Only)
)
''')

# الجدول الثاني: مصفوفة العمليات (RACI Matrix)
cursor.execute('''
CREATE TABLE IF NOT EXISTS operational_matrix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name TEXT NOT NULL,
    responsible_role TEXT, -- Who does the work? (AI / Human)
    accountable_role TEXT, -- Who signs off?
    ai_intervention_level TEXT -- (Auto, Co-pilot, None)
)
''')

# الجدول الثالث: الفهرس القرآني (المحرك الدلالي)
cursor.execute('''
CREATE TABLE IF NOT EXISTS quranic_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_key TEXT NOT NULL, -- e.g., 'ISRAF', 'AMANAH'
    verse_reference TEXT,
    operational_guidance TEXT
)
''')

# ---------------------------------------------------------
# 3. حقن البيانات (Data Injection)
# ---------------------------------------------------------

print("💉 Injecting Strategic Data...")

# أ. بيانات الدستور (من وثائق الحوكمة)
constitution_data = [
    ("Anti-Tatfif", "Prevention of fraud or short-changing in metrics/products.", "Quran (Al-Mutaffifin)", "Blocking"),
    ("Anti-Israf", "Prevention of resource waste or excessive cloud usage.", "Quran (Al-A'raf)", "Advisory"),
    ("Sidq", "Truthfulness in data reporting and UI promises (OHI Index).", "Trust Charter", "Blocking"),
    ("Two-Person Rule", "High-value transactions require human + AI sign-off.", "MAKC Codex", "Blocking")
]
cursor.executemany('INSERT INTO constitutional_memory (principle_name, description, source, enforcement_level) VALUES (?, ?, ?, ?)', constitution_data)

# ب. بيانات مصفوفة RACI (من خطة العمل)
raci_data = [
    ("Data Ingestion & Cleaning", "KAIA (AI)", "Data Engineer", "Auto"),
    ("Strategic Decision Making", "CEO (Human)", "Board", "Co-pilot"),
    ("Daily Report Generation", "KAIA (AI)", "Ops Manager", "Auto"),
    ("Ethical Audit (OHI Check)", "KAIA (AI)", "Chief Architect", "Auto"),
    ("Financial Transfer Approval", "Finance Mgr", "CEO", "None")
]
cursor.executemany('INSERT INTO operational_matrix (task_name, responsible_role, accountable_role, ai_intervention_level) VALUES (?, ?, ?, ?)', raci_data)

# ج. بيانات الفهرس القرآني (من المحرك القديم)
quran_data = [
    ("MONOPOLY", "Surah Al-Hashr: 7", "Capital should not circulate only among the rich. Ensure fair distribution algorithms."),
    ("CONTRACTS", "Surah Al-Ma'idah: 1", "Fulfill all obligations. Smart contracts must be immutable once signed."),
    ("CONSULTATION", "Surah Ash-Shura: 38", "Decisions should be made via Shura. Enable voting mechanisms in dashboard.")
]
cursor.executemany('INSERT INTO quranic_index (concept_key, verse_reference, operational_guidance) VALUES (?, ?, ?)', quran_data)

# ---------------------------------------------------------
# 4. الحفظ والإغلاق (Commit & Seal)
# ---------------------------------------------------------
conn.commit()
print("✅ Knowledge Base built successfully!")
print(f"   - Rules Implanted: {len(constitution_data)}")
print(f"   - Tasks Assigned: {len(raci_data)}")
print(f"   - Quranic Concepts: {len(quran_data)}")

# عرض عينة للتأكد
print("\n🔍 Verifying 'Operational Matrix' Data:")
for row in cursor.execute('SELECT * FROM operational_matrix'):
    print(row)

conn.close()