> **Generated**: 2025-11-30T20:21:38.155Z
> **Language**: English
> **Purpose**: Review the provided SQLite schema for the HaderOS Knowledge Base in the referenced file. Ensure it is comprehensive, includes all necessary tables (documents, chunks, entities, relations, concepts, entity_mentions, embedding_models, search_history), indexes, triggers, and FTS virtual tables. Then, create a complete Python script named 'init_kaia_knowledge_db.py' that connects to SQLite, creates the database file 'kaia_knowledge.db' if it doesn't exist, and executes all the CREATE TABLE, CREATE INDEX, CREATE VIRTUAL TABLE, and CREATE TRIGGER statements from the schema. The script should handle any potential errors gracefully, commit the changes, and print a success message upon completion. Include imports for sqlite3 and any necessary error handling.

# HaderOS Knowledge Base - Database Initialization Script

## Schema Analysis & Validation

After reviewing the provided SQLite schema, I've identified the following characteristics:

### Schema Completeness Assessment

**Strengths:**
- Comprehensive table structure covering all core entities (documents, chunks, entities, relations, concepts)
- Well-designed indexing strategy for performance optimization
- Full-text search (FTS5) integration for multilingual content
- Proper foreign key constraints ensuring referential integrity
- Automatic timestamp management via triggers
- Support for embedding storage and metadata tracking

**Observations:**
- The `search_history` table index definition appears truncated in the source
- Schema includes robust CHECK constraints for data validation
- Cascading deletes properly configured for dependent records
- JSON fields provide flexibility for evolving metadata requirements

---

## Complete Python Initialization Script

Below is the production-ready script `init_kaia_knowledge_db.py` that implements the entire schema with comprehensive error handling:

