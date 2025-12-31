/**
 * Row-Level Security (RLS) Middleware
 * Automatically sets tenant context for database queries
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

/**
 * Set tenant context in PostgreSQL session
 */
export const setTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get tenant_id from authenticated user
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      // If no tenant context, skip (for public routes)
      return next();
    }

    // Set tenant context in PostgreSQL session
    await db.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId.toString()}, false)`
    );

    next();
  } catch (error) {
    console.error('Error setting tenant context:', error);
    next(error);
  }
};

/**
 * Bypass RLS for admin operations
 */
export const bypassRLS = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user has admin role
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    if (isAdmin) {
      // Enable RLS bypass for admin users
      await db.execute(
        sql`SELECT set_config('app.bypass_rls', 'true', false)`
      );
    }

    next();
  } catch (error) {
    console.error('Error bypassing RLS:', error);
    next(error);
  }
};

/**
 * Reset RLS context after request
 */
export const resetRLSContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Reset tenant context
    await db.execute(
      sql`SELECT set_config('app.current_tenant_id', '', false)`
    );

    // Reset bypass flag
    await db.execute(
      sql`SELECT set_config('app.bypass_rls', 'false', false)`
    );

    next();
  } catch (error) {
    console.error('Error resetting RLS context:', error);
    next(error);
  }
};
