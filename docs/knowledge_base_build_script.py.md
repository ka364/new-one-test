> **Generated**: 2025-11-30T20:11:21.214Z
> **Language**: English
> **Purpose**: Generate a comprehensive Python script for building the SQLite knowledge base (kaia_knowledge.db) by ingesting content from the existing .md files: HaderOS_Architecture_Arabic.md (architecture and technical details), technical_specifications_source.md (technical specs), governance_content.md (governance framework), and code_content.md (code examples). The database schema should include tables for documents (id, title, content, type, tags), chunks (id, document_id, content, summary, keywords), and relations (id, from_chunk, to_chunk, relation_type). Ensure Arabic content is handled with UTF-8, and include functions to insert parsed content from markdown files, extract key concepts, and create cross-references between architecture, specs, governance, and code for efficient querying. The script should be executable and create the DB if it doesn't exist.

# SQLite Knowledge Base Builder for HaderOS Project

## Complete Python Script: `build_knowledge_base.py`

```python
#!/usr/bin/env python3
"""
HaderOS Knowledge Base Builder
Creates and populates kaia_knowledge.db from markdown documentation files.
Handles Arabic content with UTF-8 encoding and creates semantic relationships.
"""

import sqlite3
import re
import hashlib
from pathlib import Path
from typing import List, Dict, Tuple, Set
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class Document:
    """Document metadata structure"""
    title: str
    content: str
    doc_type: str
    tags: List[str]
    file_path: str

@dataclass
class Chunk:
    """Content chunk structure"""
    document_id: int
    content: str
    summary: str
    keywords: List[str]
    section_title: str
    chunk_index: int

@dataclass
class Relation:
    """Relationship between chunks"""
    from_chunk: int
    to_chunk: int
    relation_type: str
    confidence: float

class KnowledgeBaseBuilder:
    """Main class for building the HaderOS knowledge base"""
    
    def __init__(self, db_path: str = "kaia_knowledge.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
        # Configuration for chunk sizes
        self.max_chunk_size = 1000  # characters
        self.overlap_size = 200  # characters overlap between chunks
        
        # Keyword patterns for relationship detection
        self.relation_patterns = {
            'implements': [
                r'implement(?:s|ing|ation)',
                r'realize(?:s|ing)',
                r'code\s+example',
                r'تنفيذ',
                r'تطبيق'
            ],
            'defines': [
                r'define(?:s|d)',
                r'specification',
                r'requirement',
                r'معمارية',
                r'مواصفات'
            ],
            'governs': [
                r'governance',
                r'policy',
                r'rule',
                r'guideline',
                r'حوكمة',
                r'سياسة'
            ],
            'references': [
                r'see\s+(?:also|section)',
                r'refer(?:s|ence)',
                r'related\s+to',
                r'انظر',
                r'مرجع'
            ],
            'depends_on': [
                r'depend(?:s|ency)',
                r'require(?:s|ment)',
                r'need(?:s|ed)',
                r'يعتمد',
                r'يتطلب'
            ]
        }
        
    def connect(self):
        """Establish database connection with UTF-8 support"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute("PRAGMA encoding = 'UTF-8'")
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.cursor = self.conn.cursor()
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.commit()
            self.conn.close()
            
    def create_schema(self):
        """Create database schema with proper indexing"""
        
        # Documents table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT NOT NULL,
                tags TEXT NOT NULL,
                file_path TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                content_hash TEXT UNIQUE
            )
        """)
        
        # Chunks table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                keywords TEXT,
                section_title TEXT,
                chunk_index INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        """)
        
        # Relations table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_chunk INTEGER NOT NULL,
                to_chunk INTEGER NOT NULL,
                relation_type TEXT NOT NULL,
                confidence REAL DEFAULT 1.0,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_chunk) REFERENCES chunks(id) ON DELETE CASCADE,
                FOREIGN KEY (to_chunk) REFERENCES chunks(id) ON DELETE CASCADE,
                UNIQUE(from_chunk, to_chunk, relation_type)
            )
        """)
        
        # Create indexes for performance
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)
        """)
        
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id)
        """)
        
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_chunk)
        """)
        
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_chunk)
        """)
        
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(relation_type)
        """)
        
        # Full-text search virtual tables
        self.cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
                title, content, tags,
                content='documents',
                content_rowid='id',
                tokenize='unicode61 remove_diacritics 2'
            )
        """)
        
        self.cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                content, summary, keywords,
                content='chunks',
                content_rowid='id',
                tokenize='unicode61 remove_diacritics 2'
            )
        """)
        
        # Triggers to keep FTS tables in sync
        self.cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
                INSERT INTO documents_fts(rowid, title, content, tags)
                VALUES (new.id, new.title, new.content, new.tags);
            END
        """)
        
        self.cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
                INSERT INTO chunks_fts(rowid, content, summary, keywords)
                VALUES (new.id, new.content, new.summary, new.keywords);
            END
        """)
        
        self.conn.commit()
        print("✓ Database schema created successfully")
        
    def read_markdown_file(self, file_path: str) -> str:
        """Read markdown file with UTF-8 encoding"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print(f"⚠ Warning: File not found: {file_path}")
            return ""
        except Exception as e:
            print(f"✗ Error reading {file_path}: {e}")
            return ""
            
    def parse_markdown_sections(self, content: str) -> List[Tuple[str, str]]:
        """Parse markdown into sections based on headers"""
        sections = []
        current_section = ""
        current_content = []
        
        lines = content.split('\n')
        
        for line in lines:
            # Check for headers (# to ######)
            header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
            
            if header_match:
                # Save previous section
                if current_section:
                    sections.append((current_section, '\n'.join(current_content)))
                
                # Start new section
                current_section = header_match.group(2).strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Add last section
        if current_section:
            sections.append((current_section, '\n'.join(current_content)))
            
        return sections
        
    def extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text (both English and Arabic)"""
        # Remove markdown syntax
        text = re.sub(r'[#*`\[\]()]', ' ', text)
        
        # Split into words
        words = re.findall(r'\b\w+\b', text, re.UNICODE)
        
        # Filter keywords (length > 3, not common words)
        common_words = {
            'the', 'and', 'for', 'with', 'that', 'this', 'from',
            'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي'
        }
        
        keywords = [
            word.lower() for word in words 
            if len(word) > 3 and word.lower() not in common_words
        ]
        
        # Count frequency and return top keywords
        keyword_freq = {}
        for kw in keywords:
            keyword_freq[kw] = keyword_freq.get(kw, 0) + 1
            
        sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)
        return [kw for kw, _ in sorted_keywords[:20]]  # Top 20 keywords
        
    def generate_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a simple extractive summary"""
        # Remove markdown and extra whitespace
        text = re.sub(r'[#*`]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Take first meaningful sentences
        sentences = re.split(r'[.!?]\s+', text)
        summary = []
        length = 0
        
        for sentence in sentences:
            if length + len(sentence) > max_length:
                break
            summary.append(sentence)
            length += len(sentence)
            
        return '. '.join(summary) + '.' if summary else text[:max_length]
        
    def chunk_content(self, content: str, section_title: str) -> List[str]:
        """Split content into overlapping chunks"""
        if len(content) <= self.max_chunk_size:
            return [content]
            
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + self.max_chunk_size
            
            # Try to break at sentence boundary
            if end < len(content):
                sentence_end = content.rfind('.', start, end)
                if sentence_end > start + self.max_chunk_size // 2:
                    end = sentence_end + 1
                    
            chunks.append(content[start:end])
            start = end - self.overlap_size
            
        return chunks
        
    def insert_document(self, doc: Document) -> int:
        """Insert document and return its ID"""
        # Generate content hash for duplicate detection
        content_hash = hashlib.sha256(doc.content.encode('utf-8')).hexdigest()
        
        # Check if document already exists
        self.cursor.execute(
            "SELECT id FROM documents WHERE content_hash = ?",
            (content_hash,)
        )
        existing = self.cursor.fetchone()
        
        if existing:
            print(f"  ⚠ Document already exists: {doc.title}")
            return existing[0]
            
        # Insert new document
        self.cursor.execute("""
            INSERT INTO documents (title, content, type, tags, file_path, content_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            doc.title,
            doc.content,
            doc.doc_type,
            json.dumps(doc.tags, ensure_ascii=False),
            doc.file_path,
            content_hash
        ))
        
        doc_id = self.cursor.lastrowid
        print(f"  ✓ Inserted document: {doc.title} (ID: {doc_id})")
        return doc_id
        
    def insert_chunks(self, doc_id: int, content: str, doc_type: str) -> List[int]:
        """Parse content into chunks and insert them"""
        sections = self.parse_markdown_sections(content)
        chunk_ids = []
        
        for section_title, section_content in sections:
            if not section_content.strip():
                continue
                
            # Split section into chunks
            text_chunks = self.chunk_content(section_content, section_title)
            
            for idx, chunk_text in enumerate(text_chunks):
                # Extract metadata
                keywords = self.extract_keywords(chunk_text)
                summary = self.generate_summary(chunk_text)
                
                # Insert chunk
                self.cursor.execute("""
                    INSERT INTO chunks (
                        document_id, content, summary, keywords, 
                        section_title, chunk_index
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    doc_id,
                    chunk_text,
                    summary,
                    json.dumps(keywords, ensure_ascii=False),
                    section_title,
                    idx
                ))
                
                chunk_ids.append(self.cursor.lastrowid)
                
        print(f"  ✓ Created {len(chunk_ids)} chunks")
        return chunk_ids
        
    def detect_relations(self, chunk_id: int, chunk_content: str, 
                        all_chunks: List[Tuple[int, str, str]]) -> List[Relation]:
        """Detect relationships between chunks"""
        relations = []
        
        for other_id, other_content, other_type in all_chunks:
            if other_id == chunk_id:
                continue
                
            # Check each relation type
            for rel_type, patterns in self.relation_patterns.items():
                confidence = 0.0
                
                for pattern in patterns:
                    # Check if pattern exists in chunk
                    if re.search(pattern, chunk_content, re.IGNORECASE):
                        # Check for keyword overlap with other chunk
                        chunk_keywords = set(self.extract_keywords(chunk_content))
                        other_keywords = set(self.extract_keywords(other_content))
                        
                        overlap = len(chunk_keywords & other_keywords)
                        if overlap > 2:  # At least 3 common keywords
                            confidence = min(1.0, overlap / 10.0)
                            break
                            
                if confidence > 0.3:  # Threshold for relation
                    relations.append(Relation(
                        from_chunk=chunk_id,
                        to_chunk=other_id,
                        relation_type=rel_type,
                        confidence=confidence
                    ))
                    
        return relations
        
    def insert_relations(self, relations: List[Relation]):
        """Insert detected relations"""
        for rel in relations:
            try:
                self.cursor.execute("""
                    INSERT OR IGNORE INTO relations 
                    (from_chunk, to_chunk, relation_type, confidence)
                    VALUES (?, ?, ?, ?)
                """, (rel.from_chunk, rel.to_chunk, rel.relation_type, rel.confidence))
            except sqlite3.IntegrityError:
                pass  # Relation already exists
                
    def process_file(self, file_path: str, doc_type: str, tags: List[str]) -> int:
        """Process a single markdown file"""
        print(f"\n📄 Processing: {file_path}")
        
        # Read content
        content = self.read_markdown_file(file_path)
        if not content:
            return 

---
*Generated by Flowith OS Deep Thinking*