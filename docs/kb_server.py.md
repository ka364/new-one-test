> **Generated**: 2025-11-30T20:14:21.411Z
> **Language**: English
> **Purpose**: Generate a Flask server script that serves the static HTML files from the haderos_project_hub directory and provides API endpoints for querying the SQLite knowledge base (kaia_knowledge.db). Include endpoints for semantic search (/api/search?q=query), getting relations (/api/relations?chunk_id=id), and getting document chunks (/api/chunks?doc_id=id). Ensure UTF-8 support for Arabic content and proper error handling. The server should run on port 8001.

# Flask Knowledge Base Server Implementation

## Complete Server Script

Below is a production-ready Flask server implementation that integrates the SQLite knowledge base with the Haderos Project Hub, providing comprehensive API endpoints for semantic search, relations, and document retrieval with full UTF-8 Arabic support.

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Haderos Project Hub - Knowledge Base API Server
Serves static files and provides API endpoints for querying the SQLite knowledge base
with full UTF-8 Arabic content support.
"""

from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
import sqlite3
import os
import logging
from functools import wraps
from typing import Dict, List, Any, Optional
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
class Config:
    """Server configuration"""
    STATIC_DIR = 'haderos_project_hub'
    DB_PATH = 'kaia_knowledge.db'
    PORT = 8001
    HOST = '0.0.0.0'
    DEBUG = False
    MAX_RESULTS = 100
    DEFAULT_LIMIT = 20

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # Enable UTF-8 JSON responses
app.config['JSON_SORT_KEYS'] = False
CORS(app)  # Enable CORS for all routes

# ============================================================================
# Database Connection Management
# ============================================================================

def get_db_connection() -> sqlite3.Connection:
    """
    Create a database connection with UTF-8 support.
    
    Returns:
        sqlite3.Connection: Database connection object
        
    Raises:
        sqlite3.Error: If database connection fails
    """
    try:
        conn = sqlite3.connect(Config.DB_PATH)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        conn.execute("PRAGMA encoding = 'UTF-8'")  # Ensure UTF-8 encoding
        return conn
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {e}")
        raise

def query_db(query: str, args: tuple = (), one: bool = False) -> Any:
    """
    Execute a database query and return results.
    
    Args:
        query: SQL query string
        args: Query parameters
        one: If True, return only first result
        
    Returns:
        Query results as list of dicts or single dict
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        
        # Convert rows to dictionaries
        rows = cur.fetchall()
        results = [dict(row) for row in rows]
        
        return results[0] if (one and results) else results
    except sqlite3.Error as e:
        logger.error(f"Query error: {e}")
        raise
    finally:
        conn.close()

# ============================================================================
# Error Handlers
# ============================================================================

