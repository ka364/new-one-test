> **Generated**: 2025-11-30T20:20:45.676Z
> **Language**: English
> **Purpose**: Design a comprehensive SQLite database schema for the HaderOS Knowledge Base. Include tables for: documents (storing full documents with metadata like id, title, source, content, created_at), chunks (storing text chunks with id, document_id, chunk_text, chunk_id, embedding if applicable), relations (linking concepts with id, source_id, target_id, relation_type, description), entities (extracted entities with id, entity_name, entity_type, chunk_id, confidence). Define primary keys, foreign keys, indexes for efficient querying (e.g., on text search, relations). Ensure support for ingestion of project files on architecture, code, governance; linking concepts like 'self-healing' in architecture to Python code snippets. Output in Markdown with SQL CREATE statements.

# HaderOS Knowledge Base - SQLite Database Schema

## Overview

This comprehensive database schema is designed to support the HaderOS Knowledge Base system, enabling efficient storage, retrieval, and relationship mapping of documents, text chunks, entities, and conceptual relations. The schema is optimized for mixed Arabic-English content, supports full-text search capabilities, and maintains referential integrity through carefully designed foreign key constraints.

## Design Principles

1. **Normalization**: Minimizes data redundancy while maintaining query performance
2. **Scalability**: Supports growing knowledge base with efficient indexing strategies
3. **Flexibility**: Accommodates various document types and relation patterns
4. **Performance**: Strategic indexes for common query patterns
5. **Integrity**: Foreign key constraints ensure data consistency
6. **Search Optimization**: Full-text search support for multilingual content

---

## Core Schema

### 1. Documents Table

Stores complete documents with metadata and versioning support.

```sql
CREATE TABLE documents (
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
    metadata_json TEXT, -- JSON field for flexible metadata storage
    tags TEXT, -- Comma-separated tags for quick filtering
    author TEXT,
    checksum TEXT
);

-- Indexes for documents
CREATE INDEX idx_documents_source_type ON documents(source_type);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_language ON documents(language);
CREATE INDEX idx_documents_content_hash ON documents(content_hash);
CREATE INDEX idx_documents_tags ON documents(tags);

-- Full-text search virtual table for documents
CREATE VIRTUAL TABLE documents_fts USING fts5(
    title,
    content,
    tags,
    content=documents,
    content_rowid=id,
    tokenize='unicode61 remove_diacritics 2'
);

-- Triggers to keep FTS table synchronized
CREATE TRIGGER documents_fts_insert AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(rowid, title, content, tags)
    VALUES (new.id, new.title, new.content, new.tags);
END;

CREATE TRIGGER documents_fts_update AFTER UPDATE ON documents BEGIN
    UPDATE documents_fts 
    SET title = new.title, content = new.content, tags = new.tags
    WHERE rowid = new.id;
END;

CREATE TRIGGER documents_fts_delete AFTER DELETE ON documents BEGIN
    DELETE FROM documents_fts WHERE rowid = old.id;
END;

-- Trigger to update timestamp
CREATE TRIGGER documents_update_timestamp AFTER UPDATE ON documents BEGIN
    UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 2. Chunks Table

Stores segmented text chunks with embeddings for semantic search.

```sql
CREATE TABLE chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_id TEXT UNIQUE NOT NULL, -- Format: doc_{document_id}_chunk_{chunk_index}
    chunk_hash TEXT NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    token_count INTEGER,
    embedding BLOB, -- Binary storage for vector embeddings
    embedding_model TEXT, -- Model used for embedding generation
    embedding_dimension INTEGER,
    language TEXT CHECK(language IN ('en', 'ar', 'mixed')),
    chunk_type TEXT CHECK(chunk_type IN ('paragraph', 'code', 'heading', 'list', 'table', 'metadata')),
    context_before TEXT, -- Previous chunk text for context
    context_after TEXT, -- Next chunk text for context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(document_id, chunk_index)
);

-- Indexes for chunks
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_chunk_id ON chunks(chunk_id);
CREATE INDEX idx_chunks_chunk_hash ON chunks(chunk_hash);
CREATE INDEX idx_chunks_chunk_type ON chunks(chunk_type);
CREATE INDEX idx_chunks_language ON chunks(language);
CREATE INDEX idx_chunks_token_count ON chunks(token_count);

