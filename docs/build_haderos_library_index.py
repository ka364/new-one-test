import csv
from pathlib import Path

INPUT_CSV = "inventory_files_auto.csv"
OUTPUT_INDEX = "haderos_library_index.csv"
OUTPUT_CORE = "haderos_core_library.csv"


def decide_shelf(row):
    rel = row["relative_path"].lower()
    top = row["top_folder"].lower()
    name = row["file_name"].lower()
    ext = row["extension"].lower()
    guess = (row.get("library_category_guess") or "").lower()

    # 01: الدستور والحوكمة
    if any(k in name for k in [
        "constitution", "conistitution", "governance", "raci", "charter"
    ]):
        return "01_constitution_governance"

    # 02: المعمارية
    if any(k in name for k in [
        "architecture", "arch_", "haderos_architecture", "technical_spec", "technical_specs"
    ]):
        return "02_architecture_design"

    # 03: الاستراتيجية والخطط
    if any(k in name for k in [
        "roadmap", "strategic_review", "syn-2025", "summary_of_achievements",
        "executive_brief", "investor_onepager", "pilot_"
    ]):
        return "03_strategy_roadmap"

    # 04: الكود والسيرفرات
    if ext in [".py", ".js", ".ts", ".tsx"]:
        if any(k in name for k in ["server", "api", "builder", "kb_", "kaia", "haderos_"]):
            return "04_engine_code_servers"

    # 05: قاعدة المعرفة
    if "data" in top or "knowledge_base" in rel or "kb_" in name:
        return "05_knowledge_base"

    # 06: وثائق عامة
    if ext in [".doc", ".docx", ".pdf", ".xlsx", ".xls"]:
        return "06_docs_reports"
    if "docs" in top:
        return "06_docs_reports"

    # 07: إدارة مشروع / جرد / Audit
    if any(k in name for k in ["project_map", "inventory", "audit", "manifest"]):
        return "07_project_management_audit"

    # 08: واجهة Web / Hub
    if ext in [".html", ".css"]:
        return "08_frontend_web"
    if any(k in rel for k in ["web/", "haderos_project_hub", "hub"]):
        return "08_frontend_web"

    # 09: وكلاء / أتمتة
    if any(k in name for k in ["agent", "task", "sync_", "automation"]):
        return "09_agents_automation"

    # 99: أرشيف / قديم
    if top.startswith("_") or any(k in name for k in ["old", "backup", "draft"]):
        return "99_archive_misc"

    # fallback: استخدم التخمين لو موجود
    if "architecture" in guess:
        return "02_architecture_design"
    if "code" in guess:
        return "04_engine_code_servers"
    if "web" in guess or "hub" in guess:
        return "08_frontend_web"
    if "docs" in guess:
        return "06_docs_reports"

    return "99_archive_misc"


def decide_importance(row, shelf):
    name = row["file_name"].lower()
    ext = row["extension"].lower()
    rel = row["relative_path"].lower()

    # 💎 Core (1): ملفات الدستور، المعمارية، الاستراتيجية، وملفات المحرك الأساسية
    if shelf in (
        "01_constitution_governance",
        "02_architecture_design",
        "03_strategy_roadmap",
    ):
        return 1

    # Core لمحرك HaderOS / KAIA
    if shelf == "04_engine_code_servers":
        if any(k in name for k in [
            "haderos_server", "kb_server", "alfurqan_api", "kaia_builder"
        ]):
            return 1

    # 📚 Supporting (2): بقية الكود، web, kb, docs المهمة
    if shelf in (
        "04_engine_code_servers",
        "05_knowledge_base",
        "06_docs_reports",
        "07_project_management_audit",
        "08_frontend_web",
        "09_agents_automation",
    ):
        return 2

    # 🧹 Noise / منخفض الأهمية (3)
    if shelf == "99_archive_misc":
        return 3

    # fallback
    if ext in [".log", ".tmp"]:
        return 3

    return 2


def main():
    input_path = Path(INPUT_CSV)
    if not input_path.exists():
        print(f"❌ لم يتم العثور على {INPUT_CSV}")
        return

    rows = []
    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            shelf = decide_shelf(row)
            importance = decide_importance(row, shelf)
            row["library_shelf"] = shelf
            row["importance_level"] = str(importance)
            row["is_core"] = "yes" if importance == 1 else "no"
            rows.append(row)

    if not rows:
        print("⚠️ لا توجد صفوف في الملف!")
        return

    # اكتب الفهرس الكامل
    fieldnames = list(rows[0].keys())
    with open(OUTPUT_INDEX, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # اكتب المكتبة الذهبية فقط
    core_rows = [r for r in rows if r["is_core"] == "yes"]
    with open(OUTPUT_CORE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(core_rows)

    print("✅ Written:", OUTPUT_INDEX, "with", len(rows), "files")
    print("💎 Written:", OUTPUT_CORE, "with", len(core_rows), "core files")


if __name__ == "__main__":
    main()
