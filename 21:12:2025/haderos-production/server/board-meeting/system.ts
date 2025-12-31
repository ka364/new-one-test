/**
 * Board Meeting System
 * نظام اجتماعات مجلس الإدارة
 * 
 * This system enables factory management to conduct board meetings
 * with live streaming capabilities and automatic recording.
 * After the meeting ends, it can be published to the factory team.
 */

export interface BoardMeeting {
  id: string;
  factoryId: string;
  factoryName: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  status: 'scheduled' | 'live' | 'ended' | 'paused';
  streamUrl: string; // HLS or WebRTC stream URL
  thumbnailUrl: string;
  startTime: Date;
  endTime?: Date;
  scheduledDuration: number; // minutes
  viewerCount: number;
  peakViewers: number;
  hostName: string;
  hostNameAr: string;
  attendees: MeetingAttendee[];
  agenda: AgendaItem[];
  isRecorded: boolean;
  recordingUrl?: string;
  isPublished: boolean; // Whether the recording is published to the team
  publishedAt?: Date;
  visibility: 'board_only' | 'management' | 'all_team'; // Who can view
  transcriptUrl?: string; // AI-generated transcript
  minutesUrl?: string; // AI-generated meeting minutes
  tags: string[];
  category: 'strategic' | 'operational' | 'financial' | 'emergency' | 'other';
}

export interface MeetingAttendee {
  userId: string;
  userName: string;
  userNameAr: string;
  role: 'chairman' | 'member' | 'secretary' | 'observer';
  isPresent: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface AgendaItem {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  order: number;
  duration: number; // minutes
  presenter: string;
  presenterAr: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  startTime?: Date;
  endTime?: Date;
  decisions: Decision[];
  notes: string;
  notesAr: string;
}

export interface Decision {
  id: string;
  agendaItemId: string;
  description: string;
  descriptionAr: string;
  type: 'resolution' | 'action_item' | 'information';
  assignedTo?: string[];
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'question' | 'system' | 'decision';
  metadata?: Record<string, any>;
}

export interface MeetingAnalytics {
  meetingId: string;
  totalDuration: number; // minutes
  attendanceRate: number; // percentage
  agendaCompletionRate: number; // percentage
  decisionsCount: number;
  actionItemsCount: number;
  participationByAttendee: {
    userId: string;
    userName: string;
    messagesCount: number;
    speakingTime: number; // minutes (estimated)
  }[];
}

/**
 * Board Meeting Manager
 */
export class BoardMeetingManager {
  private meetings: Map<string, BoardMeeting> = new Map();
  private messages: Map<string, MeetingMessage[]> = new Map();
  private viewers: Map<string, Set<string>> = new Map(); // meetingId -> Set of userIds

  /**
   * Create a new board meeting
   */
  createMeeting(
    factoryId: string,
    factoryName: string,
    title: string,
    titleAr: string,
    options: {
      description?: string;
      descriptionAr?: string;
      scheduledStart?: Date;
      duration?: number;
      hostName?: string;
      hostNameAr?: string;
      attendees?: MeetingAttendee[];
      agenda?: AgendaItem[];
      visibility?: 'board_only' | 'management' | 'all_team';
      category?: 'strategic' | 'operational' | 'financial' | 'emergency' | 'other';
      tags?: string[];
    } = {}
  ): BoardMeeting {
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const meeting: BoardMeeting = {
      id: meetingId,
      factoryId,
      factoryName,
      title,
      titleAr,
      description: options.description || '',
      descriptionAr: options.descriptionAr || '',
      status: options.scheduledStart ? 'scheduled' : 'live',
      streamUrl: `https://stream.haderos.com/board/${meetingId}`, // Placeholder
      thumbnailUrl: `https://cdn.haderos.com/meetings/${meetingId}.jpg`,
      startTime: options.scheduledStart || new Date(),
      scheduledDuration: options.duration || 120,
      viewerCount: 0,
      peakViewers: 0,
      hostName: options.hostName || 'Chairman',
      hostNameAr: options.hostNameAr || 'رئيس مجلس الإدارة',
      attendees: options.attendees || [],
      agenda: options.agenda || [],
      isRecorded: true,
      isPublished: false,
      visibility: options.visibility || 'board_only',
      tags: options.tags || [],
      category: options.category || 'operational',
    };

    this.meetings.set(meetingId, meeting);
    this.messages.set(meetingId, []);
    this.viewers.set(meetingId, new Set());

    console.log(`📋 Created board meeting: ${title} (${meetingId})`);
    return meeting;
  }

  /**
   * Start a scheduled meeting
   */
  startMeeting(meetingId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    if (meeting.status !== 'scheduled') {
      throw new Error(`Meeting ${meetingId} is not scheduled`);
    }

    meeting.status = 'live';
    meeting.startTime = new Date();

    // Send system message
    this.addMessage(meetingId, {
      userId: 'system',
      userName: 'HADEROS',
      message: `بدأ اجتماع مجلس الإدارة: ${meeting.titleAr}`,
      type: 'system',
    });

    console.log(`▶️ Meeting started: ${meeting.title}`);
  }

