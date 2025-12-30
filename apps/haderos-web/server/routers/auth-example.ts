/**
 * Auth Router Example - Using Validation Schemas
 * This demonstrates how to integrate Zod validation with tRPC
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { schemas } from '../_core/validation';
import { hashPassword, verifyPassword } from '../_core/security';
import { logger } from '../_core/logger';
import { TRPCError } from '@trpc/server';

export const authExampleRouter = router({
  /**
   * Login - with validation
   */
  login: publicProcedure
    .input(schemas.login) // ← Using Zod schema for validation
    .mutation(async ({ input, ctx }) => {
      logger.info('Login attempt', { email: input.email });

      try {
        // Input is already validated by Zod!
        // TypeScript knows: input.email, input.password, input.rememberMe

        // TODO: Replace with actual database query
        const user = await ctx.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, input.email),
        });

        if (!user) {
          logger.warn('Login failed: User not found', { email: input.email });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Verify password
        const isValidPassword = await verifyPassword(input.password, user.passwordHash);

        if (!isValidPassword) {
          logger.warn('Login failed: Invalid password', { email: input.email });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // TODO: Create session/JWT token

        logger.info('Login successful', { userId: user.id, email: user.email });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        logger.error('Login error', error as Error, { email: input.email });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during login',
        });
      }
    }),

  /**
   * Register - with validation
   */
  register: publicProcedure
    .input(schemas.register) // ← Zod validates: password strength, email format, etc.
    .mutation(async ({ input, ctx }) => {
      logger.info('Registration attempt', { email: input.email });

      try {
        // Check if user already exists
        const existingUser = await ctx.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, input.email),
        });

        if (existingUser) {
          logger.warn('Registration failed: Email already exists', { email: input.email });
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already registered',
          });
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // TODO: Create user in database
        const newUser = await ctx.db.insert(users).values({
          email: input.email,
          name: input.name,
          passwordHash,
          phone: input.phone,
          createdAt: new Date(),
        }).returning();

        logger.info('Registration successful', { userId: newUser[0].id, email: input.email });

        return {
          success: true,
          user: {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        logger.error('Registration error', error as Error, { email: input.email });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during registration',
        });
      }
    }),

  /**
   * Reset Password Request - with validation
   */
  resetPassword: publicProcedure
    .input(schemas.resetPassword)
    .mutation(async ({ input, ctx }) => {
      logger.info('Password reset requested', { email: input.email });

      try {
        const user = await ctx.db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, input.email),
        });

        // Don't reveal if email exists or not (security best practice)
        if (!user) {
          logger.warn('Password reset: User not found', { email: input.email });
          return {
            success: true,
            message: 'If the email exists, a reset link will be sent',
          };
        }

        // TODO: Generate reset token and send email
        // const resetToken = generateResetToken();
        // await sendPasswordResetEmail(user.email, resetToken);

        logger.info('Password reset email sent', { userId: user.id });

        return {
          success: true,
          message: 'If the email exists, a reset link will be sent',
        };
      } catch (error) {
        logger.error('Password reset error', error as Error, { email: input.email });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred',
        });
      }
    }),

  /**
   * Get Current User - protected route
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      // ctx.user is guaranteed to exist (enforced by protectedProcedure)
      logger.debug('Fetching current user', { userId: ctx.user.id });

      return {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
        role: ctx.user.role,
      };
    }),
});

// Export type for frontend
export type AuthExampleRouter = typeof authExampleRouter;