def handle_errors(f):
    """Decorator for consistent error handling"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except sqlite3.Error as e:
            logger.error(f"Database error in {f.__name__}: {e}")
            return jsonify({
                'error': 'Database error',
                'message': str(e),
                'success': False
            }), 500
        except ValueError as e:
            logger.warning(f"Validation error in {f.__name__}: {e}")
            return jsonify({
                'error': 'Invalid input',
                'message': str(e),
                'success': False
            }), 400
        except Exception as e:
            logger.error(f"Unexpected error in {f.__name__}: {e}")
            return jsonify({
                'error': 'Internal server error',
                'message': str(e),
                'success': False
            }), 500
    return decorated_function

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested resource was not found',
        'success': False
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred',
        'success': False
    }), 500

# ============================================================================
# Static File Serving
# ============================================================================

@app.route('/')
def index():
    """Serve the main index.html page"""
    return send_from_directory(Config.STATIC_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """
    Serve static files from the haderos_project_hub directory.
    
    Args:
        path: Relative path to the file
        
    Returns:
        Static file or 404 error
    """
    try:
        return send_from_directory(Config.STATIC_DIR, path)
    except FileNotFoundError:
        abort(404)

# ============================================================================
# API Endpoints - Search
# ============================================================================

@app.route('/api/search', methods=['GET'])
@handle_errors
def search():
    """
    Semantic search endpoint for querying the knowledge base.
    
    Query Parameters:
        q (required): Search query string
        limit (optional): Maximum number of results (default: 20, max: 100)
        offset (optional): Result offset for pagination (default: 0)
        doc_id (optional): Filter by specific document ID
        
    Returns:
        JSON response with search results
        
    Example:
        GET /api/search?q=الذكاء الاصطناعي&limit=10
    """
    # Get and validate query parameter
    query = request.args.get('q', '').strip()
    if not query:
        raise ValueError("Search query 'q' parameter is required")
    
    # Get pagination parameters
    try:
        limit = min(int(request.args.get('limit', Config.DEFAULT_LIMIT)), Config.MAX_RESULTS)
        offset = int(request.args.get('offset', 0))
    except ValueError:
        raise ValueError("Invalid limit or offset parameter")
    
    # Optional document filter
    doc_id = request.args.get('doc_id')
    
    # Build SQL query
    sql = """
        SELECT 
            c.chunk_id,
            c.doc_id,
            c.chunk_text,
            c.chunk_index,
            c.token_count,
            c.embedding_model,
            d.title as doc_title,
            d.author as doc_author,
            d.source_type,
            d.file_path
        FROM chunks c
        LEFT JOIN documents d ON c.doc_id = d.doc_id
        WHERE c.chunk_text LIKE ?
    """
    
    params = [f'%{query}%']
    
    # Add document filter if specified
    if doc_id:
        sql += " AND c.doc_id = ?"
        params.append(doc_id)
    
    sql += " ORDER BY c.chunk_index LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    # Execute search
    results = query_db(sql, tuple(params))
    
    # Get total count for pagination
    count_sql = """
        SELECT COUNT(*) as total
        FROM chunks c
        WHERE c.chunk_text LIKE ?
    """
    count_params = [f'%{query}%']
    
    if doc_id:
        count_sql += " AND c.doc_id = ?"
        count_params.append(doc_id)
    
    total = query_db(count_sql, tuple(count_params), one=True)['total']
    
    logger.info(f"Search query: '{query}' returned {len(results)} results")
    
    return jsonify({
        'success': True,
        'query': query,
        'results': results,
        'pagination': {
            'total': total,
            'limit': limit,
            'offset': offset,
            'has_more': (offset + limit) < total
        }
    })

# ============================================================================
# API Endpoints - Relations
# ============================================================================

@app.route('/api/relations', methods=['GET'])
@handle_errors
def get_relations():
    """
    Get chunk relations (cross-references) for a specific chunk.
    
    Query Parameters:
        chunk_id (required): The chunk ID to get relations for
        relation_type (optional): Filter by relation type
        
    Returns:
        JSON response with related chunks
        
    Example:
        GET /api/relations?chunk_id=chunk_001&relation_type=reference
    """
    # Get and validate chunk_id
    chunk_id = request.args.get('chunk_id', '').strip()
    if not chunk_id:
        raise ValueError("Parameter 'chunk_id' is required")
    
    relation_type = request.args.get('relation_type')
    
    # Build SQL query to get relations
    sql = """
        SELECT 
            r.relation_id,
            r.source_chunk_id,
            r.target_chunk_id,
            r.relation_type,
            r.confidence_score,
            r.metadata,
            c1.chunk_text as source_text,
            c1.doc_id as source_doc_id,
            d1.title as source_doc_title,
            c2.chunk_text as target_text,
            c2.doc_id as target_doc_id,
            d2.title as target_doc_title
        FROM chunk_relations r
        LEFT JOIN chunks c1 ON r.source_chunk_id = c1.chunk_id
        LEFT JOIN chunks c2 ON r.target_chunk_id = c2.chunk_id
        LEFT JOIN documents d1 ON c1.doc_id = d1.doc_id
        LEFT JOIN documents d2 ON c2.doc_id = d2.doc_id
        WHERE r.source_chunk_id = ? OR r.target_chunk_id = ?
    """
    
    params = [chunk_id, chunk_id]
    
    # Add relation type filter if specified
    if relation_type:
        sql += " AND r.relation_type = ?"
        params.append(relation_type)
    
    sql += " ORDER BY r.confidence_score DESC"
    
    # Execute query
    results = query_db(sql, tuple(params))
    
    # Parse metadata JSON if present
    for result in results:
        if result.get('metadata'):
            try:
                result['metadata'] = json.loads(result['metadata'])
            except json.JSONDecodeError:
                result['metadata'] = {}
    
    logger.info(f"Relations for chunk '{chunk_id}': {len(results)} found")
    
    return jsonify({
        'success': True,
        'chunk_id': chunk_id,
        'relations': results,
        'count': len(results)
    })

# ============================================================================
# API Endpoints - Document Chunks
# ============================================================================

@app.route('/api/chunks', methods=['GET'])
@handle_errors
def get_chunks():
    """
    Get all chunks for a specific document.
    
    Query Parameters:
        doc_id (required): Document ID to retrieve chunks for
        limit (optional): Maximum number of chunks (default: 100)
        offset (optional): Chunk offset for pagination (default: 0)
        
    Returns:
        JSON response with document chunks
        
    Example:
        GET /api/chunks?doc_id=doc_001&limit=50
    """
    # Get and validate doc_id
    doc_id = request.args.get('doc_id', '').strip()
    if not doc_id:
        raise ValueError("Parameter 'doc_id' is required")
    
    # Get pagination parameters
    try:
        limit = min(int(request.args.get('limit', 100)), Config.MAX_RESULTS)
        offset = int(request.args.get('offset', 0))
    except ValueError:
        raise ValueError("Invalid limit or offset parameter")
    
    # Get document info
    doc_sql = """
        SELECT 
            doc_id,
            title,
            author,
            publication_date,
            source_type,
            file_path,
            metadata,
            created_at
        FROM documents
        WHERE doc_id = ?
    """
    
    document = query_db(doc_sql, (doc_id,), one=True)
    
    if not document:
        raise ValueError(f"Document with ID '{doc_id}' not found")
    
    # Parse document metadata
    if document.get('metadata'):
        try:
            document['metadata'] = json.loads(document['metadata'])
        except json.JSONDecodeError:
            document['metadata'] = {}
    
    # Get chunks for the document
    chunks_sql = """
        SELECT 
            chunk_id,
            doc_id,
            chunk_text,
            chunk_index,
            token_count,
            embedding_model,
            created_at
        FROM chunks
        WHERE doc_id = ?
        ORDER BY chunk_index
        LIMIT ? OFFSET ?
    """
    
    chunks = query_db(chunks_sql, (doc_id, limit, offset))
    
    # Get total chunk count
    count_sql = "SELECT COUNT(*) as total FROM chunks WHERE doc_id = ?"
    total = query_db(count_sql, (doc_id,), one=True)['total']
    
    logger.info(f"Retrieved {len(chunks)} chunks for document '{doc_id}'")
    
    return jsonify({
        'success': True,
        'document': document,
        'chunks': chunks,
        'pagination': {
            'total': total,
            'limit': limit,
            'offset': offset,
            'has_more': (offset + limit) < total
        }
    })

# ============================================================================
# API Endpoints - Documents List
# ============================================================================

@app.route('/api/documents', methods=['GET'])
@handle_errors
def get_documents():
    """
    Get list of all documents in the knowledge base.
    
    Query Parameters:
        source_type (optional): Filter by source type
        limit (optional): Maximum number of documents (default: 50)
        offset (optional): Document offset for pagination (default: 0)
        
    Returns:
        JSON response with document list
        
    Example:
        GET /api/documents?source_type=pdf&limit=20
    """
    # Get pagination parameters
    try:
        limit = min(int(request.args.get('limit', 50)), Config.MAX_RESULTS)
        offset = int(request.args.get('offset', 0))
    except ValueError:
        raise ValueError("Invalid limit or offset parameter")
    
    source_type = request.args.get('source_type')
    
    # Build SQL query
    sql = """
        SELECT 
            d.doc_id,
            d.title,
            d.author,
            d.publication_date,
            d.source_type,
            d.file_path,
            d.created_at,
            COUNT(c.chunk_id) as chunk_count
        FROM documents d
        LEFT JOIN chunks c ON d.doc_id = c.doc_id
    """
    
    params = []
    
    if source_type:
        sql += " WHERE d.source_type = ?"
        params.append(source_type)
    
    sql += " GROUP BY d.doc_id ORDER BY d.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    # Execute query
    documents = query_db(sql, tuple(params))
    
    # Get total count
    count_sql = "SELECT COUNT(*) as total FROM documents"
    count_params = []
    
    if source_type:
        count_sql += " WHERE source_type = ?"
        count_params.append(source_type)
    
    total = query_db(count_sql, tuple(count_

---
*Generated by Flowith OS Deep Thinking*