  /**
   * End a board meeting
   */
  endMeeting(meetingId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    meeting.status = 'ended';
    meeting.endTime = new Date();

    // Generate recording URL (placeholder)
    meeting.recordingUrl = `https://cdn.haderos.com/recordings/${meetingId}.mp4`;

    // Send system message
    this.addMessage(meetingId, {
      userId: 'system',
      userName: 'HADEROS',
      message: `انتهى الاجتماع. تم حفظ التسجيل والمحضر.`,
      type: 'system',
    });

    console.log(`⏹️ Meeting ended: ${meeting.title}`);
  }

  /**
   * Publish meeting recording to team
   */
  publishMeeting(
    meetingId: string,
    visibility: 'board_only' | 'management' | 'all_team'
  ): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    if (meeting.status !== 'ended') {
      throw new Error(`Cannot publish meeting that hasn't ended`);
    }

    if (!meeting.recordingUrl) {
      throw new Error(`Meeting recording not available`);
    }

    meeting.isPublished = true;
    meeting.publishedAt = new Date();
    meeting.visibility = visibility;

    console.log(`📢 Meeting published: ${meeting.title} (Visibility: ${visibility})`);
  }

  /**
   * Unpublish meeting recording
   */
  unpublishMeeting(meetingId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    meeting.isPublished = false;
    meeting.visibility = 'board_only';

    console.log(`🔒 Meeting unpublished: ${meeting.title}`);
  }

  /**
   * Add an attendee to the meeting
   */
  addAttendee(
    meetingId: string,
    userId: string,
    userName: string,
    userNameAr: string,
    role: 'chairman' | 'member' | 'secretary' | 'observer'
  ): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const attendee: MeetingAttendee = {
      userId,
      userName,
      userNameAr,
      role,
      isPresent: false,
    };

