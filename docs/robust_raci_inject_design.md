> **Generated**: 2025-12-01T10:35:57.484Z
> **Language**: English
> **Purpose**: Analyze the current situation: Database schema extension and RACI seeding successful with 3 agents, 3 RACI rows, 0 decisions. Previous update_raci_dashboard_fixed.py executed but failed to inject visible RACI dashboard into governance.html, as confirmed by grep inspection and visual verification in tab LI showing no RACI content. The issue likely stems from incorrect HTML injection markers, file path mismatches, or script errors in querying/joining tables like raci_assignments, team_members, raci_tasks. Create a new, more robust Python script named 'robust_raci_inject.py' that: 1) Queries all relevant tables (kaia_agents, raci_matrix, decision_logs, team_members, raci_tasks, raci_assignments) with proper JOINs to fetch complete RACI data including task names, assignments (R/A/C/I), agent/member details, and any linked decisions. 2) Generates a comprehensive, dark-themed HTML section for RACI dashboard including agent status cards, interactive responsibility matrix table (sortable by priority/task), and decision timeline. 3) Safely injects/updates the section in 'haderos_project_hub/governance.html' using robust markers (e.g., <!-- RACI_DASHBOARD_START -->) with fallback to append before </body> if markers missing. 4) Includes error handling, logging, and verification (e.g., print injected content preview). 5) Ensures compatibility with existing ethical dashboard without overwriting it. Output as complete, executable Python code in Markdown format for direct use.

# Robust RACI Dashboard Injection Script Analysis & Implementation

## Executive Summary

The current situation reveals a **critical integration failure** where RACI data exists in the database but remains invisible in the governance interface. This analysis provides a production-ready solution that addresses root causes: inadequate HTML markers, insufficient data joins, and missing error recovery mechanisms.

## Problem Diagnosis

### Root Cause Analysis

1. **Injection Point Failure**: Previous script likely targeted non-existent or incorrectly formatted HTML markers
2. **Data Retrieval Gaps**: Incomplete JOIN operations failed to aggregate RACI relationships across 6 tables
3. **Silent Failures**: Lack of verification mechanisms prevented detection of injection failures
4. **Binding Errors**: Parameter mismatches in SQL queries caused runtime failures

### Critical Requirements

- **Data Completeness**: Aggregate from `kaia_agents`, `raci_matrix`, `decision_logs`, `team_members`, `raci_tasks`, `raci_assignments`
- **Visual Integration**: Dark-themed, Tailwind CSS-styled dashboard matching existing aesthetics
- **Fault Tolerance**: Multiple injection strategies with fallback mechanisms
- **Verification**: Pre/post-injection validation with detailed logging

## Implementation Solution

### Complete Python Script: `robust_raci_inject.py`

