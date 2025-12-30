> **Generated**: 2025-11-30T20:42:06.361Z
> **Language**: English
> **Purpose**: Generate a complete Python script named 'update_governance_raci_agents.py' that connects to 'kaia_knowledge.db', queries the new tables (kaia_agents for agent status, raci_matrix for RACI data, decision_logs for recent logs), and updates 'haderos_project_hub/governance.html' by injecting new dashboard sections: 1) Agent Status panel showing agent names, roles, models, and status badges; 2) RACI Matrix table visualizing responsibilities; 3) Recent Decision Logs timeline. Use markers like '<!-- KAIA_AGENTS_START -->' for injection/replacement. Match existing dashboard styling (dark theme, gradients, responsive). Include error handling, logging, and verification of file update.

# Complete Python Script: update_governance_raci_agents.py

## Overview
This script connects to the `kaia_knowledge.db` SQLite database, queries agent status, RACI matrix data, and recent decision logs, then dynamically updates the `governance.html` file with styled dashboard sections matching the existing dark theme aesthetic.

---

## Python Script

```python
#!/usr/bin/env python3
"""
update_governance_raci_agents.py

Connects to kaia_knowledge.db and updates governance.html with:
1. Agent Status Dashboard
2. RACI Matrix Visualization
3. Recent Decision Logs Timeline

Maintains dark theme styling and responsive design.
"""

import sqlite3
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('governance_update.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class GovernanceDashboardUpdater:
    """Manages updates to the governance dashboard HTML file."""
    
    def __init__(self, db_path: str = 'kaia_knowledge.db', 
                 html_path: str = 'haderos_project_hub/governance.html'):
        """
        Initialize the updater with database and HTML file paths.
        
        Args:
            db_path: Path to SQLite database
            html_path: Path to governance HTML file
        """
        self.db_path = Path(db_path)
        self.html_path = Path(html_path)
        self.connection: Optional[sqlite3.Connection] = None
        
        # Validate paths
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found: {self.db_path}")
        if not self.html_path.exists():
            raise FileNotFoundError(f"HTML file not found: {self.html_path}")
    
    def connect_db(self) -> None:
        """Establish database connection with error handling."""
        try:
            self.connection = sqlite3.connect(str(self.db_path))
            self.connection.row_factory = sqlite3.Row
            logger.info(f"Connected to database: {self.db_path}")
        except sqlite3.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_db(self) -> None:
        """Close database connection safely."""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def query_agent_status(self) -> List[Dict]:
        """
        Query kaia_agents table for agent status information.
        
        Returns:
            List of agent dictionaries with status data
        """
        try:
            cursor = self.connection.cursor()
            query = """
                SELECT 
                    agent_name,
                    agent_role,
                    model_used,
                    status,
                    last_active,
                    total_tasks,
                    success_rate
                FROM kaia_agents
                ORDER BY agent_name
            """
            cursor.execute(query)
            agents = [dict(row) for row in cursor.fetchall()]
            logger.info(f"Retrieved {len(agents)} agents from database")
            return agents
        except sqlite3.Error as e:
            logger.error(f"Failed to query agent status: {e}")
            return []
    
    def query_raci_matrix(self) -> List[Dict]:
        """
        Query raci_matrix table for responsibility assignments.
        
        Returns:
            List of RACI assignment dictionaries
        """
        try:
            cursor = self.connection.cursor()
            query = """
                SELECT 
                    task_name,
                    responsible,
                    accountable,
                    consulted,
                    informed,
                    task_category,
                    priority
                FROM raci_matrix
                ORDER BY 
                    CASE priority
                        WHEN 'Critical' THEN 1
                        WHEN 'High' THEN 2
                        WHEN 'Medium' THEN 3
                        WHEN 'Low' THEN 4
                        ELSE 5
                    END,
                    task_name
            """
            cursor.execute(query)
            raci_data = [dict(row) for row in cursor.fetchall()]
            logger.info(f"Retrieved {len(raci_data)} RACI entries from database")
            return raci_data
        except sqlite3.Error as e:
            logger.error(f"Failed to query RACI matrix: {e}")
            return []
    
    def query_recent_decisions(self, limit: int = 10) -> List[Dict]:
        """
        Query decision_logs table for recent decisions.
        
        Args:
            limit: Maximum number of recent decisions to retrieve
            
        Returns:
            List of decision log dictionaries
        """
        try:
            cursor = self.connection.cursor()
            query = """
                SELECT 
                    decision_id,
                    decision_title,
                    decision_maker,
                    decision_date,
                    decision_status,
                    impact_level,
                    decision_summary
                FROM decision_logs
                ORDER BY decision_date DESC
                LIMIT ?
            """
            cursor.execute(query, (limit,))
            decisions = [dict(row) for row in cursor.fetchall()]
            logger.info(f"Retrieved {len(decisions)} recent decisions from database")
            return decisions
        except sqlite3.Error as e:
            logger.error(f"Failed to query decision logs: {e}")
            return []
    
    def generate_agent_status_html(self, agents: List[Dict]) -> str:
        """
        Generate HTML for Agent Status Dashboard section.
        
        Args:
            agents: List of agent data dictionaries
            
        Returns:
            HTML string for agent status section
        """
        if not agents:
            return """
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> No agent data available
            </div>
            """
        
        status_badges = {
            'active': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Active</span>',
            'idle': '<span class="badge badge-info"><i class="fas fa-pause-circle"></i> Idle</span>',
            'offline': '<span class="badge badge-secondary"><i class="fas fa-power-off"></i> Offline</span>',
            'error': '<span class="badge badge-danger"><i class="fas fa-exclamation-circle"></i> Error</span>'
        }
        
        agent_cards = []
        for agent in agents:
            status = agent.get('status', 'unknown').lower()
            badge = status_badges.get(status, '<span class="badge badge-secondary">Unknown</span>')
            
            success_rate = agent.get('success_rate', 0)
            success_color = 'success' if success_rate >= 90 else 'warning' if success_rate >= 70 else 'danger'
            
            last_active = agent.get('last_active', 'Never')
            if last_active and last_active != 'Never':
                try:
                    dt = datetime.fromisoformat(last_active)
                    last_active = dt.strftime('%Y-%m-%d %H:%M')
                except:
                    pass
            
            card_html = f"""
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card agent-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-robot text-primary"></i> {agent.get('agent_name', 'Unknown')}
                            </h5>
                            {badge}
                        </div>
                        <p class="card-text text-muted mb-2">
                            <strong>Role:</strong> {agent.get('agent_role', 'N/A')}
                        </p>
                        <p class="card-text text-muted mb-2">
                            <strong>Model:</strong> <code class="text-info">{agent.get('model_used', 'N/A')}</code>
                        </p>
                        <p class="card-text text-muted mb-2">
                            <strong>Last Active:</strong> {last_active}
                        </p>
                        <div class="mt-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Success Rate</small>
                                <small><strong>{success_rate}%</strong></small>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar bg-{success_color}" role="progressbar" 
                                     style="width: {success_rate}%;" aria-valuenow="{success_rate}" 
                                     aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                        <p class="card-text text-muted mt-2 mb-0">
                            <small><i class="fas fa-tasks"></i> Total Tasks: {agent.get('total_tasks', 0)}</small>
                        </p>
                    </div>
                </div>
            </div>
            """
            agent_cards.append(card_html)
        
        return f"""
        <section class="dashboard-section mb-5">
            <div class="section-header mb-4">
                <h2 class="section-title">
                    <i class="fas fa-users-cog text-gradient"></i> KAIA Agent Status Dashboard
                </h2>
                <p class="text-muted">Real-time monitoring of AI agent fleet performance and availability</p>
            </div>
            <div class="row">
                {''.join(agent_cards)}
            </div>
        </section>
        """
    
    def generate_raci_matrix_html(self, raci_data: List[Dict]) -> str:
        """
        Generate HTML for RACI Matrix visualization.
        
        Args:
            raci_data: List of RACI assignment dictionaries
            
        Returns:
            HTML string for RACI matrix section
        """
        if not raci_data:
            return """
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> No RACI matrix data available
            </div>
            """
        
        priority_badges = {
            'Critical': '<span class="badge badge-danger">Critical</span>',
            'High': '<span class="badge badge-warning">High</span>',
            'Medium': '<span class="badge badge-info">Medium</span>',
            'Low': '<span class="badge badge-secondary">Low</span>'
        }
        
        rows = []
        for item in raci_data:
            priority_badge = priority_badges.get(item.get('priority', 'Medium'), 
                                                  '<span class="badge badge-secondary">N/A</span>')
            
            row_html = f"""
            <tr>
                <td>
                    <strong>{item.get('task_name', 'Unknown Task')}</strong>
                    <br><small class="text-muted">{item.get('task_category', 'General')}</small>
                </td>
                <td>{priority_badge}</td>
                <td><span class="raci-badge raci-r">{item.get('responsible', '-')}</span></td>
                <td><span class="raci-badge raci-a">{item.get('accountable', '-')}</span></td>
                <td><span class="raci-badge raci-c">{item.get('consulted', '-')}</span></td>
                <td><span class="raci-badge raci-i">{item.get('informed', '-')}</span></td>
            </tr>
            """
            rows.append(row_html)
        
        return f"""
        <section class="dashboard-section mb-5">
            <div class="section-header mb-4">
                <h2 class="section-title">
                    <i class="fas fa-sitemap text-gradient"></i> RACI Responsibility Matrix
                </h2>
                <p class="text-muted">Clear accountability framework for project tasks and decisions</p>
                <div class="raci-legend mt-3">
                    <span class="raci-badge raci-r">R</span> Responsible (Executes)
                    <span class="raci-badge raci-a ml-3">A</span> Accountable (Approves)
                    <span class="raci-badge raci-c ml-3">C</span> Consulted (Advises)
                    <span class="raci-badge raci-i ml-3">I</span> Informed (Notified)
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-dark table-hover raci-table">
                    <thead>
                        <tr>
                            <th>Task / Activity</th>
                            <th>Priority</th>
                            <th>Responsible</th>
                            <th>Accountable</th>
                            <th>Consulted</th>
                            <th>Informed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join(rows)}
                    </tbody>
                </table>
            </div>
        </section>
        """
    
    def generate_decision_logs_html(self, decisions: List[Dict]) -> str:
        """
        Generate HTML for Recent Decision Logs timeline.
        
        Args:
            decisions: List of decision log dictionaries
            
        Returns:
            HTML string for decision logs section
        """
        if not decisions:
            return """
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No recent decisions recorded
            </div>
            """
        
        status_icons = {
            'approved': '<i class="fas fa-check-circle text-success"></i>',
            'pending': '<i class="fas fa-clock text-warning"></i>',
            'rejected': '<i class="fas fa-times-circle text-danger"></i>',
            'implemented': '<i class="fas fa-rocket text-info"></i>'
        }
        
        impact_badges = {
            'High': '<span class="badge badge-danger">High Impact</span>',
            'Medium': '<span class="badge badge-warning">Medium Impact</span>',
            'Low': '<span class="badge badge-info">Low Impact</span>'
        }
        
        timeline_items = []
        for decision in decisions:
            status = decision.get('decision_status', 'unknown').lower()
            icon = status_icons.get(status, '<i class="fas fa-circle text-secondary"></i>')
            
            impact = decision.get('impact_level', 'Medium')
            impact_badge = impact_badges.get(impact, '<span class="badge badge-secondary">Unknown</span>')
            
            decision_date = decision.get('decision_date', 'Unknown')
            if decision_date and decision_date != 'Unknown':
                try:
                    dt = datetime.fromisoformat(decision_date)
                    decision_date = dt.strftime('%B %d, %Y at %H:%M')
                except:
                    pass
            
            summary = decision.get('decision_summary', 'No summary available')
            if len(summary) > 200:
                summary = summary[:197] + '...'
            
            item_html = f"""
            <div class="timeline-item">
                <div class="timeline-icon">
                    {icon}
                </div>
                <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h

---
*Generated by Flowith OS Deep Thinking*