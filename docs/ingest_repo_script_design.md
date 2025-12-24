> **Generated**: 2025-11-30T20:38:56.660Z
> **Language**: English
> **Purpose**: Design a Python script named 'ingest_repo.py' that acts as a 'Knowledge Ingestor' for the HaderOS project. This script's primary function is to scan a given project directory, process all relevant source files, and populate the 'documents' and 'chunks' tables within the existing 'kaia_knowledge.db' SQLite database. The script must be robust, configurable, and avoid data duplication.

**Core Requirements:**

1.  **Configuration:** The script should define easily configurable variables at the top, including:
    *   `REPO_PATH`: The root directory of the project to scan.
    *   `DB_PATH`: The path to the `kaia_knowledge.db` file.
    *   `EXCLUDED_DIRS`: A list of directory names to ignore (e.g., `.git`, `__pycache__`, `node_modules`, `build`, `dist`).
    *   `SUPPORTED_EXTENSIONS`: A list of file extensions to process (e.g., `.py`, `.md`, `.html`, `.css`, `.js`, `.sql`).
    *   `CHUNK_SIZE`: An integer defining the target size for text chunks (e.g., in characters or tokens).

2.  **Database Interaction:**
    *   Connect to the specified SQLite database.
    *   Implement functions to insert data into the `documents` and `chunks` tables.

3.  **Duplicate Prevention:**
    *   Before processing a file, calculate the SHA256 hash of its content.
    *   Query the `documents` table to check if a document with the same `content_hash` already exists. If it does, skip the file and its chunks to prevent redundancy.

4.  **File Processing Workflow:**
    *   Recursively scan the `REPO_PATH`.
    *   For each file found, apply the exclusion filters (directories and extensions).
    *   For each valid file, read its content (handling potential encoding errors gracefully).
    *   Insert the file's metadata (title, path, size, hash) into the `documents` table and retrieve the newly created `document_id`.

5.  **Text Chunking:**
    *   Implement a text chunking function. A simple and effective method is to split the document content into paragraphs (e.g., based on double newlines `\n\n`). 
    *   If a paragraph is too large, it should be further subdivided based on the `CHUNK_SIZE`.

6.  **Chunk Ingestion:**
    *   For each generated chunk, insert a corresponding record into the `chunks` table. This record must include the `document_id` (linking it to the parent document), the `chunk_text`, and a `chunk_index`.

7.  **Logging and Feedback:**
    *   Provide clear and informative console output throughout the process, indicating which files are being processed, which are being skipped, the number of chunks created, and a final summary.

8.  **Main Execution Block:**
    *   Use a `if __name__ == "__main__":` block to orchestrate the entire ingestion process when the script is run directly.

# HaderOS Knowledge Ingestor Script Design

## Overview

This document provides a comprehensive design and implementation for `ingest_repo.py`, a robust Python script that processes project repositories and populates the HaderOS knowledge database with structured, searchable content.

## Complete Implementation

