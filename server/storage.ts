import {
  User, InsertUser, Team, InsertTeam, TeamRole, InsertTeamRole,
  TeamMember, InsertTeamMember, Event, InsertEvent, Schedule, InsertSchedule,
  ScheduleAssignment, InsertScheduleAssignment, AvailabilityRule, InsertAvailabilityRule,
  SwapRequest, InsertSwapRequest, Notification, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Team methods
  getTeam(id: number): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  getTeamsByLeaderId(leaderId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Team Role methods
  getTeamRole(id: number): Promise<TeamRole | undefined>;
  getTeamRoles(teamId: number): Promise<TeamRole[]>;
  createTeamRole(role: InsertTeamRole): Promise<TeamRole>;
  updateTeamRole(id: number, role: Partial<InsertTeamRole>): Promise<TeamRole | undefined>;
  deleteTeamRole(id: number): Promise<boolean>;

  // Team Member methods
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  getUserTeams(userId: number): Promise<TeamMember[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(userId: number, teamId: number, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  removeTeamMember(userId: number, teamId: number): Promise<boolean>;

  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(filters?: { startDate?: Date, endDate?: Date }): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Schedule methods
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedules(filters?: { teamId?: number, eventId?: number, status?: string }): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;

  // Schedule Assignment methods
  getScheduleAssignment(id: number): Promise<ScheduleAssignment | undefined>;
  getScheduleAssignments(scheduleId: number): Promise<ScheduleAssignment[]>;
  getUserAssignments(userId: number): Promise<ScheduleAssignment[]>;
  createScheduleAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment>;
  updateScheduleAssignment(id: number, assignment: Partial<InsertScheduleAssignment>): Promise<ScheduleAssignment | undefined>;
  deleteScheduleAssignment(id: number): Promise<boolean>;
  getScheduleAssignmentsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ScheduleAssignment[]>;

  // Availability Rule methods
  getAvailabilityRules(userId: number): Promise<AvailabilityRule[]>;
  createAvailabilityRule(rule: InsertAvailabilityRule): Promise<AvailabilityRule>;
  updateAvailabilityRule(id: number, rule: Partial<InsertAvailabilityRule>): Promise<AvailabilityRule | undefined>;
  deleteAvailabilityRule(id: number): Promise<boolean>;

  // Swap Request methods
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  getSwapRequests(filters?: { requesterId?: number, status?: string }): Promise<SwapRequest[]>;
  createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, request: Partial<InsertSwapRequest>): Promise<SwapRequest | undefined>;
  deleteSwapRequest(id: number): Promise<boolean>;

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Conflict detection methods
  detectScheduleConflicts(userId: number, date: Date, startTime: string, endTime: string): Promise<{
    hasConflict: boolean,
    conflictingAssignments: ScheduleAssignment[]
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private teamRoles: Map<number, TeamRole>;
  private teamMembers: Map<string, TeamMember>; // Key: userId-teamId
  private events: Map<number, Event>;
  private schedules: Map<number, Schedule>;
  private scheduleAssignments: Map<number, ScheduleAssignment>;
  private availabilityRules: Map<number, AvailabilityRule>;
  private swapRequests: Map<number, SwapRequest>;
  private notifications: Map<number, Notification>;

  private currentUserId: number;
  private currentTeamId: number;
  private currentTeamRoleId: number;
  private currentEventId: number;
  private currentScheduleId: number;
  private currentScheduleAssignmentId: number;
  private currentAvailabilityRuleId: number;
  private currentSwapRequestId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.teamRoles = new Map();
    this.teamMembers = new Map();
    this.events = new Map();
    this.schedules = new Map();
    this.scheduleAssignments = new Map();
    this.availabilityRules = new Map();
    this.swapRequests = new Map();
    this.notifications = new Map();

    this.currentUserId = 1;
    this.currentTeamId = 1;
    this.currentTeamRoleId = 1;
    this.currentEventId = 1;
    this.currentScheduleId = 1;
    this.currentScheduleAssignmentId = 1;
    this.currentAvailabilityRuleId = 1;
    this.currentSwapRequestId = 1;
    this.currentNotificationId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Sample users
    const user1: User = {
      id: this.currentUserId++,
      username: "carlos.silva",
      password: "hashed_password", // In real app, use proper password hashing
      name: "Carlos Silva",
      email: "carlos@example.com",
      phone: "11987654321",
      role: "leader",
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80"
    };
    this.users.set(user1.id, user1);

    // Sample teams
    const team1: Team = {
      id: this.currentTeamId++,
      name: "Equipe de Transmissão",
      description: "Responsável pela transmissão ao vivo dos cultos",
      leaderId: user1.id,
      color: "#3f51b5"
    };
    this.teams.set(team1.id, team1);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeamsByLeaderId(leaderId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.leaderId === leaderId
    );
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const existingTeam = this.teams.get(id);
    if (!existingTeam) return undefined;

    const updatedTeam = { ...existingTeam, ...team };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Team Role methods
  async getTeamRole(id: number): Promise<TeamRole | undefined> {
    return this.teamRoles.get(id);
  }

  async getTeamRoles(teamId: number): Promise<TeamRole[]> {
    return Array.from(this.teamRoles.values()).filter(
      (role) => role.teamId === teamId
    );
  }

  async createTeamRole(role: InsertTeamRole): Promise<TeamRole> {
    const id = this.currentTeamRoleId++;
    const newRole: TeamRole = { ...role, id };
    this.teamRoles.set(id, newRole);
    return newRole;
  }

  async updateTeamRole(id: number, role: Partial<InsertTeamRole>): Promise<TeamRole | undefined> {
    const existingRole = this.teamRoles.get(id);
    if (!existingRole) return undefined;

    const updatedRole = { ...existingRole, ...role };
    this.teamRoles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteTeamRole(id: number): Promise<boolean> {
    return this.teamRoles.delete(id);
  }

  // Team Member methods
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      (member) => member.teamId === teamId
    );
  }

  async getUserTeams(userId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      (member) => member.userId === userId
    );
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const key = `${member.userId}-${member.teamId}`;
    this.teamMembers.set(key, member);
    return member;
  }

  async updateTeamMember(userId: number, teamId: number, data: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const key = `${userId}-${teamId}`;
    const existingMember = this.teamMembers.get(key);
    if (!existingMember) return undefined;

    const updatedMember = { ...existingMember, ...data };
    this.teamMembers.set(key, updatedMember);
    return updatedMember;
  }

  async removeTeamMember(userId: number, teamId: number): Promise<boolean> {
    const key = `${userId}-${teamId}`;
    return this.teamMembers.delete(key);
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(filters?: { startDate?: Date, endDate?: Date }): Promise<Event[]> {
    let events = Array.from(this.events.values());
    
    if (filters) {
      if (filters.startDate) {
        events = events.filter(event => new Date(event.date) >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(event => new Date(event.date) <= filters.endDate!);
      }
    }
    
    return events;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const newEvent: Event = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;

    const updatedEvent = { ...existingEvent, ...event };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Schedule methods
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getSchedules(filters?: { teamId?: number, eventId?: number, status?: string }): Promise<Schedule[]> {
    let schedules = Array.from(this.schedules.values());
    
    if (filters) {
      if (filters.teamId) {
        schedules = schedules.filter(schedule => schedule.teamId === filters.teamId);
      }
      if (filters.eventId) {
        schedules = schedules.filter(schedule => schedule.eventId === filters.eventId);
      }
      if (filters.status) {
        schedules = schedules.filter(schedule => schedule.status === filters.status);
      }
    }
    
    return schedules;
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentScheduleId++;
    const now = new Date();
    const newSchedule: Schedule = { 
      ...schedule, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    this.schedules.set(id, newSchedule);
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const existingSchedule = this.schedules.get(id);
    if (!existingSchedule) return undefined;

    const updatedSchedule = { 
      ...existingSchedule, 
      ...schedule,
      updatedAt: new Date()
    };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }

  // Schedule Assignment methods
  async getScheduleAssignment(id: number): Promise<ScheduleAssignment | undefined> {
    return this.scheduleAssignments.get(id);
  }

  async getScheduleAssignments(scheduleId: number): Promise<ScheduleAssignment[]> {
    return Array.from(this.scheduleAssignments.values())
      .filter(assignment => assignment.scheduleId === scheduleId);
  }

  async getUserAssignments(userId: number): Promise<ScheduleAssignment[]> {
    return Array.from(this.scheduleAssignments.values())
      .filter(assignment => assignment.userId === userId || assignment.traineeId === userId);
  }

  async createScheduleAssignment(assignment: InsertScheduleAssignment): Promise<ScheduleAssignment> {
    const id = this.currentScheduleAssignmentId++;
    const newAssignment: ScheduleAssignment = { ...assignment, id };
    this.scheduleAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async updateScheduleAssignment(id: number, assignment: Partial<InsertScheduleAssignment>): Promise<ScheduleAssignment | undefined> {
    const existingAssignment = this.scheduleAssignments.get(id);
    if (!existingAssignment) return undefined;

    const updatedAssignment = { ...existingAssignment, ...assignment };
    this.scheduleAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteScheduleAssignment(id: number): Promise<boolean> {
    return this.scheduleAssignments.delete(id);
  }

  async getScheduleAssignmentsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ScheduleAssignment[]> {
    const userAssignments = await this.getUserAssignments(userId);
    const scheduleIds = [...new Set(userAssignments.map(a => a.scheduleId))];
    
    // Get all schedules for these assignments
    const relevantSchedules = await Promise.all(
      scheduleIds.map(id => this.getSchedule(id))
    );
    
    // Get events for these schedules to check date ranges
    const scheduleEvents = await Promise.all(
      relevantSchedules
        .filter(s => s !== undefined)
        .map(s => this.getEvent(s!.eventId))
    );
    
    // Filter assignments based on date range
    const filteredAssignments: ScheduleAssignment[] = [];
    
    for (const assignment of userAssignments) {
      const schedule = relevantSchedules.find(s => s?.id === assignment.scheduleId);
      if (!schedule) continue;
      
      const event = scheduleEvents.find(e => e?.id === schedule.eventId);
      if (!event) continue;
      
      const eventDate = new Date(event.date);
      if (eventDate >= startDate && eventDate <= endDate) {
        filteredAssignments.push(assignment);
      }
    }
    
    return filteredAssignments;
  }

  // Availability Rule methods
  async getAvailabilityRules(userId: number): Promise<AvailabilityRule[]> {
    return Array.from(this.availabilityRules.values())
      .filter(rule => rule.userId === userId);
  }

  async createAvailabilityRule(rule: InsertAvailabilityRule): Promise<AvailabilityRule> {
    const id = this.currentAvailabilityRuleId++;
    const newRule: AvailabilityRule = { ...rule, id };
    this.availabilityRules.set(id, newRule);
    return newRule;
  }

  async updateAvailabilityRule(id: number, rule: Partial<InsertAvailabilityRule>): Promise<AvailabilityRule | undefined> {
    const existingRule = this.availabilityRules.get(id);
    if (!existingRule) return undefined;

    const updatedRule = { ...existingRule, ...rule };
    this.availabilityRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteAvailabilityRule(id: number): Promise<boolean> {
    return this.availabilityRules.delete(id);
  }

  // Swap Request methods
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    return this.swapRequests.get(id);
  }

  async getSwapRequests(filters?: { requesterId?: number, status?: string }): Promise<SwapRequest[]> {
    let requests = Array.from(this.swapRequests.values());
    
    if (filters) {
      if (filters.requesterId) {
        requests = requests.filter(req => req.requesterId === filters.requesterId);
      }
      if (filters.status) {
        requests = requests.filter(req => req.status === filters.status);
      }
    }
    
    return requests;
  }

  async createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest> {
    const id = this.currentSwapRequestId++;
    const newRequest: SwapRequest = { 
      ...request, 
      id, 
      createdAt: new Date(),
      resolvedAt: undefined
    };
    this.swapRequests.set(id, newRequest);
    return newRequest;
  }

  async updateSwapRequest(id: number, request: Partial<InsertSwapRequest>): Promise<SwapRequest | undefined> {
    const existingRequest = this.swapRequests.get(id);
    if (!existingRequest) return undefined;

    const updatedRequest: SwapRequest = { 
      ...existingRequest, 
      ...request,
      resolvedAt: request.status === 'pending' ? undefined : new Date()
    };
    this.swapRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteSwapRequest(id: number): Promise<boolean> {
    return this.swapRequests.delete(id);
  }

  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return (await this.getNotifications(userId))
      .filter(notification => !notification.isRead);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const newNotification: Notification = { 
      ...notification, 
      id, 
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Conflict detection
  async detectScheduleConflicts(userId: number, date: Date, startTime: string, endTime: string): Promise<{
    hasConflict: boolean,
    conflictingAssignments: ScheduleAssignment[]
  }> {
    // Get all user assignments
    const userAssignments = await this.getUserAssignments(userId);
    
    // Get all relevant schedules and events
    const schedulePromises = userAssignments.map(a => this.getSchedule(a.scheduleId));
    const schedules = await Promise.all(schedulePromises);
    
    const eventIds = schedules
      .filter(s => s !== undefined)
      .map(s => s!.eventId);
    
    const eventPromises = eventIds.map(id => this.getEvent(id));
    const events = await Promise.all(eventPromises);
    
    // Find conflicts
    const conflictingAssignments: ScheduleAssignment[] = [];
    
    for (const assignment of userAssignments) {
      const schedule = schedules.find(s => s?.id === assignment.scheduleId);
      if (!schedule) continue;
      
      const event = events.find(e => e?.id === schedule.eventId);
      if (!event) continue;
      
      const eventDate = new Date(event.date);
      
      // Check if same date
      if (eventDate.toDateString() === date.toDateString()) {
        // Convert event times to minutes for comparison
        const eventStartTime = this.timeToMinutes(new Date(event.date).toTimeString().substring(0, 5));
        const eventEndTime = this.timeToMinutes(new Date(event.endTime).toTimeString().substring(0, 5));
        
        const requestStartTime = this.timeToMinutes(startTime);
        const requestEndTime = this.timeToMinutes(endTime);
        
        // Check for time overlap
        if (!(eventEndTime <= requestStartTime || eventStartTime >= requestEndTime)) {
          conflictingAssignments.push(assignment);
        }
      }
    }
    
    return {
      hasConflict: conflictingAssignments.length > 0,
      conflictingAssignments
    };
  }
  
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const storage = new MemStorage();
