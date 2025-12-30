#!/usr/bin/env python3
"""
Import NOW SHOES products from Google Sheets CSV to database
"""

import csv
import json
import os
import sys
import mysql.connector
from datetime import datetime

# Database connection from environment
DB_URL = os.getenv('DATABASE_URL', '')
if not DB_URL:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

# Parse DATABASE_URL (format: mysql://user:pass@host:port/dbname)
import re
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DB_URL)
if not match:
    print(f"ERROR: Invalid DATABASE_URL format: {DB_URL}")
    sys.exit(1)

db_user, db_pass, db_host, db_port, db_name = match.groups()

print(f"Connecting to database: {db_host}:{db_port}/{db_name}")

# Connect to database
conn = mysql.connector.connect(
    host=db_host,
    port=int(db_port),
    user=db_user,
    password=db_pass,
    database=db_name
)
cursor = conn.cursor()

print("Connected successfully!")

# Read CSV file
csv_file = '/tmp/nowshoes_products.csv'
print(f"\nReading CSV file: {csv_file}")

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

headers = rows[0]
data_rows = rows[1:]

print(f"Found {len(data_rows)} products in CSV")

# Column mapping
col_images = 0
col_name = 1
col_description = 2
col_model_code = 3
col_base_price = 4
col_discounted_price = 5
col_discount_pct = 6
col_sizes = 7
col_colors = 8
col_stock = 9
col_category = 10
col_brand = 11
col_special_offers = 12
col_status = 13
col_date_added = 14

# Import products
imported = 0
skipped = 0
errors = []

for idx, row in enumerate(data_rows, start=1):
    try:
        # Extract data
        images_str = row[col_images].strip()
        name = row[col_name].strip()
        description = row[col_description].strip()
        model_code = row[col_model_code].strip()
        base_price = float(row[col_base_price].strip() or 0)
        discounted_price = float(row[col_discounted_price].strip() or 0)
        sizes_str = row[col_sizes].strip()
        colors_str = row[col_colors].strip()
        stock = int(row[col_stock].strip() or 0)
        category = row[col_category].strip()
        brand = row[col_brand].strip()
        special_offers = row[col_special_offers].strip() if len(row) > col_special_offers else ''
        status = row[col_status].strip() if len(row) > col_status else 'متاح'
        
        # Validate required fields
        if not model_code or not name:
            errors.append(f"Row {idx}: Missing model code or name")
            continue
        
        if base_price <= 0:
            errors.append(f"Row {idx}: Invalid base price: {base_price}")
            continue
        
        # Parse images (Google Drive URLs separated by newlines)
        image_urls = [url.strip() for url in images_str.split('\n') if url.strip() and 'drive.google.com' in url]
        
        # Parse sizes (comma-separated)
        sizes = [s.strip() for s in sizes_str.replace('/', ',').split(',') if s.strip()]
        
        # Parse colors (comma-separated)
        colors = [c.strip() for c in colors_str.replace('/', ',').split(',') if c.strip()]
        
        # Check if product already exists
        cursor.execute("SELECT id FROM nowshoes_products WHERE model_code = %s", (model_code,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"  [{idx}] Skipping {model_code} - already exists")
            skipped += 1
            continue
        
        # Insert product
        cursor.execute("""
            INSERT INTO nowshoes_products (
                model_code, name_ar, description_ar, category, brand,
                base_price, discounted_price, stock_quantity, status,
                special_offers, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            model_code, name, description, category, brand,
            base_price, discounted_price or base_price, stock,
            'active' if status == 'متاح' else 'inactive',
            special_offers
        ))
        
        product_id = cursor.lastrowid
        
        # Insert images
        for img_idx, img_url in enumerate(image_urls):
            cursor.execute("""
                INSERT INTO nowshoes_product_images (
                    product_id, image_url, is_primary, display_order, created_at
                ) VALUES (%s, %s, %s, %s, NOW())
            """, (product_id, img_url, img_idx == 0, img_idx))
        
        # Insert sizes
        for size in sizes:
            cursor.execute("""
                INSERT INTO nowshoes_product_sizes (product_id, size, created_at)
                VALUES (%s, %s, NOW())
            """, (product_id, size))
        
        # Insert colors
        for color in colors:
            cursor.execute("""
                INSERT INTO nowshoes_product_colors (product_id, color, created_at)
                VALUES (%s, %s, NOW())
            """, (product_id, color))
        
        print(f"  [{idx}] ✓ Imported {model_code} - {name} ({len(image_urls)} images, {len(sizes)} sizes, {len(colors)} colors)")
        imported += 1
        
    except Exception as e:
        error_msg = f"Row {idx}: {str(e)}"
        errors.append(error_msg)
        print(f"  [{idx}] ✗ Error: {e}")

# Commit changes
conn.commit()

print(f"\n{'='*60}")
print(f"Import Summary:")
print(f"  Total products in CSV: {len(data_rows)}")
print(f"  Successfully imported: {imported}")
print(f"  Skipped (already exist): {skipped}")
print(f"  Errors: {len(errors)}")

if errors:
    print(f"\nErrors:")
    for error in errors[:10]:  # Show first 10 errors
        print(f"  - {error}")
    if len(errors) > 10:
        print(f"  ... and {len(errors) - 10} more errors")

# Close connection
cursor.close()
conn.close()

print(f"\n✓ Import complete!")
