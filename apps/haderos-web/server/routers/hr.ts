import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import * as hrDb from '../db-hr';
import { otpDb } from '../db-otp';
import { storagePut } from '../storage';
import { invokeLLM } from '../_core/llm';

export const hrRouter = router({
  // Send OTP for employee verification
  sendOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        email: z.string().email().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limiting check
      const canRequest = await otpDb.canRequestOTP(input.phoneNumber);
      if (!canRequest) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'تم تجاوز الحد الأقصى لطلبات OTP. يرجى المحاولة بعد ساعة',
        });
      }

      // Generate OTP
      const otpCode = otpDb.generateOTP();

      // Determine method (email for <25, SMS for >=25)
      const method = await otpDb.getOTPMethod();

      // Set expiration (5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Get IP address from request
      const ipAddress = (ctx as any).req?.ip || (ctx as any).req?.socket?.remoteAddress;

      // Save OTP to database
      await otpDb.createOTP({
        phoneNumber: input.phoneNumber,
        email: input.email,
        otpCode,
        method,
        expiresAt,
        latitude: input.latitude,
        longitude: input.longitude,
        ipAddress,
      });

      // Send OTP (email or SMS)
      if (method === 'email' && input.email) {
        // TODO: Send email with OTP
        // For now, log OTP (DEVELOPMENT ONLY)
        console.log(`[OTP] Email to ${input.email}: ${otpCode}`);
      } else if (method === 'sms') {
        // TODO: Send SMS with OTP via Twilio
        console.log(`[OTP] SMS to ${input.phoneNumber}: ${otpCode}`);
      }

      return {
        success: true,
        method,
        expiresAt,
        // DEVELOPMENT ONLY - Remove in production
        otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      };
    }),

  // Verify OTP
  verifyOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        otpCode: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const result = await otpDb.verifyOTP(input.phoneNumber, input.otpCode);
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message,
        });
      }
      return result;
    }),

  // Get employee statistics
  stats: protectedProcedure.query(async () => {
    return await hrDb.getEmployeeStats();
  }),

  // Check if user can create more children
  canCreateChild: protectedProcedure
    .input(
      z.object({
        parentId: z.number(),
        parentRole: z.enum(['base_account', 'supervisor']),
      })
    )
    .query(async ({ input }: { input: any }) => {
      return await hrDb.canCreateChild(input.parentId, input.parentRole);
    }),

  // Get employee by ID
  getEmployee: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return await hrDb.getEmployeeById(input.id);
    }),

  // Get employees by parent ID
  getEmployeesByParent: protectedProcedure
    .input(z.object({ parentId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return await hrDb.getEmployeesByParentId(input.parentId);
    }),

  // Get all supervisors
  getAllSupervisors: protectedProcedure.query(async () => {
    return await hrDb.getAllSupervisors();
  }),

  // Get employees by supervisor
  getEmployeesBySupervisor: protectedProcedure
    .input(z.object({ supervisorId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return await hrDb.getEmployeesBySupervisor(input.supervisorId);
    }),

  // Create supervisor
  createSupervisor: protectedProcedure
    .input(
      z.object({
        fullName: z.string(),
        nationalId: z.string().length(14),
        phoneNumber: z.string(),
        email: z.string().email().optional(),
        jobTitle: z.string(),
        department: z.string(),
        salary: z.number().optional(),
        hireDate: z.string(),
        contractType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // Check if user can create more supervisors
      const canCreate = await hrDb.canCreateChild(ctx.user.id, 'base_account');
      if (!canCreate) {
        throw new Error('لقد وصلت للحد الأقصى من المشرفين (7 مشرفين)');
      }

      const employeeId = await hrDb.createEmployee({
        ...input,
        role: 'supervisor',
        parentId: ctx.user.id,
        hireDate: new Date(input.hireDate),
        createdBy: ctx.user.id,
      });

      return { success: true, employeeId };
    }),

  // Create employee
  createEmployee: protectedProcedure
    .input(
      z.object({
        fullName: z.string(),
        nationalId: z.string().length(14),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        religion: z.string().optional(),
        maritalStatus: z.string().optional(),
        address: z.string().optional(),
        governorate: z.string().optional(),
        phoneNumber: z.string(),
        email: z.string().email().optional(),
        jobTitle: z.string(),
        department: z.string(),
        salary: z.number().optional(),
        hireDate: z.string(),
        contractType: z.string().optional(),
        supervisorId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // Get supervisor info
      const supervisor = await hrDb.getEmployeeById(input.supervisorId);
      if (!supervisor || supervisor.role !== 'supervisor') {
        throw new Error('المشرف غير موجود');
      }

      // Check if supervisor can create more employees
      const canCreate = await hrDb.canCreateChild(input.supervisorId, 'supervisor');
      if (!canCreate) {
        throw new Error('المشرف وصل للحد الأقصى من الموظفين (7 موظفين)');
      }

      const employeeId = await hrDb.createEmployee({
        ...input,
        role: 'employee',
        parentId: input.supervisorId,
        hireDate: new Date(input.hireDate),
        createdBy: ctx.user.id,
      });

      return { success: true, employeeId };
    }),

  // Upload document
  uploadDocument: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        documentType: z.string(),
        documentName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // Decode base64
      const buffer = Buffer.from(input.fileData, 'base64');

      // Upload to S3
      const fileKey = `hr/employees/${input.employeeId}/${input.documentType}-${Date.now()}.${input.mimeType.split('/')[1]}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Save to database
      const documentId = await hrDb.uploadEmployeeDocument({
        employeeId: input.employeeId,
        documentType: input.documentType,
        documentName: input.documentName,
        fileUrl: url,
        fileKey,
        fileSize: buffer.length,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
        uploadedAt: new Date(),
      });

      return { success: true, documentId, fileUrl: url };
    }),

  // Extract data from Egyptian ID card using AI
  extractIdData: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      try {
        // Use LLM with vision to extract data from ID card
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content:
                'أنت خبير في استخراج البيانات من البطاقات الشخصية المصرية. استخرج جميع البيانات بدقة وأرجعها بصيغة JSON.',
            },
            {
              role: 'user',
              content: `استخرج البيانات من البطاقة: ${input.imageUrl}`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'egyptian_id_data',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  full_name: { type: 'string' },
                  national_id: { type: 'string' },
                  date_of_birth: { type: 'string' },
                  gender: { type: 'string' },
                  religion: { type: 'string' },
                  marital_status: { type: 'string' },
                  address: { type: 'string' },
                  governorate: { type: 'string' },
                },
                required: ['full_name', 'national_id'],
                additionalProperties: false,
              },
            },
          },
        });

        const content =
          typeof response.choices[0].message.content === 'string'
            ? response.choices[0].message.content
            : JSON.stringify(response.choices[0].message.content);
        const extractedData = JSON.parse(content || '{}');

        // Save extracted data
        await hrDb.updateDocumentExtractedData(input.documentId, extractedData);

        // Log verification
        await hrDb.logVerification(
          0, // Will be updated
          input.documentId,
          'ocr_extraction',
          'pass',
          95,
          extractedData,
          ctx.user.id
        );

        return { success: true, data: extractedData };
      } catch (error: any) {
        // Log failed verification
        await hrDb.logVerification(
          0,
          input.documentId,
          'ocr_extraction',
          'fail',
          0,
          { error: error.message },
          ctx.user.id
        );

        throw new Error('فشل استخراج البيانات من البطاقة');
      }
    }),

  // Get employee documents
  getEmployeeDocuments: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      return await hrDb.getEmployeeDocuments(input.employeeId);
    }),
});