```python
#!/usr/bin/env python3
"""
HaderOS Knowledge Base - Database Initialization Script
========================================================
Creates and initializes the kaia_knowledge.db SQLite database with complete schema.

Features:
- Creates all tables, indexes, FTS virtual tables, and triggers
- Handles existing database scenarios gracefully
- Comprehensive error handling and logging
- Transaction-based execution for atomicity
- Validation of schema creation
"""

import sqlite3
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional


class KnowledgeDBInitializer:
    """Handles initialization of the HaderOS Knowledge Base database."""
    
    def __init__(self, db_path: str = "kaia_knowledge.db"):
        """
        Initialize the database initializer.
        
        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path
        self.connection: Optional[sqlite3.Connection] = None
        
    def connect(self) -> bool:
        """
        Establish connection to the SQLite database.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.execute("PRAGMA foreign_keys = ON")
            print(f"✓ Connected to database: {self.db_path}")
            return True
        except sqlite3.Error as e:
            print(f"✗ Failed to connect to database: {e}", file=sys.stderr)
            return False
    
    def create_documents_table(self) -> None:
        """Create documents table with indexes and triggers."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                source_type TEXT NOT NULL CHECK(source_type IN ('file', 'url', 'manual', 'api')),
                content TEXT NOT NULL,
                content_hash TEXT UNIQUE NOT NULL,
                language TEXT DEFAULT 'mixed' CHECK(language IN ('en', 'ar', 'mixed')),
                document_type TEXT CHECK(document_type IN ('architecture', 'code', 'governance', 'documentation', 'specification', 'other')),
                file_path TEXT,
                file_size INTEGER,
                mime_type TEXT,
                version INTEGER DEFAULT 1,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted', 'draft')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                indexed_at TIMESTAMP,
                metadata_json TEXT,
                tags TEXT,
                author TEXT,
                checksum TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_documents_source_type ON documents(source_type);
            CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
            CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
            CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_documents_language ON documents(language);
            CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
            CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents(tags);

            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
                title,
                content,
                tags,
                content=documents,
                content_rowid=id,
                tokenize='unicode61 remove_diacritics 2'
            );

            DROP TRIGGER IF EXISTS documents_fts_insert;
            CREATE TRIGGER documents_fts_insert AFTER INSERT ON documents BEGIN
                INSERT INTO documents_fts(rowid, title, content, tags)
                VALUES (new.id, new.title, new.content, new.tags);
            END;

            DROP TRIGGER IF EXISTS documents_fts_update;
            CREATE TRIGGER documents_fts_update AFTER UPDATE ON documents BEGIN
                UPDATE documents_fts 
                SET title = new.title, content = new.content, tags = new.tags
                WHERE rowid = new.id;
            END;

            DROP TRIGGER IF EXISTS documents_fts_delete;
            CREATE TRIGGER documents_fts_delete AFTER DELETE ON documents BEGIN
                DELETE FROM documents_fts WHERE rowid = old.id;
            END;

            DROP TRIGGER IF EXISTS documents_update_timestamp;
            CREATE TRIGGER documents_update_timestamp AFTER UPDATE ON documents BEGIN
                UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        """)
        print("✓ Created documents table with indexes and triggers")
    
    def create_chunks_table(self) -> None:
        """Create chunks table with indexes and triggers."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                chunk_id TEXT UNIQUE NOT NULL,
                chunk_hash TEXT NOT NULL,
                start_position INTEGER,
                end_position INTEGER,
                token_count INTEGER,
                embedding BLOB,
                embedding_model TEXT,
                embedding_dimension INTEGER,
                language TEXT CHECK(language IN ('en', 'ar', 'mixed')),
                chunk_type TEXT CHECK(chunk_type IN ('paragraph', 'code', 'heading', 'list', 'table', 'metadata')),
                context_before TEXT,
                context_after TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                UNIQUE(document_id, chunk_index)
            );

            CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
            CREATE INDEX IF NOT EXISTS idx_chunks_chunk_id ON chunks(chunk_id);
            CREATE INDEX IF NOT EXISTS idx_chunks_chunk_hash ON chunks(chunk_hash);
            CREATE INDEX IF NOT EXISTS idx_chunks_chunk_type ON chunks(chunk_type);
            CREATE INDEX IF NOT EXISTS idx_chunks_language ON chunks(language);
            CREATE INDEX IF NOT EXISTS idx_chunks_token_count ON chunks(token_count);

            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                chunk_text,
                chunk_type,
                content=chunks,
                content_rowid=id,
                tokenize='unicode61 remove_diacritics 2'
            );

            DROP TRIGGER IF EXISTS chunks_fts_insert;
            CREATE TRIGGER chunks_fts_insert AFTER INSERT ON chunks BEGIN
                INSERT INTO chunks_fts(rowid, chunk_text, chunk_type)
                VALUES (new.id, new.chunk_text, new.chunk_type);
            END;

            DROP TRIGGER IF EXISTS chunks_fts_update;
            CREATE TRIGGER chunks_fts_update AFTER UPDATE ON chunks BEGIN
                UPDATE chunks_fts 
                SET chunk_text = new.chunk_text, chunk_type = new.chunk_type
                WHERE rowid = new.id;
            END;

            DROP TRIGGER IF EXISTS chunks_fts_delete;
            CREATE TRIGGER chunks_fts_delete AFTER DELETE ON chunks BEGIN
                DELETE FROM chunks_fts WHERE rowid = old.id;
            END;

            DROP TRIGGER IF EXISTS chunks_update_timestamp;
            CREATE TRIGGER chunks_update_timestamp AFTER UPDATE ON chunks BEGIN
                UPDATE chunks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        """)
        print("✓ Created chunks table with indexes and triggers")
    
    def create_entities_table(self) -> None:
        """Create entities table with indexes and triggers."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_name TEXT NOT NULL,
                entity_type TEXT NOT NULL CHECK(entity_type IN (
                    'concept', 'technology', 'component', 'function', 'class', 
                    'method', 'variable', 'person', 'organization', 'location',
                    'date', 'metric', 'requirement', 'feature', 'module', 'service'
                )),
                chunk_id INTEGER NOT NULL,
                document_id INTEGER NOT NULL,
                confidence REAL CHECK(confidence >= 0.0 AND confidence <= 1.0),
                start_offset INTEGER,
                end_offset INTEGER,
                context TEXT,
                normalized_name TEXT,
                language TEXT CHECK(language IN ('en', 'ar', 'mixed')),
                extraction_method TEXT CHECK(extraction_method IN ('nlp', 'regex', 'manual', 'ml_model')),
                metadata_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_entities_entity_name ON entities(entity_name);
            CREATE INDEX IF NOT EXISTS idx_entities_entity_type ON entities(entity_type);
            CREATE INDEX IF NOT EXISTS idx_entities_chunk_id ON entities(chunk_id);
            CREATE INDEX IF NOT EXISTS idx_entities_document_id ON entities(document_id);
            CREATE INDEX IF NOT EXISTS idx_entities_confidence ON entities(confidence DESC);
            CREATE INDEX IF NOT EXISTS idx_entities_normalized_name ON entities(normalized_name);
            CREATE INDEX IF NOT EXISTS idx_entities_composite ON entities(entity_name, entity_type, document_id);

            CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
                entity_name,
                normalized_name,
                context,
                content=entities,
                content_rowid=id,
                tokenize='unicode61 remove_diacritics 2'
            );

            DROP TRIGGER IF EXISTS entities_fts_insert;
            CREATE TRIGGER entities_fts_insert AFTER INSERT ON entities BEGIN
                INSERT INTO entities_fts(rowid, entity_name, normalized_name, context)
                VALUES (new.id, new.entity_name, new.normalized_name, new.context);
            END;

            DROP TRIGGER IF EXISTS entities_fts_update;
            CREATE TRIGGER entities_fts_update AFTER UPDATE ON entities BEGIN
                UPDATE entities_fts 
                SET entity_name = new.entity_name, 
                    normalized_name = new.normalized_name,
                    context = new.context
                WHERE rowid = new.id;
            END;

            DROP TRIGGER IF EXISTS entities_fts_delete;
            CREATE TRIGGER entities_fts_delete AFTER DELETE ON entities BEGIN
                DELETE FROM entities_fts WHERE rowid = old.id;
            END;

            DROP TRIGGER IF EXISTS entities_update_timestamp;
            CREATE TRIGGER entities_update_timestamp AFTER UPDATE ON entities BEGIN
                UPDATE entities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        """)
        print("✓ Created entities table with indexes and triggers")
    
    def create_relations_table(self) -> None:
        """Create relations table with indexes and triggers."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id INTEGER NOT NULL,
                target_id INTEGER NOT NULL,
                source_type TEXT NOT NULL CHECK(source_type IN ('entity', 'chunk', 'document', 'concept')),
                target_type TEXT NOT NULL CHECK(target_type IN ('entity', 'chunk', 'document', 'concept')),
                relation_type TEXT NOT NULL CHECK(relation_type IN (
                    'implements', 'uses', 'references', 'depends_on', 'defines',
                    'extends', 'contains', 'related_to', 'similar_to', 'contradicts',
                    'supports', 'exemplifies', 'part_of', 'instance_of', 'derived_from',
                    'calls', 'inherits', 'configures', 'validates', 'triggers'
                )),
                description TEXT,
                confidence REAL CHECK(confidence >= 0.0 AND confidence <= 1.0),
                weight REAL DEFAULT 1.0,
                bidirectional BOOLEAN DEFAULT 0,
                context TEXT,
                extraction_method TEXT CHECK(extraction_method IN ('nlp', 'pattern', 'manual', 'inference')),
                metadata_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified BOOLEAN DEFAULT 0,
                verified_by TEXT,
                verified_at TIMESTAMP,
                CHECK(source_id != target_id OR source_type != target_type)
            );

            CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id, source_type);
            CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id, target_type);
            CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(relation_type);
            CREATE INDEX IF NOT EXISTS idx_relations_confidence ON relations(confidence DESC);
            CREATE INDEX IF NOT EXISTS idx_relations_composite ON relations(source_id, source_type, target_id, target_type);
            CREATE INDEX IF NOT EXISTS idx_relations_bidirectional ON relations(bidirectional) WHERE bidirectional = 1;
            CREATE INDEX IF NOT EXISTS idx_relations_verified ON relations(verified) WHERE verified = 1;

            DROP TRIGGER IF EXISTS relations_update_timestamp;
            CREATE TRIGGER relations_update_timestamp AFTER UPDATE ON relations BEGIN
                UPDATE relations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        """)
        print("✓ Created relations table with indexes and triggers")
    
    def create_concepts_table(self) -> None:
        """Create concepts table with indexes and triggers."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept_name TEXT UNIQUE NOT NULL,
                concept_type TEXT CHECK(concept_type IN ('architectural', 'technical', 'business', 'operational')),
                definition TEXT,
                aliases TEXT,
                category TEXT,
                importance_score REAL DEFAULT 0.5 CHECK(importance_score >= 0.0 AND importance_score <= 1.0),
                language TEXT CHECK(language IN ('en', 'ar', 'mixed')),
                metadata_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_concepts_name ON concepts(concept_name);
            CREATE INDEX IF NOT EXISTS idx_concepts_type ON concepts(concept_type);
            CREATE INDEX IF NOT EXISTS idx_concepts_category ON concepts(category);
            CREATE INDEX IF NOT EXISTS idx_concepts_importance ON concepts(importance_score DESC);

            CREATE VIRTUAL TABLE IF NOT EXISTS concepts_fts USING fts5(
                concept_name,
                definition,
                aliases,
                content=concepts,
                content_rowid=id,
                tokenize='unicode61 remove_diacritics 2'
            );

            DROP TRIGGER IF EXISTS concepts_fts_insert;
            CREATE TRIGGER concepts_fts_insert AFTER INSERT ON concepts BEGIN
                INSERT INTO concepts_fts(rowid, concept_name, definition, aliases)
                VALUES (new.id, new.concept_name, new.definition, new.aliases);
            END;

            DROP TRIGGER IF EXISTS concepts_fts_update;
            CREATE TRIGGER concepts_fts_update AFTER UPDATE ON concepts BEGIN
                UPDATE concepts_fts 
                SET concept

---
*Generated by Flowith OS Deep Thinking*