> **Generated**: 2025-11-30T20:11:35.318Z
> **Language**: English
> **Purpose**: Based on the user's explicit request to build a knowledge base and the choice of 'Option 1: SQLite DB', analyze the content of all core project documents: HaderOS Architecture ([[file:PBQW]]), Technical Specifications ([[file:JA9Z]]), Governance Content ([[file:HBMG]]), Code Content ([[file:R6ZB]]), and the RACI Plan ([[file:P8H7]]). 

Your task is to: 
1. Design a comprehensive SQLite database schema suitable for storing this information as a knowledge base for an AI. The schema should include tables for documents, content chunks, entities (like 'KAIA', 'Self-Healing'), and relationships between them. 
2. Generate a complete, executable Python script (`create_kb.py`). This script must use the `sqlite3` library to: 
    a. Create a new database file named `kaia_knowledge.db`. 
    b. Create the tables based on your designed schema. 
    c. Contain functions to read each of the specified markdown files. 
    d. Process and chunk the text from the files into logical paragraphs or sections. 
    e. Populate the database tables with the processed chunks, linking them to their source document. 
Your output should be a single markdown document containing both the schema design and the full Python script.

# HaderOS Knowledge Base: SQLite Database Design & Implementation

## Executive Summary

This document provides a comprehensive SQLite database schema and Python implementation script for building a knowledge base optimized for AI consumption of the HaderOS project documentation. The design emphasizes semantic relationships, multilingual support, and efficient retrieval of interconnected concepts.

---

## 1. Database Schema Design

### 1.1 Core Design Principles

The schema follows these architectural principles:

- **Document-centric organization**: Preserves source document context
- **Chunk-based retrieval**: Enables efficient semantic search
- **Entity-relationship mapping**: Captures key concepts and their connections
- **Metadata enrichment**: Supports filtering and contextual queries
- **Multilingual support**: Handles Arabic and English content

### 1.2 Entity-Relationship Diagram

```
Documents (1) ─────< (N) Chunks
    │                    │
    │                    │
    └──< (N) DocumentEntities ──> (N) Entities
                                      │
                                      │
                                  Relationships (N:N)
```

### 1.3 Table Specifications

#### **documents**
Stores metadata about source documents.

| Column | Type | Description |
|--------|------|-------------|
| `document_id` | INTEGER PRIMARY KEY | Unique identifier |
| `filename` | TEXT NOT NULL | Original filename |
| `document_type` | TEXT | Category (architecture, governance, code, etc.) |
| `language` | TEXT | Primary language (ar/en) |
| `title` | TEXT | Document title |
| `created_at` | TIMESTAMP | Import timestamp |
| `word_count` | INTEGER | Total word count |
| `metadata` | JSON | Additional structured metadata |

#### **chunks**
Contains processed text segments with embeddings.

| Column | Type | Description |
|--------|------|-------------|
| `chunk_id` | INTEGER PRIMARY KEY | Unique identifier |
| `document_id` | INTEGER | Foreign key to documents |
| `chunk_index` | INTEGER | Sequential position in document |
| `content` | TEXT NOT NULL | Actual text content |
| `content_type` | TEXT | Section type (paragraph, code, list, table) |
| `heading` | TEXT | Parent section heading |
| `char_count` | INTEGER | Character length |
| `tokens` | INTEGER | Estimated token count |
| `embedding` | BLOB | Vector embedding (optional) |

#### **entities**
Captures key concepts and terms.

| Column | Type | Description |
|--------|------|-------------|
| `entity_id` | INTEGER PRIMARY KEY | Unique identifier |
| `name` | TEXT UNIQUE NOT NULL | Entity name (e.g., "KAIA", "Self-Healing") |
| `entity_type` | TEXT | Category (system, concept, person, component) |
| `description` | TEXT | Brief explanation |
| `aliases` | JSON | Alternative names/spellings |

#### **document_entities**
Links entities to documents with context.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Unique identifier |
| `document_id` | INTEGER | Foreign key to documents |
| `entity_id` | INTEGER | Foreign key to entities |
| `chunk_id` | INTEGER | Specific chunk reference |
| `mention_count` | INTEGER | Frequency in document |
| `relevance_score` | REAL | Importance (0.0-1.0) |

#### **relationships**
Defines connections between entities.

| Column | Type | Description |
|--------|------|-------------|
| `relationship_id` | INTEGER PRIMARY KEY | Unique identifier |
| `entity_id_1` | INTEGER | First entity |
| `entity_id_2` | INTEGER | Second entity |
| `relationship_type` | TEXT | Nature of connection (implements, uses, manages) |
| `strength` | REAL | Connection strength (0.0-1.0) |
| `description` | TEXT | Contextual explanation |

