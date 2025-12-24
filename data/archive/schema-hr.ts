import { mysqlTable, varchar, text, int, datetime, boolean, decimal } from 'drizzle-orm/mysql-core';

/**
 * Employees Table
 * Stores all employee information
 */
export const employees = mysqlTable('employees', {
  id: int('id').primaryKey().autoincrement(),
  
  // Personal Information (extracted from ID card)
  fullName: varchar('full_name', { length: 255 }).notNull(),
  nationalId: varchar('national_id', { length: 14 }).notNull().unique(),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  gender: varchar('gender', { length: 10 }), // 'male' or 'female'
  religion: varchar('religion', { length: 50 }),
  maritalStatus: varchar('marital_status', { length: 50 }),
  address: text('address'),
  governorate: varchar('governorate', { length: 100 }),
  
  // Contact Information
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  
  // Employment Information
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  hireDate: datetime('hire_date').notNull(),
  contractType: varchar('contract_type', { length: 50 }), // 'permanent', 'temporary', 'internship'
  
  // Account Status
  isActive: boolean('is_active').default(true),
  
  // Document Verification Status
  documentsVerified: boolean('documents_verified').default(false),
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending'), // 'pending', 'verified', 'rejected'
  verificationNotes: text('verification_notes'),
  
  // Metadata
  createdBy: int('created_by'), // User ID who created this employee
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at'),
});

/**
 * Employee Documents Table
 * Stores all uploaded documents for each employee
 */
export const employeeDocuments = mysqlTable('employee_documents', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  
  // Document Information
  documentType: varchar('document_type', { length: 100 }).notNull(), // 'national_id_front', 'national_id_back', 'military_certificate', 'personal_photo', 'birth_certificate', 'education_certificate', 'criminal_record', 'insurance_certificate'
  documentName: varchar('document_name', { length: 255 }).notNull(),
  
  // S3 Storage
  fileUrl: text('file_url').notNull(),
  fileKey: varchar('file_key', { length: 500 }).notNull(),
  fileSize: int('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Verification Status
  isVerified: boolean('is_verified').default(false),
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending'), // 'pending', 'verified', 'rejected', 'suspicious'
  verificationScore: decimal('verification_score', { precision: 5, scale: 2 }), // 0-100
  verificationNotes: text('verification_notes'),
  
  // Extracted Data (for ID cards)
  extractedData: text('extracted_data'), // JSON string of extracted data
  
  // Metadata
  uploadedBy: int('uploaded_by'), // User ID who uploaded
  uploadedAt: datetime('uploaded_at').notNull(),
  verifiedAt: datetime('verified_at'),
  verifiedBy: int('verified_by'), // User ID who verified
});

/**
 * Document Verification Logs Table
 * Audit trail for all verification operations
 */
export const documentVerificationLogs = mysqlTable('document_verification_logs', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  documentId: int('document_id'),
  
  // Verification Details
  verificationType: varchar('verification_type', { length: 100 }).notNull(), // 'ocr_extraction', 'authenticity_check', 'face_matching', 'manual_review'
  verificationResult: varchar('verification_result', { length: 50 }).notNull(), // 'pass', 'fail', 'warning'
  verificationScore: decimal('verification_score', { precision: 5, scale: 2 }),
  
  // Details
  details: text('details'), // JSON string with detailed results
  errorMessage: text('error_message'),
  
  // Metadata
  performedBy: int('performed_by'), // User ID or 'system'
  performedAt: datetime('performed_at').notNull(),
});

/**
 * Employee Account Credentials Table
 * Links employees to their monthly accounts
 */
export const employeeAccountLinks = mysqlTable('employee_account_links', {
  id: int('id').primaryKey().autoincrement(),
  employeeId: int('employee_id').notNull(),
  accountId: int('account_id').notNull(), // Links to monthly_employee_accounts
  
  // Metadata
  createdAt: datetime('created_at').notNull(),
});