-- Full-text search for chunks
CREATE VIRTUAL TABLE chunks_fts USING fts5(
    chunk_text,
    chunk_type,
    content=chunks,
    content_rowid=id,
    tokenize='unicode61 remove_diacritics 2'
);

-- FTS synchronization triggers
CREATE TRIGGER chunks_fts_insert AFTER INSERT ON chunks BEGIN
    INSERT INTO chunks_fts(rowid, chunk_text, chunk_type)
    VALUES (new.id, new.chunk_text, new.chunk_type);
END;

CREATE TRIGGER chunks_fts_update AFTER UPDATE ON chunks BEGIN
    UPDATE chunks_fts 
    SET chunk_text = new.chunk_text, chunk_type = new.chunk_type
    WHERE rowid = new.id;
END;

CREATE TRIGGER chunks_fts_delete AFTER DELETE ON chunks BEGIN
    DELETE FROM chunks_fts WHERE rowid = old.id;
END;

-- Update timestamp trigger
CREATE TRIGGER chunks_update_timestamp AFTER UPDATE ON chunks BEGIN
    UPDATE chunks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 3. Entities Table

Stores extracted named entities with confidence scores and type classification.

```sql
CREATE TABLE entities (
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
    context TEXT, -- Surrounding text for context
    normalized_name TEXT, -- Normalized form for matching
    language TEXT CHECK(language IN ('en', 'ar', 'mixed')),
    extraction_method TEXT CHECK(extraction_method IN ('nlp', 'regex', 'manual', 'ml_model')),
    metadata_json TEXT, -- Additional entity-specific metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Indexes for entities
CREATE INDEX idx_entities_entity_name ON entities(entity_name);
CREATE INDEX idx_entities_entity_type ON entities(entity_type);
CREATE INDEX idx_entities_chunk_id ON entities(chunk_id);
CREATE INDEX idx_entities_document_id ON entities(document_id);
CREATE INDEX idx_entities_confidence ON entities(confidence DESC);
CREATE INDEX idx_entities_normalized_name ON entities(normalized_name);
CREATE INDEX idx_entities_composite ON entities(entity_name, entity_type, document_id);

-- Full-text search for entities
CREATE VIRTUAL TABLE entities_fts USING fts5(
    entity_name,
    normalized_name,
    context,
    content=entities,
    content_rowid=id,
    tokenize='unicode61 remove_diacritics 2'
);

-- FTS synchronization triggers
CREATE TRIGGER entities_fts_insert AFTER INSERT ON entities BEGIN
    INSERT INTO entities_fts(rowid, entity_name, normalized_name, context)
    VALUES (new.id, new.entity_name, new.normalized_name, new.context);
END;

CREATE TRIGGER entities_fts_update AFTER UPDATE ON entities BEGIN
    UPDATE entities_fts 
    SET entity_name = new.entity_name, 
        normalized_name = new.normalized_name,
        context = new.context
    WHERE rowid = new.id;
END;

CREATE TRIGGER entities_fts_delete AFTER DELETE ON entities BEGIN
    DELETE FROM entities_fts WHERE rowid = old.id;
END;

-- Update timestamp trigger
CREATE TRIGGER entities_update_timestamp AFTER UPDATE ON entities BEGIN
    UPDATE entities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 4. Relations Table

Captures relationships between entities, concepts, and chunks.

```sql
CREATE TABLE relations (
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
    weight REAL DEFAULT 1.0, -- Relationship strength
    bidirectional BOOLEAN DEFAULT 0,
    context TEXT, -- Context where relation was identified
    extraction_method TEXT CHECK(extraction_method IN ('nlp', 'pattern', 'manual', 'inference')),
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT 0,
    verified_by TEXT,
    verified_at TIMESTAMP,
    CHECK(source_id != target_id OR source_type != target_type)
);

