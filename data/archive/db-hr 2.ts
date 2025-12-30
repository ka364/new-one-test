 * Get employee by ID
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  const db = await getDb();
  if (!db) return null;

  const result: any = await db.execute(
    sql`SELECT * FROM employees WHERE id = ${id}`
  );

  return result && result.length > 0 ? result[0] : null;
}

/**
 * Get employees by parent ID
 */
export async function getEmployeesByParentId(parentId: number): Promise<Employee[]> {
  const db = await getDb();
  if (!db) return [];

  const result: any = await db.execute(
    sql`SELECT * FROM employees WHERE parent_id = ${parentId} ORDER BY created_at DESC`
  );

  return result || [];
}

/**
 * Get all supervisors created by base accounts
 */