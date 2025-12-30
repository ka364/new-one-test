"""
Product API Endpoints - Now Shoes Integration
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.models.product import Product
import pandas as pd
from io import BytesIO
from decimal import Decimal

router = APIRouter()


@router.post("/import-excel")
async def import_products_from_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    استيراد المنتجات من ملف Excel
    Import products from Excel file (Now Shoes format)
    """
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        imported = 0
        updated = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row.get('كود الموديل')):
                    continue
                
                model_code = str(row.get('كود الموديل', '')).strip()
                
                # Check if product exists
                existing = db.query(Product).filter(
                    Product.model_code == model_code
                ).first()
                
                # Parse prices
                try:
                    base_price = float(row.get('السعر الأساسي', row.get('السعر', 0)))
                except:
                    base_price = 0
                
                try:
                    discounted_price = float(row.get('السعر بعد الخصم'))
                except:
                    discounted_price = None
                
                # Calculate discount percentage
                discount_percent = 0
                if discounted_price and base_price > 0:
                    discount_percent = ((base_price - discounted_price) / base_price) * 100
                
                # Parse images (comma or newline separated URLs)
                images_str = str(row.get('صور المنتج', ''))
                
                if existing:
                    # Update existing product
                    existing.name = row.get('اسم المنتج', existing.name)
                    existing.name_ar = row.get('اسم المنتج', '')
                    existing.description = row.get('وصف المنتج', existing.description)
                    existing.base_price = Decimal(str(base_price))
                    if discounted_price:
                        existing.discounted_price = Decimal(str(discounted_price))
                    existing.discount_percent = discount_percent
                    existing.available_sizes = row.get('المقاسات المتاحة', '')
                    existing.available_colors = row.get('الألوان المتاحة', '')
                    existing.category = row.get('الفئة', existing.category)
                    existing.quantity = int(row.get('الكمية المتاحة', 0))
                    existing.special_offers = row.get('العروض الخاصة', '')
                    existing.status = row.get('حالة المنتج', 'متاح')
                    existing.images = images_str
                    db.add(existing)
                    updated += 1
                else:
                    # Create new product
                    product = Product(
                        name=row.get('اسم المنتج', ''),
                        name_ar=row.get('اسم المنتج', ''),
                        model_code=model_code,
                        description=row.get('وصف المنتج', ''),
                        base_price=Decimal(str(base_price)),
                        discounted_price=Decimal(str(discounted_price)) if discounted_price else None,
                        discount_percent=discount_percent,
                        available_sizes=row.get('المقاسات المتاحة', ''),
                        available_colors=row.get('الألوان المتاحة', ''),
                        category=row.get('الفئة', ''),
                        brand="NOW SHOES",
                        quantity=int(row.get('الكمية المتاحة', 0)),
                        special_offers=row.get('العروض الخاصة', ''),
                        status=row.get('حالة المنتج', 'متاح'),
                        images=images_str
                    )
                    db.add(product)
                    imported += 1
            
            except Exception as e:
                errors.append({
                    'row': index + 2,
                    'model_code': str(row.get('كود الموديل', 'unknown')),
                    'error': str(e)
                })
        
        db.commit()
        
        return {
            'status': 'success',
            'imported': imported,
            'updated': updated,
            'total': imported + updated,
            'errors': errors,
            'message': f'✅ Successfully imported {imported} new products and updated {updated} existing ones'
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list")
async def list_products(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """
    عرض قائمة المنتجات
    List all products with optional filters
    """
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category.ilike(f'%{category}%'))
    
    if status:
        query = query.filter(Product.status == status)
    
    products = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        'total': total,
        'skip': skip,
        'limit': limit,
        'products': [
            {
                'id': p.id,
                'name': p.name,
                'model_code': p.model_code,
                'base_price': float(p.base_price),
                'discounted_price': float(p.discounted_price) if p.discounted_price else None,
                'discount_percent': p.discount_percent,
                'category': p.category,
                'quantity': p.quantity,
                'status': p.status
            }
            for p in products
        ]
    }


@router.get("/search")
async def search_products(
    q: str,
    db: Session = Depends(get_db)
):
    """
    البحث عن المنتجات
    Search products by name or model code
    """
    products = db.query(Product).filter(
        (Product.name.ilike(f'%{q}%')) | 
        (Product.model_code.ilike(f'%{q}%'))
    ).limit(50).all()
    
    return {
        'query': q,
        'count': len(products),
        'products': [
            {
                'id': p.id,
                'name': p.name,
                'model_code': p.model_code,
                'base_price': float(p.base_price),
                'discounted_price': float(p.discounted_price) if p.discounted_price else None,
                'category': p.category
            }
            for p in products
        ]
    }


@router.get("/stats")
async def get_products_stats(
    db: Session = Depends(get_db)
):
    """
    إحصائيات المنتجات
    Get products statistics
    """
    total = db.query(Product).count()
    available = db.query(Product).filter(Product.status == 'متاح').count()
    out_of_stock = db.query(Product).filter(Product.status == 'نفذ').count()
    coming_soon = db.query(Product).filter(Product.status == 'قريباً').count()
    
    return {
        'total_products': total,
        'available': available,
        'out_of_stock': out_of_stock,
        'coming_soon': coming_soon
    }


@router.get("/{product_id}")
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    تفاصيل المنتج
    Get product details
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    
    return {
        'id': product.id,
        'name': product.name,
        'name_ar': product.name_ar,
        'model_code': product.model_code,
        'description': product.description,
        'base_price': float(product.base_price),
        'discounted_price': float(product.discounted_price) if product.discounted_price else None,
        'discount_percent': product.discount_percent,
        'available_sizes': product.available_sizes,
        'available_colors': product.available_colors,
        'quantity': product.quantity,
        'category': product.category,
        'brand': product.brand,
        'special_offers': product.special_offers,
        'status': product.status,
        'images': product.images.split('\n') if product.images else [],
        'created_at': product.created_at,
        'updated_at': product.updated_at
    }
