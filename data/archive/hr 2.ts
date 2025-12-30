import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as hrDb from "../db-hr";
import { otpDb } from "../db-otp";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

export const hrRouter = router({
  // Send OTP for employee verification
  sendOTP: publicProcedure
    .input(z.object({
      phoneNumber: z.string(),
      email: z.string().email().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Rate limiting check
      const canRequest = await otpDb.canRequestOTP(input.phoneNumber);
      if (!canRequest) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "تم تجاوز الحد الأقصى لطلبات OTP. يرجى المحاولة بعد ساعة",
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