---

## 2. Python Implementation Script

### 2.1 Complete Script: `create_kb.py`

```python
#!/usr/bin/env python3
"""
HaderOS Knowledge Base Builder
Creates and populates SQLite database from project documentation
"""

import sqlite3
import json
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple
import hashlib


class HaderOSKnowledgeBase:
    """Manages the HaderOS knowledge base creation and population."""
    
    def __init__(self, db_path: str = "kaia_knowledge.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection."""
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        print(f"✓ Connected to database: {self.db_path}")
        
    def create_schema(self):
        """Create all database tables."""
        
        # Documents table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                document_id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                document_type TEXT,
                language TEXT,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                word_count INTEGER,
                metadata TEXT
            )
        """)
        
        # Chunks table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                content_type TEXT,
                heading TEXT,
                char_count INTEGER,
                tokens INTEGER,
                embedding BLOB,
                FOREIGN KEY (document_id) REFERENCES documents(document_id)
            )
        """)
        
        # Entities table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS entities (
                entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                entity_type TEXT,
                description TEXT,
                aliases TEXT
            )
        """)
        
        # Document-Entity junction table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                entity_id INTEGER NOT NULL,
                chunk_id INTEGER,
                mention_count INTEGER DEFAULT 1,
                relevance_score REAL,
                FOREIGN KEY (document_id) REFERENCES documents(document_id),
                FOREIGN KEY (entity_id) REFERENCES entities(entity_id),
                FOREIGN KEY (chunk_id) REFERENCES chunks(chunk_id)
            )
        """)
        
        # Relationships table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS relationships (
                relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id_1 INTEGER NOT NULL,
                entity_id_2 INTEGER NOT NULL,
                relationship_type TEXT,
                strength REAL,
                description TEXT,
                FOREIGN KEY (entity_id_1) REFERENCES entities(entity_id),
                FOREIGN KEY (entity_id_2) REFERENCES entities(entity_id)
            )
        """)
        
        # Create indexes for performance
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chunks_document 
            ON chunks(document_id)
        """)
        
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_entities_name 
            ON entities(name)
        """)
        
        self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_doc_entities 
            ON document_entities(document_id, entity_id)
        """)
        
        self.conn.commit()
        print("✓ Database schema created successfully")
        
    def read_markdown_file(self, filepath: str) -> str:
        """Read markdown file content."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except Exception as e:
            print(f"✗ Error reading {filepath}: {e}")
            return ""
    
    def detect_language(self, text: str) -> str:
        """Detect primary language (simple heuristic)."""
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
        english_chars = len(re.findall(r'[a-zA-Z]', text))
        
        if arabic_chars > english_chars:
            return "ar"
        return "en"
    
    def extract_title(self, content: str) -> str:
        """Extract document title from markdown."""
        # Look for first H1 heading
        match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return "Untitled Document"
    
    def chunk_content(self, content: str) -> List[Dict]:
        """Split content into logical chunks."""
        chunks = []
        current_heading = None
        
        # Split by major sections (## headings)
        sections = re.split(r'\n(?=##\s)', content)
        
        for section in sections:
            if not section.strip():
                continue
                
            # Extract heading
            heading_match = re.match(r'##\s+(.+)', section)
            if heading_match:
                current_heading = heading_match.group(1).strip()
                section = section[heading_match.end():].strip()
            
            # Further split by paragraphs
            paragraphs = section.split('\n\n')
            
            for para in paragraphs:
                para = para.strip()
                if len(para) < 50:  # Skip very short fragments
                    continue
                
                # Determine content type
                content_type = "paragraph"
                if para.startswith('```'):
                    content_type = "code"
                elif para.startswith('|'):
                    content_type = "table"
                elif re.match(r'^[-*]\s', para):
                    content_type = "list"
                
                chunks.append({
                    'content': para,
                    'heading': current_heading,
                    'content_type': content_type,
                    'char_count': len(para),
                    'tokens': len(para.split())  # Simple token estimate
                })
        
        return chunks
    
    def extract_entities(self, text: str) -> List[str]:
        """Extract key entities from text."""
        # Predefined key entities for HaderOS
        key_entities = [
            'KAIA', 'HaderOS', 'Self-Healing', 'Metaprogramming',
            'RACI', 'Governance', 'ABG', 'BAR', 'NOW Shoes',
            'Organic Computing', 'Al-Furqan', 'MAKC',
            'Remediation Engine', 'Diagnostic Engine', 'Health Monitor',
            'Learning Engine', 'Corvid Protocol'
        ]
        
        found_entities = []
        text_lower = text.lower()
        
        for entity in key_entities:
            if entity.lower() in text_lower:
                found_entities.append(entity)
        
        return found_entities
    
    def insert_document(self, filename: str, doc_type: str, 
                       language: str, title: str, word_count: int,
                       metadata: Dict) -> int:
        """Insert document record and return document_id."""
        self.cursor.execute("""
            INSERT INTO documents 
            (filename, document_type, language, title, word_count, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (filename, doc_type, language, title, word_count, 
              json.dumps(metadata)))
        
        return self.cursor.lastrowid
    
    def insert_chunk(self, document_id: int, chunk_index: int, 
                    chunk_data: Dict) -> int:
        """Insert chunk record and return chunk_id."""
        self.cursor.execute("""
            INSERT INTO chunks 
            (document_id, chunk_index, content, content_type, 
             heading, char_count, tokens)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (document_id, chunk_index, chunk_data['content'],
              chunk_data['content_type'], chunk_data['heading'],
              chunk_data['char_count'], chunk_data['tokens']))
        
        return self.cursor.lastrowid
    
    def get_or_create_entity(self, name: str, entity_type: str = None) -> int:
        """Get existing entity or create new one."""
        self.cursor.execute(
            "SELECT entity_id FROM entities WHERE name = ?", (name,))
        result = self.cursor.fetchone()
        
        if result:
            return result[0]
        
        self.cursor.execute("""
            INSERT INTO entities (name, entity_type)
            VALUES (?, ?)
        """, (name, entity_type or "concept"))
        
        return self.cursor.lastrowid
    
    def link_entity_to_document(self, document_id: int, entity_id: int,
                               chunk_id: int = None, relevance: float = 0.5):
        """Create document-entity relationship."""
        self.cursor.execute("""
            INSERT INTO document_entities 
            (document_id, entity_id, chunk_id, relevance_score)
            VALUES (?, ?, ?, ?)
        """, (document_id, entity_id, chunk_id, relevance))
    
    def process_document(self, filepath: str, doc_type: str):
        """Process a single document file."""
        print(f"\n→ Processing: {filepath}")
        
        # Read content
        content = self.read_markdown_file(filepath)
        if not content:
            return
        
        # Extract metadata
        filename = Path(filepath).name
        language = self.detect_language(content)
        title = self.extract_title(content)
        word_count = len(content.split())
        
        metadata = {
            'source_path': filepath,
            'processed_at': datetime.now().isoformat()
        }
        
        # Insert document
        doc_id = self.insert_document(
            filename, doc_type, language, title, word_count, metadata)
        print(f"  ✓ Document ID: {doc_id} | Title: {title}")
        
        # Chunk content
        chunks = self.chunk_content(content)
        print(f"  ✓ Created {len(chunks)} chunks")
        
        # Process chunks
        for idx, chunk_data in enumerate(chunks):
            chunk_id = self.insert_chunk(doc_id, idx, chunk_data)
            
            # Extract and link entities
            entities = self.extract_entities(chunk_data['content'])
            for entity_name in entities:
                entity_id = self.get_or_create_entity(entity_name)
                self.link_entity_to_document(doc_id, entity_id, chunk_id)
        
        self.conn.commit()
        print(f"  ✓ Processed {len(chunks)} chunks with entities")
    
    def populate_predefined_entities(self):
        """Insert core HaderOS entities with descriptions."""
        core_entities = [
            ('KAIA', 'system', 'AI governance agents (KAIA-1, KAIA-2, KAIA-3)'),
            ('HaderOS', 'system', 'Organic operating system for enterprise management'),
            ('Self-Healing', 'concept', 'Autonomous system repair and recovery'),
            ('Metaprogramming', 'concept', 'Dynamic code generation and adaptation'),
            ('RACI', 'framework', 'Responsibility assignment matrix'),
            ('Organic Computing', 'concept', 'Bio-inspired adaptive systems'),
            ('Al-Furqan', 'component', 'Operational monitoring dashboard'),
            ('Remediation Engine', 'component', 'Automated problem resolution'),
            ('Health Monitor', 'component', 'System health surveillance'),
            ('NOW Shoes', 'project', 'Pilot implementation project')
        ]
        
        for name, etype, desc in core_entities:
            entity_id = self.get_or_create_

---
*Generated by Flowith OS Deep Thinking*