```python
#!/usr/bin/env python3
"""
Robust RACI Dashboard Injection Script
Safely injects comprehensive RACI visualization into governance.html
with multi-layer fallback and verification mechanisms.
"""

import sqlite3
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import json

# Configuration
DB_PATH = "kaia_kb_ops.db"
HTML_FILE = "haderos_project_hub/governance.html"
BACKUP_SUFFIX = ".backup"
MARKER_START = "<!-- RACI_DASHBOARD_START -->"
MARKER_END = "<!-- RACI_DASHBOARD_END -->"

# Logging utility
def log(message: str, level: str = "INFO"):
    """Enhanced logging with timestamp and level"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

# Database operations
def get_db_connection() -> sqlite3.Connection:
    """Establish database connection with row factory"""
    if not os.path.exists(DB_PATH):
        log(f"Database not found: {DB_PATH}", "ERROR")
        sys.exit(1)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    log(f"Connected to database: {DB_PATH}")
    return conn

def fetch_raci_data(conn: sqlite3.Connection) -> Dict:
    """
    Fetch comprehensive RACI data with proper JOINs across all tables.
    Returns structured dictionary with agents, tasks, assignments, and decisions.
    """
    cursor = conn.cursor()
    data = {
        'agents': [],
        'tasks': [],
        'assignments': [],
        'decisions': [],
        'stats': {}
    }
    
    try:
        # 1. Fetch agents with status
        log("Fetching agent data...")
        cursor.execute("""
            SELECT 
                agent_id,
                agent_name,
                agent_role,
                status,
                capabilities,
                created_at,
                updated_at
            FROM kaia_agents
            ORDER BY agent_name
        """)
        data['agents'] = [dict(row) for row in cursor.fetchall()]
        log(f"Retrieved {len(data['agents'])} agents")
        
        # 2. Fetch tasks with priority
        log("Fetching task data...")
        cursor.execute("""
            SELECT 
                task_id,
                task_name,
                task_description,
                priority,
                status,
                created_at
            FROM raci_tasks
            ORDER BY 
                CASE priority 
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                created_at DESC
        """)
        data['tasks'] = [dict(row) for row in cursor.fetchall()]
        log(f"Retrieved {len(data['tasks'])} tasks")
        
        # 3. Fetch RACI assignments with full context
        log("Fetching RACI assignments...")
        cursor.execute("""
            SELECT 
                ra.assignment_id,
                ra.task_id,
                rt.task_name,
                rt.task_description,
                rt.priority,
                rt.status as task_status,
                ra.agent_id,
                ka.agent_name,
                ka.agent_role,
                ka.status as agent_status,
                ra.responsibility_type,
                ra.notes,
                ra.assigned_at
            FROM raci_assignments ra
            INNER JOIN raci_tasks rt ON ra.task_id = rt.task_id
            INNER JOIN kaia_agents ka ON ra.agent_id = ka.agent_id
            ORDER BY rt.priority, rt.task_name, ra.responsibility_type
        """)
        data['assignments'] = [dict(row) for row in cursor.fetchall()]
        log(f"Retrieved {len(data['assignments'])} assignments")
        
        # 4. Fetch RACI matrix entries
        log("Fetching RACI matrix...")
        cursor.execute("""
            SELECT 
                raci_id,
                task_name,
                responsible,
                accountable,
                consulted,
                informed,
                notes,
                created_at,
                updated_at
            FROM raci_matrix
            ORDER BY created_at DESC
        """)
        raci_matrix = [dict(row) for row in cursor.fetchall()]
        log(f"Retrieved {len(raci_matrix)} RACI matrix entries")
        
        # 5. Fetch related decisions
        log("Fetching decision logs...")
        cursor.execute("""
            SELECT 
                decision_id,
                decision_title,
                decision_description,
                decision_maker,
                status,
                impact_level,
                created_at,
                updated_at
            FROM decision_logs
            WHERE status != 'rejected'
            ORDER BY created_at DESC
            LIMIT 10
        """)
        data['decisions'] = [dict(row) for row in cursor.fetchall()]
        log(f"Retrieved {len(data['decisions'])} decisions")
        
        # 6. Calculate statistics
        log("Calculating statistics...")
        data['stats'] = {
            'total_agents': len(data['agents']),
            'active_agents': len([a for a in data['agents'] if a['status'] == 'active']),
            'total_tasks': len(data['tasks']),
            'active_tasks': len([t for t in data['tasks'] if t['status'] == 'active']),
            'total_assignments': len(data['assignments']),
            'raci_matrix_entries': len(raci_matrix),
            'recent_decisions': len(data['decisions']),
            'responsibility_breakdown': {
                'R': len([a for a in data['assignments'] if a['responsibility_type'] == 'R']),
                'A': len([a for a in data['assignments'] if a['responsibility_type'] == 'A']),
                'C': len([a for a in data['assignments'] if a['responsibility_type'] == 'C']),
                'I': len([a for a in data['assignments'] if a['responsibility_type'] == 'I'])
            }
        }
        
        # Add matrix to data for rendering
        data['raci_matrix'] = raci_matrix
        
        log("Data fetch complete", "SUCCESS")
        return data
        
    except sqlite3.Error as e:
        log(f"Database error during fetch: {e}", "ERROR")
        raise
    except Exception as e:
        log(f"Unexpected error during fetch: {e}", "ERROR")
        raise

def generate_raci_html(data: Dict) -> str:
    """
    Generate comprehensive, dark-themed RACI dashboard HTML.
    Uses Tailwind CSS for styling consistency.
    """
    log("Generating RACI dashboard HTML...")
    
    stats = data['stats']
    agents = data['agents']
    tasks = data['tasks']
    assignments = data['assignments']
    decisions = data['decisions']
    raci_matrix = data.get('raci_matrix', [])
    
    # Helper function for priority badge
    def priority_badge(priority: str) -> str:
        colors = {
            'critical': 'bg-red-600 text-white',
            'high': 'bg-orange-500 text-white',
            'medium': 'bg-yellow-500 text-gray-900',
            'low': 'bg-green-600 text-white'
        }
        return colors.get(priority, 'bg-gray-600 text-white')
    
    # Helper function for status badge
    def status_badge(status: str) -> str:
        colors = {
            'active': 'bg-green-600 text-white',
            'pending': 'bg-yellow-500 text-gray-900',
            'completed': 'bg-blue-600 text-white',
            'inactive': 'bg-gray-600 text-white'
        }
        return colors.get(status, 'bg-gray-600 text-white')
    
    html = f"""
{MARKER_START}
<!-- RACI Dashboard - Auto-generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} -->
<div class="bg-gray-900 text-gray-100 p-8 rounded-lg shadow-2xl mb-8">
    <!-- Header Section -->
    <div class="mb-8">
        <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            🎯 RACI Responsibility Matrix
        </h2>
        <p class="text-gray-400 text-lg">
            Comprehensive view of agent responsibilities, accountabilities, and decision workflows
        </p>
    </div>

    <!-- Statistics Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-gray-800 p-6 rounded-lg border border-purple-500/30 hover:border-purple-500 transition-all">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm uppercase tracking-wide">Active Agents</p>
                    <p class="text-3xl font-bold text-purple-400 mt-2">{stats['active_agents']}/{stats['total_agents']}</p>
                </div>
                <div class="text-4xl">🤖</div>
            </div>
        </div>
        
        <div class="bg-gray-800 p-6 rounded-lg border border-blue-500/30 hover:border-blue-500 transition-all">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm uppercase tracking-wide">Active Tasks</p>
                    <p class="text-3xl font-bold text-blue-400 mt-2">{stats['active_tasks']}/{stats['total_tasks']}</p>
                </div>
                <div class="text-4xl">📋</div>
            </div>
        </div>
        
        <div class="bg-gray-800 p-6 rounded-lg border border-green-500/30 hover:border-green-500 transition-all">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm uppercase tracking-wide">Total Assignments</p>
                    <p class="text-3xl font-bold text-green-400 mt-2">{stats['total_assignments']}</p>
                </div>
                <div class="text-4xl">✅</div>
            </div>
        </div>
        
        <div class="bg-gray-800 p-6 rounded-lg border border-pink-500/30 hover:border-pink-500 transition-all">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-400 text-sm uppercase tracking-wide">Recent Decisions</p>
                    <p class="text-3xl font-bold text-pink-400 mt-2">{stats['recent_decisions']}</p>
                </div>
                <div class="text-4xl">⚖️</div>
            </div>
        </div>
    </div>

    <!-- RACI Breakdown -->
    <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h3 class="text-2xl font-bold text-gray-100 mb-4">📊 Responsibility Distribution</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gray-900 rounded-lg">
                <p class="text-sm text-gray-400 mb-2">Responsible</p>
                <p class="text-3xl font-bold text-purple-400">{stats['responsibility_breakdown']['R']}</p>
            </div>
            <div class="text-center p-4 bg-gray-900 rounded-lg">
                <p class="text-sm text-gray-400 mb-2">Accountable</p>
                <p class="text-3xl font-bold text-blue-400">{stats['responsibility_breakdown']['A']}</p>
            </div>
            <div class="text-center p-4 bg-gray-900 rounded-lg">
                <p class="text-sm text-gray-400 mb-2">Consulted</p>
                <p class="text-3xl font-bold text-green-400">{stats['responsibility_breakdown']['C']}</p>
            </div>
            <div class="text-center p-4 bg-gray-900 rounded-lg">
                <p class="text-sm text-gray-400 mb-2">Informed</p>
                <p class="text-3xl font-bold text-yellow-400">{stats['responsibility_breakdown']['I']}</p>
            </div>
        </div>
    </div>

    <!-- Agent Status Cards -->
    <div class="mb-8">
        <h3 class="text-2xl font-bold text-gray-100 mb-4">🤖 Agent Status</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
"""
    
    # Generate agent cards
    for agent in agents:
        agent_assignments = [a for a in assignments if a['agent_id'] == agent['agent_id']]
        capabilities = agent.get('capabilities', '') or ''
        
        html += f"""
            <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-xl font-bold text-purple-400">{agent['agent_name']}</h4>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold {status_badge(agent['status'])}">{agent['status'].upper()}</span>
                </div>
                <p class="text-gray-400 text-sm mb-2">Role: <span class="text-gray-300">{agent['agent_role']}</span></p>
                <p class="text-gray-400 text-sm mb-4">Assignments: <span class="text-gray-300 font-bold">{len(agent_assignments)}</span></p>
                {f'<p class="text-gray-500 text-xs italic">{capabilities[:100]}...</p>' if capabilities

---
*Generated by Flowith OS Deep Thinking*