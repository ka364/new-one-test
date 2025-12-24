"""
KAIA Theology Engine - Data Models
Islamic Finance Compliance System
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text, Enum
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum as PyEnum
from typing import Dict, List, Optional

from backend.core.database import Base


class ProhibitedElement(PyEnum):
    """محرمات إسلامية في المعاملات المالية"""
    RIBA = "riba"  # الربا
    GHARAR = "gharar"  # الغرر
    MAYSIR = "maysir"  # الميسر (المقامرة)
    HARAM_ACTIVITY = "haram_activity"  # نشاط محرم


class ComplianceStatus(PyEnum):
    """حالة الامتثال الشرعي"""
    APPROVED = "approved"  # موافق شرعاً
    REJECTED = "rejected"  # مرفوض شرعاً
    PENDING = "pending"  # قيد المراجعة
    REVIEW_REQUIRED = "review_required"  # يحتاج مراجعة عالم


class ShariaRule(Base):
    """قاعدة شرعية"""
    __tablename__ = "sharia_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, nullable=False, index=True)
    rule_name_ar = Column(String(200), nullable=False)
    rule_name_en = Column(String(200), nullable=False)
    description_ar = Column(Text, nullable=False)
    description_en = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # muamalat, riba, gharar, etc.
    severity = Column(String(20), nullable=False)  # critical, high, medium, low
    prohibited_elements = Column(JSON, nullable=False)  # List of prohibited elements
    conditions = Column(JSON, nullable=False)  # Conditions for rule application
    references = Column(JSON, nullable=False)  # Quran, Hadith, Fatwa references
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Fatwa(Base):
    """فتوى شرعية"""
    __tablename__ = "fatwas"
    
    id = Column(Integer, primary_key=True, index=True)
    fatwa_code = Column(String(50), unique=True, nullable=False, index=True)
    title_ar = Column(String(300), nullable=False)
    title_en = Column(String(300), nullable=False)
    question_ar = Column(Text, nullable=False)
    question_en = Column(Text, nullable=False)
    answer_ar = Column(Text, nullable=False)
    answer_en = Column(Text, nullable=False)
    scholar_name = Column(String(200), nullable=False)
    organization = Column(String(200), nullable=True)  # دار الإفتاء، مجمع الفقه، etc.
    date_issued = Column(DateTime(timezone=True), nullable=False)
    category = Column(String(50), nullable=False)
    tags = Column(JSON, nullable=False)  # Keywords for search
    references = Column(JSON, nullable=False)  # Source references
    confidence_score = Column(Float, default=1.0)  # مدى الثقة في الفتوى
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TransactionValidation(Base):
    """سجل التحقق من المعاملات"""
    __tablename__ = "transaction_validations"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False)
    parties_involved = Column(JSON, nullable=False)
    contract_terms = Column(JSON, nullable=False)
    business_sector = Column(String(100), nullable=False)
    
    # Validation Results
    status = Column(Enum(ComplianceStatus), nullable=False, default=ComplianceStatus.PENDING)
    is_sharia_compliant = Column(Boolean, nullable=True)
    compliance_score = Column(Float, nullable=True)  # 0-100
    
    # Detected Issues
    detected_riba = Column(Boolean, default=False)
    detected_gharar = Column(Boolean, default=False)
    detected_maysir = Column(Boolean, default=False)
    detected_haram_activity = Column(Boolean, default=False)
    
    # Details
    violations = Column(JSON, nullable=True)  # List of violations
    warnings = Column(JSON, nullable=True)  # List of warnings
    recommendations = Column(JSON, nullable=True)  # Recommendations for compliance
    applied_rules = Column(JSON, nullable=True)  # Rules used in validation
    matched_fatwas = Column(JSON, nullable=True)  # Relevant fatwas
    
    # Review
    requires_scholar_review = Column(Boolean, default=False)
    scholar_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(200), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    validated_at = Column(DateTime(timezone=True), server_default=func.now())
    validation_duration_ms = Column(Integer, nullable=True)
    kaia_engine_version = Column(String(20), nullable=True)


class ScholarlyConsensus(Base):
    """إجماع العلماء"""
    __tablename__ = "scholarly_consensus"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_ar = Column(String(300), nullable=False)
    topic_en = Column(String(300), nullable=False)
    consensus_type = Column(String(50), nullable=False)  # ijma, ikhtilaf, etc.
    majority_opinion_ar = Column(Text, nullable=False)
    majority_opinion_en = Column(Text, nullable=False)
    minority_opinions = Column(JSON, nullable=True)
    supporting_scholars = Column(JSON, nullable=False)  # List of scholars
    organizations = Column(JSON, nullable=False)  # Supporting organizations
    strength = Column(String(20), nullable=False)  # strong, moderate, weak
    references = Column(JSON, nullable=False)
    is_contemporary = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RibaDetectionLog(Base):
    """سجل كشف الربا"""
    __tablename__ = "riba_detection_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), nullable=False, index=True)
    detection_type = Column(String(50), nullable=False)  # riba_fadl, riba_nasi'ah
    interest_rate = Column(Float, nullable=True)
    interest_amount = Column(Float, nullable=True)
    is_fixed_interest = Column(Boolean, default=False)
    is_variable_interest = Column(Boolean, default=False)
    payment_terms = Column(JSON, nullable=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    severity = Column(String(20), nullable=False)  # critical, high, medium
    details = Column(JSON, nullable=False)


class GhararAnalysisLog(Base):
    """سجل تحليل الغرر"""
    __tablename__ = "gharar_analysis_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), nullable=False, index=True)
    uncertainty_level = Column(Float, nullable=False)  # 0-100
    uncertainty_type = Column(String(50), nullable=False)  # excessive, moderate, minor
    unclear_terms = Column(JSON, nullable=True)
    missing_information = Column(JSON, nullable=True)
    risk_factors = Column(JSON, nullable=False)
    is_excessive_gharar = Column(Boolean, default=False)
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(JSON, nullable=False)
