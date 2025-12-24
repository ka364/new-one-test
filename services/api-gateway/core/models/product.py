"""
Product Models - ERP System (Now Shoes Integration)
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, DECIMAL
from datetime import datetime
from backend.core.database import Base


class Product(Base):
    """Product Model - Now Shoes Integration"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 📸 صور المنتج / Product Images
    images = Column(Text)  # Multiple Google Drive URLs (newline separated)
    
    # 📝 اسم المنتج / Product Name
    name = Column(String(255), index=True, nullable=False)
    name_ar = Column(String(255))  # Arabic name
    
    # 📄 وصف المنتج / Description
    description = Column(Text)  # Product features, materials, usage
    
    # 🏷️ كود الموديل / Model Code (SKU)
    model_code = Column(String(50), unique=True, index=True, nullable=False)
    
    # 💰 السعر الأساسي / Base Price (EGP)
    base_price = Column(DECIMAL(10, 2), nullable=False)
    
    # 💸 السعر بعد الخصم / Discounted Price (EGP)
    discounted_price = Column(DECIMAL(10, 2))
    
    # 📊 نسبة الخصم / Discount Percentage
    discount_percent = Column(Float, default=0)
    
    # 📏 المقاسات المتاحة / Available Sizes
    available_sizes = Column(Text)  # Comma-separated: "40, 41, 42, 43, 44, 45"
    
    # 🎨 الألوان المتاحة / Available Colors
    available_colors = Column(Text)  # Comma-separated: "أسود, بني, كحلي"
    
    # 📦 الكمية المتاحة / Stock Quantity
    quantity = Column(Integer, default=0)
    
    # 🏷️ الفئة / Category
    category = Column(String(100), index=True)
    
    # 🔱 العلامة التجارية / Brand
    brand = Column(String(100), index=True, default="NOW SHOES")
    
    # 🎁 العروض الخاصة / Special Offers
    special_offers = Column(Text)
    
    # ✅ حالة المنتج / Product Status
    status = Column(String(50), default="متاح")  # متاح, نفذ, قريباً
    
    # 📅 تاريخ الإضافة / Date Added
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProductCategory(Base):
    """Product Category Model"""
    __tablename__ = "product_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
