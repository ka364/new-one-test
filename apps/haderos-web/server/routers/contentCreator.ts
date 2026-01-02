import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getAllImageRequests,
  getImageRequestById,
  getImageRequestsByUser,
  getImageRequestsByStatus,
  createImageRequest,
  updateImageRequestStatus,
  addCompletedImages,
  rateImageRequest,
  getAllContentCalendar,
  getContentCalendarById,
  getContentCalendarByDateRange,
  getContentCalendarByUser,
  createContentCalendar,
  updateContentCalendarStatus,
  updateContentMetrics,
  getAllContentTemplates,
  getContentTemplateById,
  getContentTemplatesByCategory,
  createContentTemplate,
  incrementTemplateUsage,
  getAllTeamNotifications,
  getTeamNotificationsByUser,
  getUnreadNotifications,
  createTeamNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../db-content-creator";

export const contentCreatorRouter = router({
  // ============================================
  // PRODUCT IMAGE REQUESTS
  // ============================================
  
  imageRequests: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllImageRequests(input?.limit);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getImageRequestById(input.id);
      }),
    
    getByUser: protectedProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getImageRequestsByUser(input.userId, input.limit);
      }),
    
    getMyRequests: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getImageRequestsByUser(ctx.user.id, input?.limit);
      }),
    
    getByStatus: protectedProcedure
      .input(z.object({ status: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getImageRequestsByStatus(input.status, input.limit);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          productName: z.string(),
          productDescription: z.string().optional(),
          productSKU: z.string().optional(),
          imageType: z.enum([
            "product_photo",
            "lifestyle",
            "detail_shot",
            "360_view",
            "video",
            "infographic",
          ]),
          quantity: z.number().default(1),
          specifications: z.any().optional(),
          urgency: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
          deadline: z.date().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Generate request number
        const requestNumber = `IMG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        const result = await createImageRequest({
          ...input,
          requestNumber,
          requestedBy: ctx.user.id,
        });
        
        // Create notification for production team
        await createTeamNotification({
          fromUserId: ctx.user.id,
          toDepartment: "production",
          notificationType: "image_request",
          title: "New Image Request",
          titleAr: "طلب صور جديد",
          message: `New image request for ${input.productName}`,
          messageAr: `طلب صور جديد لـ ${input.productName}`,
          relatedEntityType: "product_image_request",
          relatedEntityId: result[0].insertId,
          priority: input.urgency,
          actionRequired: true,
        });
        
        return { success: true, requestId: result[0].insertId, requestNumber };
      }),
    
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string(),
          assignedTo: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateImageRequestStatus(input.id, input.status, input.assignedTo);
        return { success: true };
      }),
    
    addCompletedImages: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          images: z.array(
            z.object({
              url: z.string(),
              filename: z.string(),
              uploadedAt: z.string(),
              notes: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        await addCompletedImages(input.id, input.images);
        
        // Notify requester
        const request = await getImageRequestById(input.id);
        if (request) {
          await createTeamNotification({
            fromUserId: request.assignedTo || 1,
            toUserId: request.requestedBy,
            notificationType: "image_request",
            title: "Images Ready for Review",
            titleAr: "الصور جاهزة للمراجعة",
            message: `Your requested images for ${request.productName} are ready for review`,
            messageAr: `الصور المطلوبة لـ ${request.productName} جاهزة للمراجعة`,
            relatedEntityType: "product_image_request",
            relatedEntityId: input.id,
            priority: "high",
            actionRequired: true,
          });
        }
        
        return { success: true };
      }),
    
    rate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          rating: z.number().min(1).max(5),
          feedback: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await rateImageRequest(input.id, input.rating, input.feedback);
        return { success: true };
      }),
  }),
  
  // ============================================
  // CONTENT CALENDAR
  // ============================================
  
  contentCalendar: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllContentCalendar(input?.limit);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getContentCalendarById(input.id);
      }),
    
    getByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getContentCalendarByDateRange(input.startDate, input.endDate);
      }),
    
    getMyContent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getContentCalendarByUser(ctx.user.id, input?.limit);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          titleAr: z.string().optional(),
          description: z.string().optional(),
          contentType: z.enum([
            "social_post",
            "blog_article",
            "video",
            "infographic",
            "newsletter",
            "ad_campaign",
          ]),
          platform: z.string().optional(),
          scheduledDate: z.date(),
          content: z.string().optional(),
          hashtags: z.array(z.string()).optional(),
          mediaFiles: z
            .array(
              z.object({
                type: z.string(),
                url: z.string(),
                filename: z.string(),
              })
            )
            .optional(),
          relatedCampaignId: z.number().optional(),
          relatedProductId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createContentCalendar({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true, contentId: result[0].insertId };
      }),
    
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateContentCalendarStatus(input.id, input.status);
        return { success: true };
      }),
    
    updateMetrics: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          views: z.number().optional(),
          likes: z.number().optional(),
          comments: z.number().optional(),
          shares: z.number().optional(),
          clicks: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...metrics } = input;
        await updateContentMetrics(id, metrics);
        return { success: true };
      }),
  }),
  
  // ============================================
  // CONTENT TEMPLATES
  // ============================================
  
  templates: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllContentTemplates(input?.limit);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getContentTemplateById(input.id);
      }),
    
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await getContentTemplatesByCategory(input.category);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          templateName: z.string(),
          templateNameAr: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          contentType: z.enum([
            "social_post",
            "blog_article",
            "video_script",
            "email",
            "ad_copy",
          ]),
          templateContent: z.string(),
          placeholders: z
            .array(
              z.object({
                key: z.string(),
                label: z.string(),
                type: z.string(),
                required: z.boolean(),
              })
            )
            .optional(),
          isPublic: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createContentTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true, templateId: result[0].insertId };
      }),
    
    use: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementTemplateUsage(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================
  // TEAM NOTIFICATIONS
  // ============================================
  
  notifications: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAllTeamNotifications(input?.limit);
      }),
    
    getMy: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getTeamNotificationsByUser(ctx.user.id, input?.limit);
      }),
    
    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return await getUnreadNotifications(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),
});
