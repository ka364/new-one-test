import json
import re
import sqlite3
import shlex
from collections import defaultdict
from nltk.stem.isri import ISRIStemmer
from fastapi import FastAPI, HTTPException
from typing import List, Dict, Any

class QuranicEngine:
    """
    محرك لتحميل بيانات القرآن الكريم من ملف JSON، مع دعم:
      - استخراج جذور الكلمات وبناء فهرس عكسي (inverted index)
      - بحث منطقي (AND/OR) على الجذور والنصوص مع دعم الاقتباسات للبحث الدقيق
      - بحث نصي حرفي (exact match)
      - تخزين الفهرس على القرص باستخدام SQLite لتحسين الأداء
    """
    def __init__(
        self,
        json_file_path: str = 'quran-data.json',
        sqlite_path: str = 'quran_index.db',
        use_sqlite: bool = False
    ):
        # تحميل بيانات القرآن
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.surahs = data.get('surahs', [])
            print(f"✔ تم تحميل القرآن الكريم ({len(self.surahs)} سورة).")
        except Exception as e:
            print(f"✖ خطأ في التحميل: {e}")
            self.surahs = []

        # إعداد المستخرج والفهرس
        self.stemmer = ISRIStemmer()
        self.use_sqlite = use_sqlite
        self.sqlite_path = sqlite_path

        if self.use_sqlite:
            # ربط بقاعدة SQLite
            self.conn = sqlite3.connect(self.sqlite_path)
            self._init_db()
            self._populate_db()
        else:
            # فهرس عكسي في الذاكرة
            self.inverted_index = defaultdict(list)
            self._build_index()

    def _normalize(self, text: str) -> str:
        text = re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]', '', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text

    def _build_index(self):
        """بناء الفهرس العكسي في الذاكرة لكل جذر -> قائمة مراجع"""
        for surah in self.surahs:
            s_num = surah['number']
            s_name = surah['name']
            for verse in surah['verses']:
                v_num = verse['number']
                text = verse['text']
                clean = self._normalize(text)
                for w in clean.split():
                    root = self.stemmer.stem(w)
                    self.inverted_index[root].append({
                        'surah_number': s_num,
                        'surah_name': s_name,
                        'verse_number': v_num,
                        'text': text
                    })
        print(f"✔ تم بناء الفهرس في الذاكرة لعدد جذور: {len(self.inverted_index)}")

    def _init_db(self):
        """تهيئة جداول SQLite إذا لم تكن موجودة"""
        c = self.conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS verses (id INTEGER PRIMARY KEY, surah_number INTEGER, surah_name TEXT, verse_number INTEGER, text TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS root_verse (root TEXT, verse_id INTEGER, FOREIGN KEY(verse_id) REFERENCES verses(id))")
        self.conn.commit()

    def _populate_db(self):
        """إدخال البيانات في SQLite إذا كانت الجداول فارغة"""
        c = self.conn.cursor()
        c.execute("SELECT COUNT(*) FROM verses")
        if c.fetchone()[0] == 0:
            for surah in self.surahs:
                s_num = surah['number']
                s_name = surah['name']
                for verse in surah['verses']:
                    v_num = verse['number']
                    text = verse['text']
                    c.execute(
                        "INSERT INTO verses (surah_number, surah_name, verse_number, text) VALUES (?, ?, ?, ?)",
                        (s_num, s_name, v_num, text)
                    )
                    vid = c.lastrowid
                    clean = self._normalize(text)
                    for w in clean.split():
                        root = self.stemmer.stem(w)
                        c.execute(
                            "INSERT INTO root_verse (root, verse_id) VALUES (?, ?)",
                            (root, vid)
                        )
            self.conn.commit()
            print("✔ تم تعبئة قاعدة SQLite بالفهرس.")
        else:
            print("✔ قاعدة SQLite موجودة مسبقاً ومعبأة.")

    def get_surah(self, surah_number: int) -> Dict[str, Any]:
        if 1 <= surah_number <= len(self.surahs):
            return self.surahs[surah_number - 1]
        return {}

    def get_verse(self, surah_number: int, verse_number: int) -> str:
        surah = self.get_surah(surah_number)
        for v in surah.get('verses', []):
            if v['number'] == verse_number:
                return v['text']
        return ""

    def get_all_verses(self):
        for surah in self.surahs:
            for verse in surah['verses']:
                yield {
                    'surah_number': surah['number'],
                    'surah_name': surah['name'],
                    'verse_number': verse['number'],
                    'text': verse['text']
                }

    def search_by_root(self, root: str) -> List[Dict[str, Any]]:
        if self.use_sqlite:
            c = self.conn.cursor()
            c.execute(
                "SELECT v.surah_number, v.surah_name, v.verse_number, v.text"
                " FROM verses v"
                " JOIN root_verse rv ON v.id = rv.verse_id"
                " WHERE rv.root = ?",
                (root,)
            )
            return [dict(zip([col[0] for col in c.description], row)) for row in c.fetchall()]
        return self.inverted_index.get(root, [])

    def search_exact(self, phrase: str) -> List[Dict[str, Any]]:
        results = []
        if self.use_sqlite:
            c = self.conn.cursor()
            pattern = f"%{phrase}%"
            c.execute(
                "SELECT surah_number, surah_name, verse_number, text"
                " FROM verses WHERE text LIKE ?",
                (pattern,)
            )
            results = [dict(zip([col[0] for col in c.description], row)) for row in c.fetchall()]
        else:
            for v in self.get_all_verses():
                if phrase in v['text']:
                    results.append(v)
        return results

    def search_logical(
        self,
        query: str,
        operator: str = 'AND',
        by_root: bool = True
    ) -> List[Dict[str, Any]]:
        """
        بحث منطقي (AND/OR) يدعم:
         - الاقتباسات للبحث الدقيق ("phrases with spaces")
         - الجذور (root) أو النص الحرفي للكلمات المفردة
        المعاملات:
        - query: نص الاستعلام، يمكن أن يحتوي على كلمات مفردة أو عبارات بين علامتي اقتباس.
        - operator: 'AND' أو 'OR'
        - by_root: إذا True يستخدم البحث بالجذر للمفردات غير المقتبسة، وإلا يستخدم البحث الحرفي لها.
        """
        # تقسيم الاستعلام إلى توكنات مع الحفاظ على العبارات المقتبسة
        tokens = re.findall(r'"[^"]+"|\S+', query)
        term_sets = []
        for token in tokens:
            if token.startswith('"') and token.endswith('"'):
                # اقتباس: بحث حرفي لعبارة كاملة
                phrase = token[1:-1]
                verses = self.search_exact(phrase)
            else:
                # كلمة مفردة
                clean = re.sub(r'[^\w\s]', '', token)
                if by_root:
                    root = self.stemmer.stem(clean)
                    verses = self.search_by_root(root)
                else:
                    verses = self.search_exact(clean)
            # تحويل لكل مرجع إلى مفتاح فريد
            term_sets.append({(v['surah_number'], v['verse_number'], v['text']) for v in verses})

        if not term_sets:
            return []
        # تقاطع أو اتحاد المجموعات حسب المعامل
        if operator.upper() == 'AND':
            common = set.intersection(*term_sets)
        else:
            common = set.union(*term_sets)

        # إعادة النتائج مع اسم السورة
        results = []
        for s_num, v_num, txt in common:
            surah = self.get_surah(s_num)
            results.append({
                'surah_number': s_num,
                'surah_name': surah.get('name', ''),
                'verse_number': v_num,
                'text': txt
            })
        return results

# ===== واجهة Web API باستخدام FastAPI =====
app = FastAPI(title="Quranic Search API")

# تفعيل المحرك مع SQLite
engine = QuranicEngine('quran-data.json', sqlite_path='quran_index.db', use_sqlite=True)

@app.get("/search/")
def api_search(q: str, mode: str = 'root', operator: str = 'AND'):
    """
    بحث عبر HTTP:
      - q: نص الاستعلام (مصطلحات مفصولة بمسافة أو عبارات بين اقتباسات)
      - mode: 'root' أو 'exact' (للحد من طريقة بحث المفردات)
      - operator: 'AND' أو 'OR'
    الاقتباسات تتجاوز mode وتنفذ بحثًا حرفيًا للعبارات.
    """
    if mode not in ('root', 'exact'):
        raise HTTPException(status_code=400, detail="mode must be 'root' or 'exact'")
    by_root = (mode == 'root')
    results = engine.search_logical(q, operator=operator, by_root=by_root)
    return {'count': len(results), 'results': results}

@app.get("/verse/{surah_number}/{verse_number}")
def api_get_verse(surah_number: int, verse_number: int):
    text = engine.get_verse(surah_number, verse_number)
    if not text:
        raise HTTPException(status_code=404, detail="Verse not found")
    return {'surah_number': surah_number, 'verse_number': verse_number, 'text': text}

@app.get("/surah/{surah_number}")
def api_get_surah(surah_number: int):
    surah = engine.get_surah(surah_number)
    if not surah:
        raise HTTPException(status_code=404, detail="Surah not found")
    return surah

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