    meeting.attendees.push(attendee);
  }

  /**
   * Mark attendee as present
   */
  markAttendeePresent(meetingId: string, userId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const attendee = meeting.attendees.find(a => a.userId === userId);
    if (!attendee) {
      throw new Error(`Attendee ${userId} not found in meeting`);
    }

    attendee.isPresent = true;
    attendee.joinedAt = new Date();

    // Add viewer
    this.addViewer(meetingId, userId);
  }

  /**
   * Add agenda item
   */
  addAgendaItem(
    meetingId: string,
    title: string,
    titleAr: string,
    options: {
      description?: string;
      descriptionAr?: string;
      duration?: number;
      presenter?: string;
      presenterAr?: string;
    } = {}
  ): AgendaItem {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const agendaItem: AgendaItem = {
      id: `agenda_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      titleAr,
      description: options.description || '',
      descriptionAr: options.descriptionAr || '',
      order: meeting.agenda.length + 1,
      duration: options.duration || 15,
      presenter: options.presenter || meeting.hostName,
      presenterAr: options.presenterAr || meeting.hostNameAr,
      status: 'pending',
      decisions: [],
      notes: '',
      notesAr: '',
    };

    meeting.agenda.push(agendaItem);
    return agendaItem;
  }

  /**
   * Update agenda item status
   */
  updateAgendaItemStatus(
    meetingId: string,
    agendaItemId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'deferred'
  ): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const agendaItem = meeting.agenda.find(item => item.id === agendaItemId);
    if (!agendaItem) {
      throw new Error(`Agenda item ${agendaItemId} not found`);
    }

    agendaItem.status = status;

    if (status === 'in_progress') {
      agendaItem.startTime = new Date();
    } else if (status === 'completed') {
      agendaItem.endTime = new Date();
    }
  }

  /**
   * Add decision to agenda item
   */
  addDecision(
    meetingId: string,
    agendaItemId: string,
    description: string,
    descriptionAr: string,
    options: {
      type?: 'resolution' | 'action_item' | 'information';
      assignedTo?: string[];
      dueDate?: Date;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Decision {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const agendaItem = meeting.agenda.find(item => item.id === agendaItemId);
    if (!agendaItem) {
      throw new Error(`Agenda item ${agendaItemId} not found`);
    }

    const decision: Decision = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agendaItemId,
      description,
      descriptionAr,
      type: options.type || 'resolution',
      assignedTo: options.assignedTo,
      dueDate: options.dueDate,
      priority: options.priority || 'medium',
      status: 'pending',
      timestamp: new Date(),
    };

    agendaItem.decisions.push(decision);

    // Send system message about the decision
    this.addMessage(meetingId, {
      userId: 'system',
      userName: 'HADEROS',
      message: `📝 قرار جديد: ${descriptionAr}`,
      type: 'decision',
      metadata: { decisionId: decision.id, agendaItemId },
    });

    return decision;
  }

  /**
   * Add a viewer to a meeting
   */
  addViewer(meetingId: string, userId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const viewers = this.viewers.get(meetingId);
    if (viewers) {
      viewers.add(userId);
      meeting.viewerCount = viewers.size;
      meeting.peakViewers = Math.max(meeting.peakViewers, meeting.viewerCount);
    }
  }

  /**
   * Remove a viewer from a meeting
   */
  removeViewer(meetingId: string, userId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return;

    const viewers = this.viewers.get(meetingId);
    if (viewers) {
      viewers.delete(userId);
      meeting.viewerCount = viewers.size;
    }
  }

  /**
   * Add a message to the meeting chat
   */
  addMessage(
    meetingId: string,
    message: Omit<MeetingMessage, 'id' | 'meetingId' | 'timestamp'>
  ): MeetingMessage {
    const messages = this.messages.get(meetingId);
    if (!messages) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const fullMessage: MeetingMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meetingId,
      timestamp: new Date(),
      ...message,
    };

    messages.push(fullMessage);
    return fullMessage;
  }

  /**
   * Get all meetings for a factory
   */
  getMeetingsByFactory(factoryId: string): BoardMeeting[] {
    return Array.from(this.meetings.values()).filter(
      meeting => meeting.factoryId === factoryId
    );
  }

  /**
   * Get published meetings that a user can view
   */
  getPublishedMeetings(
    factoryId: string,
    userRole: 'board' | 'management' | 'team'
  ): BoardMeeting[] {
    return Array.from(this.meetings.values()).filter(meeting => {
      if (meeting.factoryId !== factoryId) return false;
      if (!meeting.isPublished) return false;

      // Check visibility permissions
      if (meeting.visibility === 'all_team') return true;
      if (meeting.visibility === 'management' && (userRole === 'management' || userRole === 'board')) return true;
      if (meeting.visibility === 'board_only' && userRole === 'board') return true;

      return false;
    });
  }

  /**
   * Get meeting by ID
   */
  getMeeting(meetingId: string): BoardMeeting | undefined {
    return this.meetings.get(meetingId);
  }

  /**
   * Get messages for a meeting
   */
  getMessages(meetingId: string, limit?: number): MeetingMessage[] {
    const messages = this.messages.get(meetingId) || [];
    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Get analytics for a meeting
   */
  getAnalytics(meetingId: string): MeetingAnalytics {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const messages = this.messages.get(meetingId) || [];

    // Calculate total duration
    const totalDuration = meeting.endTime
      ? (meeting.endTime.getTime() - meeting.startTime.getTime()) / (1000 * 60)
      : 0;

    // Calculate attendance rate
    const presentCount = meeting.attendees.filter(a => a.isPresent).length;
    const attendanceRate = meeting.attendees.length > 0
      ? (presentCount / meeting.attendees.length) * 100
      : 0;

    // Calculate agenda completion rate
    const completedItems = meeting.agenda.filter(item => item.status === 'completed').length;
    const agendaCompletionRate = meeting.agenda.length > 0
      ? (completedItems / meeting.agenda.length) * 100
      : 0;

    // Count decisions and action items
    let decisionsCount = 0;
    let actionItemsCount = 0;
    for (const item of meeting.agenda) {
      decisionsCount += item.decisions.length;
      actionItemsCount += item.decisions.filter(d => d.type === 'action_item').length;
    }

    // Calculate participation by attendee
    const participationByAttendee = meeting.attendees.map(attendee => {
      const userMessages = messages.filter(m => m.userId === attendee.userId);
      return {
        userId: attendee.userId,
        userName: attendee.userName,
        messagesCount: userMessages.length,
        speakingTime: 0, // TODO: Implement speech time tracking
      };
    });

    return {
      meetingId,
      totalDuration,
      attendanceRate,
      agendaCompletionRate,
      decisionsCount,
      actionItemsCount,
      participationByAttendee,
    };
  }

  /**
   * Generate AI meeting minutes (placeholder)
   */
  async generateMeetingMinutes(meetingId: string): Promise<string> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // TODO: Integrate with AI service to generate meeting minutes
    // For now, return a placeholder URL
    const minutesUrl = `https://cdn.haderos.com/minutes/${meetingId}.pdf`;
    meeting.minutesUrl = minutesUrl;

    console.log(`📄 Generated meeting minutes: ${minutesUrl}`);
    return minutesUrl;
  }

  /**
   * Generate AI transcript (placeholder)
   */
  async generateTranscript(meetingId: string): Promise<string> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // TODO: Integrate with speech-to-text service
    // For now, return a placeholder URL
    const transcriptUrl = `https://cdn.haderos.com/transcripts/${meetingId}.txt`;
    meeting.transcriptUrl = transcriptUrl;

    console.log(`📝 Generated transcript: ${transcriptUrl}`);
    return transcriptUrl;
  }
}

// Singleton instance
let boardMeetingManager: BoardMeetingManager | null = null;

/**
 * Get the board meeting manager instance
 */
export function getBoardMeetingManager(): BoardMeetingManager {
  if (!boardMeetingManager) {
    boardMeetingManager = new BoardMeetingManager();
  }
  return boardMeetingManager;
}
