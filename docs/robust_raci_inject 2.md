> **Generated**: 2025-12-01T10:36:52.794Z
> **Language**: English
> **Purpose**: Generate the complete, robust Python script 'robust_raci_inject.py' based on the partial code from previous analysis. The script must: 1) Connect to kaia_knowledge.db and fetch data from kaia_agents, raci_matrix, decision_logs, team_members, raci_tasks, raci_assignments with proper JOINs. 2) Generate dark-themed Tailwind CSS HTML for agent status cards, RACI matrix table, and decision timeline. 3) Use multiple injection strategies: search for existing markers, fallback to </main> or </body>, create backup. 4) Include comprehensive logging and verification. 5) Handle empty data gracefully. 6) Ensure compatibility with existing governance.html structure. Output only the complete Python code without markdown.

```python
#!/usr/bin/env python3
"""
robust_raci_inject.py - Comprehensive RACI Matrix and Decision Log Injector
Connects to kaia_knowledge.db and injects dark-themed Tailwind CSS HTML into governance.html
"""

import sqlite3
import os
import sys
import shutil
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('raci_inject.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class RACIInjector:
    """Main class for RACI matrix and decision log injection"""
    
    def __init__(self, db_path: str = 'kaia_knowledge.db', html_path: str = 'governance.html'):
        self.db_path = db_path
        self.html_path = html_path
        self.backup_path = f"{html_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.conn = None
        
    def connect_database(self) -> bool:
        """Establish database connection"""
        try:
            if not os.path.exists(self.db_path):
                logger.error(f"Database not found: {self.db_path}")
                return False
            
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            logger.info(f"Connected to database: {self.db_path}")
            return True
        except sqlite3.Error as e:
            logger.error(f"Database connection failed: {e}")
            return False
    
    def fetch_agent_status(self) -> List[Dict]:
        """Fetch agent status data from kaia_agents table"""
        try:
            cursor = self.conn.cursor()
            query = """
                SELECT 
                    agent_id,
                    agent_name,
                    role,
                    status,
                    last_active,
                    capabilities,
                    current_task
                FROM kaia_agents
                ORDER BY agent_name
            """
            cursor.execute(query)
            agents = [dict(row) for row in cursor.fetchall()]
            logger.info(f"Fetched {len(agents)} agents")
            return agents
        except sqlite3.Error as e:
            logger.error(f"Error fetching agents: {e}")
            return []
    
    def fetch_raci_matrix(self) -> List[Dict]:
        """Fetch RACI matrix data with JOINs"""
        try:
            cursor = self.conn.cursor()
            query = """
                SELECT 
                    rt.task_id,
                    rt.task_name,
                    rt.task_description,
                    rt.task_category,
                    rt.priority,
                    rt.status as task_status,
                    ra.assignment_id,
                    ra.role_type,
                    tm.member_id,
                    tm.member_name,
                    tm.role as member_role,
                    ka.agent_name,
                    ka.status as agent_status
                FROM raci_tasks rt
                LEFT JOIN raci_assignments ra ON rt.task_id = ra.task_id
                LEFT JOIN team_members tm ON ra.member_id = tm.member_id
                LEFT JOIN kaia_agents ka ON tm.agent_id = ka.agent_id
                ORDER BY rt.priority DESC, rt.task_name, ra.role_type
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Group by task
            tasks_dict = {}
            for row in rows:
                task_id = row['task_id']
                if task_id not in tasks_dict:
                    tasks_dict[task_id] = {
                        'task_id': task_id,
                        'task_name': row['task_name'],
                        'task_description': row['task_description'],
                        'task_category': row['task_category'],
                        'priority': row['priority'],
                        'task_status': row['task_status'],
                        'assignments': {'R': [], 'A': [], 'C': [], 'I': []}
                    }
                
                if row['role_type'] and row['member_name']:
                    role_type = row['role_type']
                    member_info = {
                        'member_name': row['member_name'],
                        'member_role': row['member_role'],
                        'agent_name': row['agent_name'],
                        'agent_status': row['agent_status']
                    }
                    tasks_dict[task_id]['assignments'][role_type].append(member_info)
            
            tasks = list(tasks_dict.values())
            logger.info(f"Fetched {len(tasks)} RACI tasks")
            return tasks
        except sqlite3.Error as e:
            logger.error(f"Error fetching RACI matrix: {e}")
            return []
    
    def fetch_decision_logs(self) -> List[Dict]:
        """Fetch decision logs with related data"""
        try:
            cursor = self.conn.cursor()
            query = """
                SELECT 
                    dl.decision_id,
                    dl.decision_title,
                    dl.decision_description,
                    dl.decision_type,
                    dl.decision_date,
                    dl.status,
                    dl.impact_level,
                    dl.rationale,
                    dl.decided_by,
                    tm.member_name as decider_name,
                    ka.agent_name as decider_agent,
                    dl.affected_tasks,
                    dl.related_agents
                FROM decision_logs dl
                LEFT JOIN team_members tm ON dl.decided_by = tm.member_id
                LEFT JOIN kaia_agents ka ON tm.agent_id = ka.agent_id
                ORDER BY dl.decision_date DESC
                LIMIT 50
            """
            cursor.execute(query)
            decisions = [dict(row) for row in cursor.fetchall()]
            logger.info(f"Fetched {len(decisions)} decision logs")
            return decisions
        except sqlite3.Error as e:
            logger.error(f"Error fetching decision logs: {e}")
            return []
    
    def generate_agent_status_html(self, agents: List[Dict]) -> str:
        """Generate dark-themed agent status cards HTML"""
        if not agents:
            return """
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <p class="text-gray-400">No agent data available</p>
            </div>
            """
        
        html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">\n'
        
        for agent in agents:
            status = agent.get('status', 'unknown')
            status_colors = {
                'active': 'bg-green-900 text-green-300 border-green-700',
                'idle': 'bg-yellow-900 text-yellow-300 border-yellow-700',
                'offline': 'bg-gray-700 text-gray-400 border-gray-600',
                'error': 'bg-red-900 text-red-300 border-red-700'
            }
            status_class = status_colors.get(status.lower(), 'bg-gray-700 text-gray-400 border-gray-600')
            
            html += f"""
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
        <div class="flex items-start justify-between mb-3">
            <div>
                <h3 class="text-lg font-semibold text-white">{agent.get('agent_name', 'Unknown')}</h3>
                <p class="text-sm text-gray-400">{agent.get('role', 'No role assigned')}</p>
            </div>
            <span class="px-2 py-1 text-xs rounded border {status_class}">
                {status.upper()}
            </span>
        </div>
        <div class="space-y-2 text-sm">
            <div class="flex justify-between">
                <span class="text-gray-400">Last Active:</span>
                <span class="text-gray-300">{agent.get('last_active', 'Never')}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-400">Current Task:</span>
                <span class="text-gray-300 truncate ml-2">{agent.get('current_task', 'None')}</span>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-700">
                <p class="text-gray-400 text-xs">Capabilities:</p>
                <p class="text-gray-300 text-xs mt-1">{agent.get('capabilities', 'Not specified')}</p>
            </div>
        </div>
    </div>
            """
        
        html += '</div>\n'
        return html
    
    def generate_raci_matrix_html(self, tasks: List[Dict]) -> str:
        """Generate dark-themed RACI matrix table HTML"""
        if not tasks:
            return """
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <p class="text-gray-400">No RACI matrix data available</p>
            </div>
            """
        
        html = """
<div class="overflow-x-auto mb-8">
    <table class="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
        <thead class="bg-gray-900">
            <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-700">Task</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-700">Category</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-700">Priority</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-700">Status</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider border-b border-gray-700">R</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-blue-400 uppercase tracking-wider border-b border-gray-700">A</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider border-b border-gray-700">C</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-purple-400 uppercase tracking-wider border-b border-gray-700">I</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
        """
        
        for task in tasks:
            priority_colors = {
                'high': 'bg-red-900 text-red-300',
                'medium': 'bg-yellow-900 text-yellow-300',
                'low': 'bg-green-900 text-green-300'
            }
            priority_class = priority_colors.get(str(task.get('priority', '')).lower(), 'bg-gray-700 text-gray-400')
            
            status_colors = {
                'completed': 'bg-green-900 text-green-300',
                'in_progress': 'bg-blue-900 text-blue-300',
                'pending': 'bg-yellow-900 text-yellow-300',
                'blocked': 'bg-red-900 text-red-300'
            }
            status_class = status_colors.get(str(task.get('task_status', '')).lower(), 'bg-gray-700 text-gray-400')
            
            html += f"""
            <tr class="hover:bg-gray-750 transition-colors">
                <td class="px-4 py-3">
                    <div class="text-sm font-medium text-white">{task.get('task_name', 'Unnamed Task')}</div>
                    <div class="text-xs text-gray-400 mt-1">{task.get('task_description', '')[:100]}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-300">{task.get('task_category', 'General')}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 text-xs rounded {priority_class}">{task.get('priority', 'N/A')}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 text-xs rounded {status_class}">{task.get('task_status', 'N/A')}</span>
                </td>
            """
            
            # Add RACI assignments
            for role in ['R', 'A', 'C', 'I']:
                assignments = task['assignments'].get(role, [])
                html += '<td class="px-4 py-3 text-center text-sm">'
                if assignments:
                    for idx, member in enumerate(assignments):
                        if idx > 0:
                            html += '<br>'
                        html += f'<span class="text-gray-300">{member["member_name"]}</span>'
                else:
                    html += '<span class="text-gray-600">-</span>'
                html += '</td>'
            
            html += '</tr>\n'
        
        html += """
        </tbody>
    </table>
</div>
        """
        
        return html
    
    def generate_decision_timeline_html(self, decisions: List[Dict]) -> str:
        """Generate dark-themed decision timeline HTML"""
        if not decisions:
            return """
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <p class="text-gray-400">No decision logs available</p>
            </div>
            """
        
        html = '<div class="space-y-4 mb-8">\n'
        
        for decision in decisions:
            impact_colors = {
                'high': 'bg-red-900 text-red-300 border-red-700',
                'medium': 'bg-yellow-900 text-yellow-300 border-yellow-700',
                'low': 'bg-green-900 text-green-300 border-green-700'
            }
            impact_class = impact_colors.get(str(decision.get('impact_level', '')).lower(), 'bg-gray-700 text-gray-400 border-gray-600')
            
            status_colors = {
                'implemented': 'bg-green-900 text-green-300',
                'approved': 'bg-blue-900 text-blue-300',
                'pending': 'bg-yellow-900 text-yellow-300',
                'rejected': 'bg-red-900 text-red-300'
            }
            status_class = status_colors.get(str(decision.get('status', '')).lower(), 'bg-gray-700 text-gray-400')
            
            html += f"""
    

---
*Generated by Flowith OS Deep Thinking*