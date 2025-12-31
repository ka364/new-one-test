/**
 * Board Meeting Router
 * tRPC endpoints for board meeting management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../routers';
import { getBoardMeetingManager } from './system';

const manager = getBoardMeetingManager();

// Validation schemas
const createMeetingSchema = z.object({
  factoryId: z.string(),
  factoryName: z.string(),
  title: z.string(),
  titleAr: z.string(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  scheduledStart: z.date().optional(),
  duration: z.number().optional(),
  hostName: z.string().optional(),
  hostNameAr: z.string().optional(),
  visibility: z.enum(['board_only', 'management', 'all_team']).optional(),
  category: z.enum(['strategic', 'operational', 'financial', 'emergency', 'other']).optional(),
  tags: z.array(z.string()).optional(),
});

const addAttendeeSchema = z.object({
  meetingId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userNameAr: z.string(),
  role: z.enum(['chairman', 'member', 'secretary', 'observer']),
});

const addAgendaItemSchema = z.object({
  meetingId: z.string(),
  title: z.string(),
  titleAr: z.string(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  duration: z.number().optional(),
  presenter: z.string().optional(),
  presenterAr: z.string().optional(),
});

const addDecisionSchema = z.object({
  meetingId: z.string(),
  agendaItemId: z.string(),
  description: z.string(),
  descriptionAr: z.string(),
  type: z.enum(['resolution', 'action_item', 'information']).optional(),
  assignedTo: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

const publishMeetingSchema = z.object({
  meetingId: z.string(),
  visibility: z.enum(['board_only', 'management', 'all_team']),
});

export const boardMeetingRouter = router({
  /**
   * Create a new board meeting
   */
  create: protectedProcedure
    .input(createMeetingSchema)
    .mutation(async ({ input, ctx }) => {
      const meeting = manager.createMeeting(
        input.factoryId,
        input.factoryName,
        input.title,
        input.titleAr,
        {
          description: input.description,
          descriptionAr: input.descriptionAr,
          scheduledStart: input.scheduledStart,
          duration: input.duration,
          hostName: input.hostName,
          hostNameAr: input.hostNameAr,
          visibility: input.visibility,
          category: input.category,
          tags: input.tags,
        }
      );

      return {
        success: true,
        meeting,
      };
    }),

  /**
   * Start a scheduled meeting
   */
  start: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ input }) => {
      manager.startMeeting(input.meetingId);
      return { success: true };
    }),

  /**
   * End a meeting
   */
  end: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ input }) => {
      manager.endMeeting(input.meetingId);
      return { success: true };
    }),

  /**
   * Publish meeting to team
   */
  publish: protectedProcedure
    .input(publishMeetingSchema)
    .mutation(async ({ input }) => {
      manager.publishMeeting(input.meetingId, input.visibility);
      return { success: true };
    }),

  /**
   * Unpublish meeting
   */
  unpublish: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ input }) => {
      manager.unpublishMeeting(input.meetingId);
      return { success: true };
    }),

  /**
   * Add attendee to meeting
   */
  addAttendee: protectedProcedure
    .input(addAttendeeSchema)
    .mutation(async ({ input }) => {
      manager.addAttendee(
        input.meetingId,
        input.userId,
        input.userName,
        input.userNameAr,
        input.role
      );
      return { success: true };
    }),

  /**
   * Mark attendee as present
   */
  markPresent: protectedProcedure
    .input(z.object({
      meetingId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      manager.markAttendeePresent(input.meetingId, input.userId);
      return { success: true };
    }),

  /**
   * Add agenda item
   */
  addAgendaItem: protectedProcedure
    .input(addAgendaItemSchema)
    .mutation(async ({ input }) => {
      const agendaItem = manager.addAgendaItem(
        input.meetingId,
        input.title,
        input.titleAr,
        {
          description: input.description,
          descriptionAr: input.descriptionAr,
          duration: input.duration,
          presenter: input.presenter,
          presenterAr: input.presenterAr,
        }
      );
      return {
        success: true,
        agendaItem,
      };
    }),

  /**
   * Update agenda item status
   */
  updateAgendaStatus: protectedProcedure
    .input(z.object({
      meetingId: z.string(),
      agendaItemId: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'deferred']),
    }))
    .mutation(async ({ input }) => {
      manager.updateAgendaItemStatus(
        input.meetingId,
        input.agendaItemId,
        input.status
      );
      return { success: true };
    }),

  /**
   * Add decision to agenda item
   */
  addDecision: protectedProcedure
    .input(addDecisionSchema)
    .mutation(async ({ input }) => {
      const decision = manager.addDecision(
        input.meetingId,
        input.agendaItemId,
        input.description,
        input.descriptionAr,
        {
          type: input.type,
          assignedTo: input.assignedTo,
          dueDate: input.dueDate,
          priority: input.priority,
        }
      );
      return {
        success: true,
        decision,
      };
    }),

  /**
   * Get meetings by factory
   */
  getByFactory: protectedProcedure
    .input(z.object({ factoryId: z.string() }))
    .query(async ({ input }) => {
      const meetings = manager.getMeetingsByFactory(input.factoryId);
      return { meetings };
    }),

  /**
   * Get published meetings (for team viewing)
   */
  getPublished: protectedProcedure
    .input(z.object({
      factoryId: z.string(),
      userRole: z.enum(['board', 'management', 'team']),
    }))
    .query(async ({ input }) => {
      const meetings = manager.getPublishedMeetings(
        input.factoryId,
        input.userRole
      );
      return { meetings };
    }),

  /**
   * Get meeting by ID
   */
  getById: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ input }) => {
      const meeting = manager.getMeeting(input.meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      return { meeting };
    }),

  /**
   * Get meeting messages
   */
  getMessages: protectedProcedure
    .input(z.object({
      meetingId: z.string(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const messages = manager.getMessages(input.meetingId, input.limit);
      return { messages };
    }),

  /**
   * Add message to meeting
   */
  addMessage: protectedProcedure
    .input(z.object({
      meetingId: z.string(),
      userId: z.string(),
      userName: z.string(),
      message: z.string(),
      type: z.enum(['chat', 'question', 'system', 'decision']),
    }))
    .mutation(async ({ input }) => {
      const message = manager.addMessage(input.meetingId, {
        userId: input.userId,
        userName: input.userName,
        message: input.message,
        type: input.type,
      });
      return {
        success: true,
        message,
      };
    }),

  /**
   * Get meeting analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ input }) => {
      const analytics = manager.getAnalytics(input.meetingId);
      return { analytics };
    }),

  /**
   * Generate meeting minutes
   */
  generateMinutes: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ input }) => {
      const minutesUrl = await manager.generateMeetingMinutes(input.meetingId);
      return {
        success: true,
        minutesUrl,
      };
    }),

  /**
   * Generate transcript
   */
  generateTranscript: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ input }) => {
      const transcriptUrl = await manager.generateTranscript(input.meetingId);
      return {
        success: true,
        transcriptUrl,
      };
    }),
});
