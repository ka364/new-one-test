import { requireDb } from './db';
import { sql } from 'drizzle-orm';

export interface Employee {
  id?: number;
  fullName: string;
  nationalId: string;
  dateOfBirth?: string;
  gender?: string;
  religion?: string;
  maritalStatus?: string;
  address?: string;
  governorate?: string;
  phoneNumber: string;
  email?: string;
  jobTitle: string;
  department: string;
  salary?: number;
  hireDate: Date;
  contractType?: string;
  role: 'base_account' | 'supervisor' | 'employee';
  parentId?: number;
  childrenCount?: number;
  isActive?: boolean;
  documentsVerified?: boolean;
  verificationStatus?: string;
  verificationNotes?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeDocument {
  id?: number;
  employeeId: number;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileKey: string;
  fileSize?: number;
  mimeType?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  verificationScore?: number;
  verificationNotes?: string;
  extractedData?: string;
  uploadedBy?: number;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: number;
}

/**
 * Check if a user can create more children (supervisors or employees)
 */
export async function canCreateChild(parentId: number, parentRole: string): Promise<boolean> {
  const db = await requireDb();
  if (!db) return false;

  const MAX_SUPERVISORS = 7;
  const MAX_EMPLOYEES = 7;

  const result: any = await db.execute(
    sql`SELECT children_count FROM employees WHERE id = ${parentId}`
  );

  if (!result || result.length === 0) return false;

  const currentCount = result[0].children_count || 0;

  if (parentRole === 'base_account') {
    return currentCount < MAX_SUPERVISORS;
  } else if (parentRole === 'supervisor') {
    return currentCount < MAX_EMPLOYEES;
  }

  return false;
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  const db = await requireDb();
  if (!db) return null;

  const result: any = await db.execute(sql`SELECT * FROM employees WHERE id = ${id}`);

  return result && result.length > 0 ? result[0] : null;
}

/**
 * Get employees by parent ID
 */
export async function getEmployeesByParentId(parentId: number): Promise<Employee[]> {
  const db = await requireDb();
  if (!db) return [];

  const result: any = await db.execute(
    sql`SELECT * FROM employees WHERE parent_id = ${parentId} ORDER BY created_at DESC`
  );

  return result || [];
}

/**
 * Get all supervisors created by base accounts
 */
export async function getAllSupervisors(): Promise<Employee[]> {
  const db = await requireDb();
  if (!db) return [];

  const result: any = await db.execute(
    sql`SELECT * FROM employees WHERE role = 'supervisor' ORDER BY created_at DESC`
  );

  return result || [];
}

/**
 * Get all employees created by a supervisor
 */
export async function getEmployeesBySupervisor(supervisorId: number): Promise<Employee[]> {
  const db = await requireDb();
  if (!db) return [];

  const result: any = await db.execute(
    sql`SELECT * FROM employees WHERE parent_id = ${supervisorId} AND role = 'employee' ORDER BY created_at DESC`
  );

  return result || [];
}

/**
 * Create a new employee (supervisor or regular employee)
 */
export async function createEmployee(employee: Employee): Promise<number | null> {
  const db = await requireDb();
  if (!db) return null;

  // Check if parent can create more children
  if (employee.parentId && employee.createdBy) {
    const parent = await getEmployeeById(employee.createdBy);
    if (parent) {
      const canCreate = await canCreateChild(employee.createdBy, parent.role);
      if (!canCreate) {
        throw new Error(`Cannot create more ${employee.role}s. Limit reached.`);
      }
    }
  }

  const result: any = await db.execute(sql`
    INSERT INTO employees (
      full_name, national_id, date_of_birth, gender, religion, marital_status,
      address, governorate, phone_number, email, job_title, department,
      salary, hire_date, contract_type, role, parent_id, is_active,
      documents_verified, verification_status, created_by, created_at
    ) VALUES (
      ${employee.fullName}, ${employee.nationalId}, ${employee.dateOfBirth || null},
      ${employee.gender || null}, ${employee.religion || null}, ${employee.maritalStatus || null},
      ${employee.address || null}, ${employee.governorate || null}, ${employee.phoneNumber},
      ${employee.email || null}, ${employee.jobTitle}, ${employee.department},
      ${employee.salary || null}, ${employee.hireDate}, ${employee.contractType || null},
      ${employee.role}, ${employee.parentId || null}, ${employee.isActive !== false},
      ${employee.documentsVerified || false}, ${employee.verificationStatus || 'pending'},
      ${employee.createdBy || null}, NOW()
    )
  `);

  // Update parent's children count
  if (employee.parentId) {
    await db.execute(sql`
      UPDATE employees 
      SET children_count = children_count + 1 
      WHERE id = ${employee.parentId}
    `);
  }

  return result.insertId || null;
}

/**
 * Upload employee document
 */
export async function uploadEmployeeDocument(doc: EmployeeDocument): Promise<number | null> {
  const db = await requireDb();
  if (!db) return null;

  const result: any = await db.execute(sql`
    INSERT INTO employee_documents (
      employee_id, document_type, document_name, file_url, file_key,
      file_size, mime_type, is_verified, verification_status,
      uploaded_by, uploaded_at
    ) VALUES (
      ${doc.employeeId}, ${doc.documentType}, ${doc.documentName},
      ${doc.fileUrl}, ${doc.fileKey}, ${doc.fileSize || null},
      ${doc.mimeType || null}, ${doc.isVerified || false},
      ${doc.verificationStatus || 'pending'}, ${doc.uploadedBy || null}, NOW()
    )
  `);

  return result.insertId || null;
}

/**
 * Get documents for an employee
 */
export async function getEmployeeDocuments(employeeId: number): Promise<EmployeeDocument[]> {
  const db = await requireDb();
  if (!db) return [];

  const result: any = await db.execute(
    sql`SELECT * FROM employee_documents WHERE employee_id = ${employeeId} ORDER BY uploaded_at DESC`
  );

  return result || [];
}

/**
 * Update document extracted data
 */
export async function updateDocumentExtractedData(
  documentId: number,
  extractedData: any
): Promise<boolean> {
  const db = await requireDb();
  if (!db) return false;

  await db.execute(sql`
    UPDATE employee_documents 
    SET extracted_data = ${JSON.stringify(extractedData)}
    WHERE id = ${documentId}
  `);

  return true;
}

/**
 * Log verification attempt
 */
export async function logVerification(
  employeeId: number,
  documentId: number | null,
  verificationType: string,
  result: string,
  score: number | null,
  details: any,
  performedBy: number | null
): Promise<void> {
  const db = await requireDb();
  if (!db) return;

  await db.execute(sql`
    INSERT INTO document_verification_logs (
      employee_id, document_id, verification_type, verification_result,
      verification_score, details, performed_by, performed_at
    ) VALUES (
      ${employeeId}, ${documentId}, ${verificationType}, ${result},
      ${score}, ${JSON.stringify(details)}, ${performedBy}, NOW()
    )
  `);
}

/**
 * Get employee statistics
 */
export async function getEmployeeStats() {
  const db = await requireDb();
  if (!db) return null;

  const totalResult: any = await db.execute(
    sql`SELECT COUNT(*) as total FROM employees WHERE is_active = 1`
  );

  const supervisorsResult: any = await db.execute(
    sql`SELECT COUNT(*) as count FROM employees WHERE role = 'supervisor' AND is_active = 1`
  );

  const employeesResult: any = await db.execute(
    sql`SELECT COUNT(*) as count FROM employees WHERE role = 'employee' AND is_active = 1`
  );

  const verifiedResult: any = await db.execute(
    sql`SELECT COUNT(*) as count FROM employees WHERE documents_verified = 1 AND is_active = 1`
  );

  return {
    total: totalResult[0]?.total || 0,
    supervisors: supervisorsResult[0]?.count || 0,
    employees: employeesResult[0]?.count || 0,
    verified: verifiedResult[0]?.count || 0,
  };
}
