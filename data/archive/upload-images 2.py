#!/usr/bin/env python3
"""
Upload Product Images to S3 and Database
Simple script to upload test images for AMA8 product
"""

import os
import base64
import requests
import json
from pathlib import Path

# Configuration
API_BASE = "http://localhost:3000/api/trpc"
STORAGE_API_URL = os.getenv("BUILT_IN_FORGE_API_URL") + "/storage"
STORAGE_API_KEY = os.getenv("BUILT_IN_FORGE_API_KEY")
DB_URL = os.getenv("DATABASE_URL")

# Test images
TEST_IMAGES = [
    {"path": "/home/ubuntu/haderos-mvp/temp/product-images/1.jpg", "name": "ama8-white.jpg"},
    {"path": "/home/ubuntu/haderos-mvp/temp/product-images/2.jpg", "name": "ama8-black-red.jpg"},
    {"path": "/home/ubuntu/haderos-mvp/temp/product-images/3.jpg", "name": "ama8-black.jpg"},
    {"path": "/home/ubuntu/haderos-mvp/temp/product-images/4.jpg", "name": "ama8-white-red.jpg"},
]

def upload_to_s3(image_path, s3_key):
    """Upload image to S3 via Manus Storage API"""
    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Convert to base64
        base64_data = base64.b64encode(image_data).decode('utf-8')
        
        # Upload via API
        response = requests.post(
            f"{STORAGE_API_URL}/put",
            headers={
                "Authorization": f"Bearer {STORAGE_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "key": s3_key,
                "data": base64_data,
                "contentType": "image/jpeg"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Uploaded: {s3_key}")
            return result.get('url')
        else:
            print(f"❌ Upload failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error uploading {image_path}: {e}")
        return None

def insert_product_image(product_id, s3_url, s3_key, is_primary=False):
    """Insert product image into database"""
    try:
        import mysql.connector
        
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        
        cursor = conn.cursor()
        
        query = """
        INSERT INTO product_images 
        (product_id, s3_url, s3_key, image_type, is_primary, sort_order, uploaded_at)
        VALUES (%s, %s, %s, 'product', %s, 0, NOW())
        """
        
        cursor.execute(query, (product_id, s3_url, s3_key, 1 if is_primary else 0))
        conn.commit()
        
        image_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        print(f"✅ Inserted into DB: Image ID {image_id}")
        return image_id
        
    except Exception as e:
        print(f"❌ DB insert failed: {e}")
        return None

def main():
    print("🚀 Starting image upload process...\n")
    
    # AMA8 product ID (from database)
    # You need to find this from your database first
    product_id = 5  # Replace with actual AMA8 product ID
    
    print(f"📦 Uploading images for product ID: {product_id}\n")
    
    for i, image in enumerate(TEST_IMAGES):
        print(f"\n📸 Processing image {i+1}/{len(TEST_IMAGES)}: {image['name']}")
        
        # Check if file exists
        if not os.path.exists(image['path']):
            print(f"⏭️  File not found: {image['path']}")
            continue
        
        # Upload to S3
        s3_key = f"products/AMA8/{image['name']}"
        s3_url = upload_to_s3(image['path'], s3_key)
        
        if not s3_url:
            print(f"⏭️  Skipping {image['name']}")
            continue
        
        # Insert into database
        is_primary = (i == 0)  # First image is primary
        image_id = insert_product_image(product_id, s3_url, s3_key, is_primary)
        
        if image_id:
            print(f"✅ Completed: {image['name']}")
    
    print("\n✅ Upload process completed!")
    print("\n📝 Next steps:")
    print("1. Generate embeddings using the visual search API")
    print("2. Test visual search in the UI")

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    main()
