> **Generated**: 2025-11-30T20:24:33.096Z
> **Language**: English
> **Purpose**: Generate a complete, corrected Python bridge script named 'update_governance_html.py' that connects to 'kaia_knowledge.db', queries the JOIN from operational_matrix, constitutional_memory, and quranic_index tables (using the verification query structure: SELECT om.scenario_trigger, cm.principle_name, qi.surah_ayah, om.response_protocol FROM operational_matrix om JOIN constitutional_memory cm ON om.linked_axiom_id = cm.axiom_id JOIN quranic_index qi ON om.linked_source_id = qi.index_id WHERE om.active_status = 1 ORDER BY om.op_code), fetches the live ethical data, and dynamically generates/updates 'governance.html' with a professional dashboard displaying the integrated data in tables or cards (include Arabic support, styling with CSS, and ensure it's self-contained HTML). Include error handling, logging, and a summary of generated content. Base the HTML on a clean, responsive design showing principles, triggers, protocols, and Quranic references.

# Complete Python Bridge Script: update_governance_html.py

Below is the complete, production-ready Python script that connects to the Kaia Knowledge Base, queries the integrated ethical framework, and generates a professional, responsive HTML dashboard.

---

## Full Script Code

```python
#!/usr/bin/env python3
"""
update_governance_html.py

Purpose: Bridge script to query kaia_knowledge.db and generate governance.html
         displaying integrated ethical framework data with Quranic references.

Author: Kaia Ethics System
Date: 2025-11-30
Version: 1.0.0
"""

import sqlite3
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

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


class GovernanceDashboardGenerator:
    """Generates HTML governance dashboard from Kaia Knowledge Base."""
    
    DB_PATH = "kaia_knowledge.db"
    OUTPUT_PATH = "governance.html"
    
    # Verification query structure
    QUERY = """
        SELECT 
            om.op_code,
            om.scenario_trigger,
            om.response_protocol,
            cm.principle_name,
            cm.definition,
            cm.hierarchy_tier,
            qi.surah_ayah,
            qi.arabic_text,
            qi.translation_en,
            qi.thematic_tag,
            om.active_status
        FROM operational_matrix om
        JOIN constitutional_memory cm 
            ON om.linked_axiom_id = cm.axiom_id
        JOIN quranic_index qi 
            ON om.linked_source_id = qi.index_id
        WHERE om.active_status = 1
        ORDER BY om.op_code
    """
    
    def __init__(self):
        """Initialize the generator."""
        self.connection: Optional[sqlite3.Connection] = None
        self.data: List[Dict[str, Any]] = []
        
    def connect_database(self) -> bool:
        """
        Establish connection to the knowledge base.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            db_file = Path(self.DB_PATH)
            if not db_file.exists():
                logger.error(f"Database file not found: {self.DB_PATH}")
                return False
                
            self.connection = sqlite3.connect(self.DB_PATH)
            self.connection.row_factory = sqlite3.Row
            logger.info(f"Successfully connected to {self.DB_PATH}")
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Database connection error: {e}")
            return False
            
    def fetch_governance_data(self) -> bool:
        """
        Execute query and fetch integrated ethical framework data.
        
        Returns:
            bool: True if data fetched successfully, False otherwise
        """
        try:
            if not self.connection:
                logger.error("No database connection available")
                return False
                
            cursor = self.connection.cursor()
            cursor.execute(self.QUERY)
            rows = cursor.fetchall()
            
            self.data = [dict(row) for row in rows]
            logger.info(f"Fetched {len(self.data)} governance records")
            
            if not self.data:
                logger.warning("No active governance records found in database")
                
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Query execution error: {e}")
            return False
            
    def generate_html(self) -> str:
        """
        Generate complete HTML dashboard with integrated data.
        
        Returns:
            str: Complete HTML document
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        total_records = len(self.data)
        
        # Group data by principle for better organization
        principles_map: Dict[str, List[Dict]] = {}
        for record in self.data:
            principle = record['principle_name']
            if principle not in principles_map:
                principles_map[principle] = []
            principles_map[principle].append(record)
        
        # Generate principle cards HTML
        principle_cards_html = self._generate_principle_cards(principles_map)
        
        # Generate operational matrix table HTML
        operations_table_html = self._generate_operations_table(self.data)
        
        # Generate statistics
        stats_html = self._generate_statistics(principles_map, total_records)
        
        # Complete HTML template
        html_content = f"""<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Kaia Ethical Governance Dashboard - Integrated Framework">
    <meta name="generator" content="update_governance_html.py v1.0.0">
    <title>Kaia Governance Dashboard | Ethical Framework</title>
    <style>
        /* CSS Reset and Base Styles */
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        :root {{
            --primary-color: #2c3e50;
            --secondary-color: #3498db;
            --accent-color: #e74c3c;
            --success-color: #27ae60;
            --warning-color: #f39c12;
            --bg-color: #ecf0f1;
            --card-bg: #ffffff;
            --text-primary: #2c3e50;
            --text-secondary: #7f8c8d;
            --border-color: #bdc3c7;
            --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            --shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.15);
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
            padding: 20px;
        }}
        
        /* Arabic Text Support */
        .arabic {{
            font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Scheherazade', serif;
            font-size: 1.3em;
            direction: rtl;
            text-align: right;
            line-height: 2;
            color: var(--primary-color);
            font-weight: 600;
        }}
        
        /* Container */
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: var(--bg-color);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }}
        
        /* Header */
        header {{
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        
        header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }}
        
        header p {{
            font-size: 1.1em;
            opacity: 0.95;
        }}
        
        .timestamp {{
            margin-top: 15px;
            font-size: 0.9em;
            opacity: 0.85;
            font-style: italic;
        }}
        
        /* Main Content */
        main {{
            padding: 30px;
        }}
        
        /* Statistics Bar */
        .stats-bar {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .stat-card {{
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}
        
        .stat-card:hover {{
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }}
        
        .stat-number {{
            font-size: 2.5em;
            font-weight: bold;
            color: var(--secondary-color);
            display: block;
            margin-bottom: 5px;
        }}
        
        .stat-label {{
            color: var(--text-secondary);
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        /* Section Headers */
        .section-header {{
            display: flex;
            align-items: center;
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 3px solid var(--secondary-color);
        }}
        
        .section-header h2 {{
            font-size: 1.8em;
            color: var(--primary-color);
            flex-grow: 1;
        }}
        
        .section-badge {{
            background: var(--secondary-color);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        /* Principle Cards */
        .principles-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }}
        
        .principle-card {{
            background: var(--card-bg);
            border-radius: 10px;
            box-shadow: var(--shadow);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}
        
        .principle-card:hover {{
            transform: translateY(-8px);
            box-shadow: var(--shadow-hover);
        }}
        
        .principle-header {{
            background: linear-gradient(135deg, var(--secondary-color), #5dade2);
            color: white;
            padding: 20px;
        }}
        
        .principle-title {{
            font-size: 1.4em;
            font-weight: 700;
            margin-bottom: 8px;
        }}
        
        .principle-tier {{
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: 600;
        }}
        
        .principle-body {{
            padding: 20px;
        }}
        
        .definition {{
            color: var(--text-secondary);
            font-style: italic;
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-left: 4px solid var(--secondary-color);
            border-radius: 4px;
        }}
        
        .operations-list {{
            margin-top: 15px;
        }}
        
        .operation-item {{
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 6px;
            border-left: 4px solid var(--success-color);
        }}
        
        .op-code {{
            font-weight: bold;
            color: var(--secondary-color);
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        
        .scenario {{
            margin: 8px 0;
            font-weight: 600;
            color: var(--text-primary);
        }}
        
        .protocol {{
            color: var(--text-secondary);
            font-size: 0.95em;
            margin: 8px 0;
        }}
        
        .quranic-ref {{
            margin-top: 12px;
            padding: 12px;
            background: #fff9e6;
            border-radius: 6px;
            border: 1px solid #ffd700;
        }}
        
        .surah-ayah {{
            font-weight: bold;
            color: var(--warning-color);
            margin-bottom: 8px;
            display: block;
        }}
        
        .thematic-tag {{
            display: inline-block;
            background: var(--warning-color);
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.75em;
            margin-top: 5px;
        }}
        
        /* Operations Table */
        .table-container {{
            background: var(--card-bg);
            border-radius: 10px;
            box-shadow: var(--shadow);
            overflow: hidden;
            margin-bottom: 30px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        thead {{
            background: var(--primary-color);
            color: white;
        }}
        
        th {{
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }}
        
        tbody tr {{
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.2s ease;
        }}
        
        tbody tr:hover {{
            background-color: #f8f9fa;
        }}
        
        td {{
            padding: 15px;
            vertical-align: top;
        }}
        
        tbody tr:last-child {{
            border-bottom: none;
        }}
        
        /* Status Badge */
        .status-active {{
            display: inline-block;
            background: var(--success-color);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }}
        
        /* Footer */
        footer {{
            background: var(--primary-color);
            color: white;
            padding: 25px 30px;
            text-align: center;
        }}
        
        footer p {{
            margin: 5px 0;
            font-size: 0.9em;
        }}
        
        /* Responsive Design */
        @media (max-width: 768px) {{
            body {{
                padding: 10px;
            }}
            
            header h1 {{
                font-size: 1.8em;
            }}
            
            .principles-grid {{
                grid-template-columns: 1fr;
            }}
            
            .stats-bar {{
                grid-template-columns: 1fr;
            }}
            
            table {{
                font-size: 0.85em;
            }}
            
            th, td {{
                padding: 10px;
            }}
        }}
        
        /* Print

---
*Generated by Flowith OS Deep Thinking*