-- Indexes for relations
CREATE INDEX idx_relations_source ON relations(source_id, source_type);
CREATE INDEX idx_relations_target ON relations(target_id, target_type);
CREATE INDEX idx_relations_type ON relations(relation_type);
CREATE INDEX idx_relations_confidence ON relations(confidence DESC);
CREATE INDEX idx_relations_composite ON relations(source_id, source_type, target_id, target_type);
CREATE INDEX idx_relations_bidirectional ON relations(bidirectional) WHERE bidirectional = 1;
CREATE INDEX idx_relations_verified ON relations(verified) WHERE verified = 1;

-- Update timestamp trigger
CREATE TRIGGER relations_update_timestamp AFTER UPDATE ON relations BEGIN
    UPDATE relations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

---

## Supporting Tables

### 5. Concepts Table

Stores high-level concepts and their definitions for knowledge graph construction.

```sql
CREATE TABLE concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_name TEXT UNIQUE NOT NULL,
    concept_type TEXT CHECK(concept_type IN ('architectural', 'technical', 'business', 'operational')),
    definition TEXT,
    aliases TEXT, -- Comma-separated alternative names
    category TEXT,
    importance_score REAL DEFAULT 0.5 CHECK(importance_score >= 0.0 AND importance_score <= 1.0),
    language TEXT CHECK(language IN ('en', 'ar', 'mixed')),
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_concepts_name ON concepts(concept_name);
CREATE INDEX idx_concepts_type ON concepts(concept_type);
CREATE INDEX idx_concepts_category ON concepts(category);
CREATE INDEX idx_concepts_importance ON concepts(importance_score DESC);

-- Full-text search for concepts
CREATE VIRTUAL TABLE concepts_fts USING fts5(
    concept_name,
    definition,
    aliases,
    content=concepts,
    content_rowid=id,
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER concepts_fts_insert AFTER INSERT ON concepts BEGIN
    INSERT INTO concepts_fts(rowid, concept_name, definition, aliases)
    VALUES (new.id, new.concept_name, new.definition, new.aliases);
END;

CREATE TRIGGER concepts_fts_update AFTER UPDATE ON concepts BEGIN
    UPDATE concepts_fts 
    SET concept_name = new.concept_name, definition = new.definition, aliases = new.aliases
    WHERE rowid = new.id;
END;

CREATE TRIGGER concepts_fts_delete AFTER DELETE ON concepts BEGIN
    DELETE FROM concepts_fts WHERE rowid = old.id;
END;

CREATE TRIGGER concepts_update_timestamp AFTER UPDATE ON concepts BEGIN
    UPDATE concepts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 6. Entity Mentions Table

Tracks all occurrences of entities across documents for frequency analysis.

```sql
CREATE TABLE entity_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    chunk_id INTEGER NOT NULL,
    document_id INTEGER NOT NULL,
    mention_text TEXT NOT NULL,
    start_offset INTEGER,
    end_offset INTEGER,
    context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_entity_mentions_entity ON entity_mentions(entity_id);
CREATE INDEX idx_entity_mentions_chunk ON entity_mentions(chunk_id);
CREATE INDEX idx_entity_mentions_document ON entity_mentions(document_id);
CREATE INDEX idx_entity_mentions_composite ON entity_mentions(entity_id, document_id);
```

### 7. Embeddings Metadata Table

Stores metadata about embedding models and configurations.

```sql
CREATE TABLE embedding_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT UNIQUE NOT NULL,
    model_version TEXT,
    dimension INTEGER NOT NULL,
    provider TEXT, -- e.g., 'openai', 'huggingface', 'local'
    configuration_json TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embedding_models_active ON embedding_models(is_active) WHERE is_active = 1;

CREATE TRIGGER embedding_models_update_timestamp AFTER UPDATE ON embedding_models BEGIN
    UPDATE embedding_models SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### 8. Search History Table

Tracks search queries for analytics and improvement.

```sql
CREATE TABLE search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_text TEXT NOT NULL,
    search_type TEXT CHECK(search_type IN ('fulltext', 'semantic', 'hybrid', 'entity', 'relation')),
    results_count INTEGER,
    execution_time_ms REAL,
    user_id TEXT,
    filters_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_query ON search_history(query_text);
CREATE INDEX idx_search_history_type ON search_history(search_type);
CREATE INDEX idx_

---
*Generated by Flowith OS Deep Thinking*