```python
#!/usr/bin/env python3
"""
ingest_repo.py - Knowledge Ingestor for HaderOS Project

This script scans a project directory, processes source files, and populates
the 'documents' and 'chunks' tables in the kaia_knowledge.db SQLite database.
It implements duplicate detection, intelligent chunking, and comprehensive logging.
"""

import os
import sqlite3
import hashlib
import sys
from pathlib import Path
from typing import List, Tuple, Optional
from datetime import datetime

# ============================================================================
# CONFIGURATION SECTION
# ============================================================================

# Path to the repository to scan
REPO_PATH = "./haderos_project"

# Path to the SQLite database
DB_PATH = "./kaia_knowledge.db"

# Directories to exclude from scanning
EXCLUDED_DIRS = {
    '.git', '__pycache__', 'node_modules', 'build', 'dist',
    '.venv', 'venv', '.pytest_cache', '.mypy_cache', 
    'htmlcov', '.tox', 'eggs', '.eggs'
}

# File extensions to process
SUPPORTED_EXTENSIONS = {
    '.py', '.md', '.txt', '.html', '.css', '.js', 
    '.sql', '.json', '.yaml', '.yml', '.toml', '.rst'
}

# Target chunk size in characters
CHUNK_SIZE = 1000

# Overlap between chunks (for context preservation)
CHUNK_OVERLAP = 100

# Maximum chunk size before forced splitting
MAX_CHUNK_SIZE = 2000

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

class DatabaseManager:
    """Handles all database operations for the knowledge ingestion process."""
    
    def __init__(self, db_path: str):
        """Initialize database connection."""
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        
    def connect(self) -> None:
        """Establish database connection."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            print(f"✓ Connected to database: {self.db_path}")
        except sqlite3.Error as e:
            print(f"✗ Database connection error: {e}")
            sys.exit(1)
    
    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")
    
    def document_exists(self, content_hash: str) -> bool:
        """Check if a document with the given hash already exists."""
        try:
            self.cursor.execute(
                "SELECT id FROM documents WHERE content_hash = ?",
                (content_hash,)
            )
            result = self.cursor.fetchone()
            return result is not None
        except sqlite3.Error as e:
            print(f"✗ Error checking document existence: {e}")
            return False
    
    def insert_document(
        self, 
        title: str, 
        file_path: str, 
        file_size: int, 
        content_hash: str
    ) -> Optional[int]:
        """Insert a new document record and return its ID."""
        try:
            self.cursor.execute("""
                INSERT INTO documents (title, file_path, file_size, content_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (title, file_path, file_size, content_hash, datetime.now().isoformat()))
            
            self.conn.commit()
            return self.cursor.lastrowid
        except sqlite3.Error as e:
            print(f"✗ Error inserting document '{title}': {e}")
            return None
    
    def insert_chunk(
        self, 
        document_id: int, 
        chunk_text: str, 
        chunk_index: int
    ) -> bool:
        """Insert a chunk record linked to a document."""
        try:
            self.cursor.execute("""
                INSERT INTO chunks (document_id, chunk_text, chunk_index, created_at)
                VALUES (?, ?, ?, ?)
            """, (document_id, chunk_text, chunk_index, datetime.now().isoformat()))
            
            return True
        except sqlite3.Error as e:
            print(f"✗ Error inserting chunk {chunk_index} for document {document_id}: {e}")
            return False
    
    def commit(self) -> None:
        """Commit pending transactions."""
        if self.conn:
            self.conn.commit()

# ============================================================================
# FILE PROCESSING
# ============================================================================

class FileProcessor:
    """Handles file discovery, reading, and hashing operations."""
    
    @staticmethod
    def calculate_hash(content: str) -> str:
        """Calculate SHA256 hash of content."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    @staticmethod
    def read_file(file_path: Path) -> Optional[str]:
        """Read file content with encoding fallback."""
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
            except Exception as e:
                print(f"✗ Error reading file {file_path}: {e}")
                return None
        
        print(f"✗ Could not decode file {file_path} with any supported encoding")
        return None
    
    @staticmethod
    def should_process_file(file_path: Path) -> bool:
        """Determine if a file should be processed based on extension."""
        return file_path.suffix.lower() in SUPPORTED_EXTENSIONS
    
    @staticmethod
    def should_skip_directory(dir_name: str) -> bool:
        """Determine if a directory should be skipped."""
        return dir_name in EXCLUDED_DIRS

# ============================================================================
# TEXT CHUNKING
# ============================================================================

class TextChunker:
    """Implements intelligent text chunking strategies."""
    
    def __init__(self, chunk_size: int, overlap: int, max_size: int):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.max_size = max_size
    
    def chunk_text(self, content: str) -> List[str]:
        """
        Split text into chunks using paragraph-aware strategy.
        
        Strategy:
        1. Split by double newlines (paragraphs)
        2. Combine small paragraphs until reaching target size
        3. Split large paragraphs if they exceed max size
        4. Add overlap between chunks for context preservation
        """
        if not content.strip():
            return []
        
        # Split into paragraphs
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for para in paragraphs:
            para_size = len(para)
            
            # If paragraph itself is too large, split it
            if para_size > self.max_size:
                # Save current chunk if it exists
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                # Split large paragraph
                chunks.extend(self._split_large_text(para))
                continue
            
            # If adding this paragraph exceeds chunk size, save current chunk
            if current_size + para_size > self.chunk_size and current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                
                # Start new chunk with overlap from previous
                if self.overlap > 0 and current_chunk:
                    overlap_text = current_chunk[-1]
                    if len(overlap_text) > self.overlap:
                        overlap_text = overlap_text[-self.overlap:]
                    current_chunk = [overlap_text]
                    current_size = len(overlap_text)
                else:
                    current_chunk = []
                    current_size = 0
            
            # Add paragraph to current chunk
            current_chunk.append(para)
            current_size += para_size
        
        # Add final chunk
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))
        
        return chunks
    
    def _split_large_text(self, text: str) -> List[str]:
        """Split text that exceeds max size into smaller chunks."""
        chunks = []
        sentences = text.split('. ')
        
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Add period back if it was removed
            if not sentence.endswith('.'):
                sentence += '.'
            
            sentence_size = len(sentence)
            
            # If single sentence is too large, force split by characters
            if sentence_size > self.max_size:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = []
                    current_size = 0
                
                chunks.extend(self._force_split(sentence))
                continue
            
            # If adding sentence exceeds max size, save current chunk
            if current_size + sentence_size > self.max_size and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = []
                current_size = 0
            
            current_chunk.append(sentence)
            current_size += sentence_size
        
        # Add final chunk
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _force_split(self, text: str) -> List[str]:
        """Force split text by character count when no better option exists."""
        chunks = []
        for i in range(0, len(text), self.max_size):
            chunks.append(text[i:i + self.max_size])
        return chunks

# ============================================================================
# MAIN INGESTION ORCHESTRATOR
# ============================================================================

class KnowledgeIngestor:
    """Orchestrates the entire knowledge ingestion process."""
    
    def __init__(self, repo_path: str, db_path: str):
        self.repo_path = Path(repo_path)
        self.db_manager = DatabaseManager(db_path)
        self.file_processor = FileProcessor()
        self.text_chunker = TextChunker(CHUNK_SIZE, CHUNK_OVERLAP, MAX_CHUNK_SIZE)
        
        # Statistics
        self.stats = {
            'files_scanned': 0,
            'files_processed': 0,
            'files_skipped': 0,
            'files_duplicates': 0,
            'chunks_created': 0,
            'errors': 0
        }
    
    def run(self) -> None:
        """Execute the complete ingestion process."""
        print("=" * 70)
        print("HaderOS Knowledge Ingestor")
        print("=" * 70)
        print(f"Repository: {self.repo_path}")
        print(f"Database: {self.db_manager.db_path}")
        print(f"Chunk Size: {CHUNK_SIZE} characters")
        print("=" * 70)
        print()
        
        # Validate paths
        if not self.repo_path.exists():
            print(f"✗ Repository path does not exist: {self.repo_path}")
            sys.exit(1)
        
        # Connect to database
        self.db_manager.connect()
        
        try:
            # Process repository
            self._process_directory(self.repo_path)
            
            # Final commit
            self.db_manager.commit()
            
            # Print summary
            self._print_summary()
            
        except KeyboardInterrupt:
            print("\n\n✗ Process interrupted by user")
            self.db_manager.commit()
            self._print_summary()
        except Exception as e:
            print(f"\n✗ Unexpected error: {e}")
            self.stats['errors'] += 1
        finally:
            self.db_manager.close()
    
    def _process_directory(self, directory: Path) -> None:
        """Recursively process all files in a directory."""
        try:
            for item in directory.iterdir():
                if item.is_dir():
                    if not self.file_processor.should_skip_directory(item.name):
                        self._process_directory(item)
                elif item.is_file():
                    self._process_file(item)
        except PermissionError:
            print(f"✗ Permission denied: {directory}")
            self.stats['errors'] += 1
    
    def _process_file(self, file_path: Path) -> None:
        """Process a single file."""
        self.stats['files_scanned'] += 1
        
        # Check if file should be processed
        if not self.file_processor.should_process_file(file_path):
            return
        
        print(f"Processing: {file_path.relative_to(self.repo_path)}")
        
        # Read file content
        content = self.file_processor.read_file(file_path)
        if content is None:
            self.stats['files_skipped'] += 1
            return
        
        # Calculate hash
        content_hash = self.file_processor.calculate_hash(content)
        
        # Check for duplicates
        if self.db_manager.document_exists(content_hash):
            print(f"  ↳ Skipped (duplicate)")
            self.stats['files_duplicates'] += 1
            return
        
        # Insert document
        file_size = file_path.stat().st_size
        relative_path = str(file_path.relative_to(self.repo_path))
        title = file_path.name
        
        document_id = self.db_manager.insert_document(
            title, relative_path, file_size, content_hash
        )
        
        if document_id is None:
            self.stats['errors'] += 1
            return
        
        # Create and insert chunks
        chunks = self.text_chunker.chunk_text(content)
        chunk_count = 0
        
        for idx, chunk_text in enumerate(chunks):
            if self.db_manager.insert_chunk(document_id, chunk_text, idx):
                chunk_count += 1
        
        # Commit after each file
        self.db_manager.commit()
        
        print(f"  ↳ Created {chunk_count} chunks")
        self.stats['files_processed'] += 1
        self.stats['chunks_created'] += chunk_count
    
    def _print_summary(self) -> None:
        """Print ingestion statistics summary."""
        print("\n" + "=" * 70)
        print("INGESTION SUMMARY")
        print("=" * 70)
        print(f"Files Scanned:      {self.stats['files_scanned']}")
        print(f"Files Processed:    {self.stats['files_processed']}")
        print(f"Files Skipped:      {self.stats['files_skipped']}")
        print(f"Duplicates Found:   {self.stats['files_duplicates']}")
        print(f"Chunks Created:     {self.stats['chunks_created']}")
        print(f"Errors:             {self.stats['errors']}")
        print("=" * 70)

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    ingestor = KnowledgeIngestor(REPO_PATH, DB_PATH)
    ingestor.run()
```

## Key Design Features

### 1. **Modular Architecture**

The script is organized into four primary classes, each with a single responsibility:

-

---
*Generated by Flowith OS Deep Thinking*