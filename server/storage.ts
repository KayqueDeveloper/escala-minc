import {
  User, Team, Role, TeamMember, Service, Event, Schedule,
  ScheduleDetail, AvailabilityRule, SwapRequest,
  InsertUser, InsertTeam, InsertRole, InsertTeamMember, InsertService,
  InsertEvent, InsertSchedule, InsertScheduleDetail, InsertAvailabilityRule,
  InsertSwapRequest
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  getTeamsByLeader(leaderId: number): Promise<Team[]>;

  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  getRolesByTeam(teamId: number): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMembersByTeam(teamId: number): Promise<TeamMember[]>;
  getTeamMembersByUser(userId: number): Promise<TeamMember[]>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, teamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;

  // Schedules
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]>;
  getSchedulesByTeam(teamId: number): Promise<Schedule[]>;
  getSchedulesByDateAndTeam(date: Date, teamId: number): Promise<Schedule[]>;

  // Schedule Details
  getScheduleDetails(): Promise<ScheduleDetail[]>;
  getScheduleDetail(id: number): Promise<ScheduleDetail | undefined>;
  getScheduleDetailsBySchedule(scheduleId: number): Promise<ScheduleDetail[]>;
  getScheduleDetailsByVolunteer(volunteerId: number): Promise<ScheduleDetail[]>;
  createScheduleDetail(scheduleDetail: InsertScheduleDetail): Promise<ScheduleDetail>;
  updateScheduleDetail(id: number, scheduleDetail: Partial<InsertScheduleDetail>): Promise<ScheduleDetail | undefined>;
  deleteScheduleDetail(id: number): Promise<boolean>;
  checkScheduleConflict(date: Date, volunteerId: number): Promise<ScheduleDetail | undefined>;

  // Availability Rules
  getAvailabilityRules(): Promise<AvailabilityRule[]>;
  getAvailabilityRule(id: number): Promise<AvailabilityRule | undefined>;
  getAvailabilityRulesByUser(userId: number): Promise<AvailabilityRule[]>;
  createAvailabilityRule(rule: InsertAvailabilityRule): Promise<AvailabilityRule>;
  updateAvailabilityRule(id: number, rule: Partial<InsertAvailabilityRule>): Promise<AvailabilityRule | undefined>;
  deleteAvailabilityRule(id: number): Promise<boolean>;
  checkAvailability(userId: number, date: Date, serviceId?: number): Promise<boolean>;

  // Swap Requests
  getSwapRequests(): Promise<SwapRequest[]>;
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  getSwapRequestsByRequester(requesterId: number): Promise<SwapRequest[]>;
  getSwapRequestsByReplacement(replacementId: number): Promise<SwapRequest[]>;
  getPendingSwapRequests(): Promise<SwapRequest[]>;
  createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, request: Partial<InsertSwapRequest>): Promise<SwapRequest | undefined>;
  deleteSwapRequest(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private roles: Map<number, Role>;
  private teamMembers: Map<number, TeamMember>;
  private services: Map<number, Service>;
  private events: Map<number, Event>;
  private schedules: Map<number, Schedule>;
  private scheduleDetails: Map<number, ScheduleDetail>;
  private availabilityRules: Map<number, AvailabilityRule>;
  private swapRequests: Map<number, SwapRequest>;

  private currentIds: {
    user: number;
    team: number;
    role: number;
    teamMember: number;
    service: number;
    event: number;
    schedule: number;
    scheduleDetail: number;
    availabilityRule: number;
    swapRequest: number;
  };

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.roles = new Map();
    this.teamMembers = new Map();
    this.services = new Map();
    this.events = new Map();
    this.schedules = new Map();
    this.scheduleDetails = new Map();
    this.availabilityRules = new Map();
    this.swapRequests = new Map();

    this.currentIds = {
      user: 1,
      team: 1,
      role: 1,
      teamMember: 1,
      service: 1,
      event: 1,
      schedule: 1,
      scheduleDetail: 1,
      availabilityRule: 1,
      swapRequest: 1
    };

    this.initData();
  }

  private initData() {
    // Create default services
    this.createService({
      name: "Culto das 9h",
      time: "9h",
      dayOfWeek: 0 // Sunday
    });
    this.createService({
      name: "Culto das 11h",
      time: "11h",
      dayOfWeek: 0 // Sunday
    });
    this.createService({
      name: "Culto das 18h",
      time: "18h",
      dayOfWeek: 0 // Sunday
    });

    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin",
      name: "Administrador",
      email: "admin@igreja.com",
      phone: "(00) 00000-0000",
      role: "admin",
      isAdmin: true
    });
    
    // Create demo leader
    this.createUser({
      username: "lider",
      password: "lider",
      name: "Carlos Silva",
      email: "carlos@igreja.com",
      phone: "(00) 00000-0000",
      role: "leader",
      isAdmin: false
    });

    // Create demo team
    const transmissionTeam = this.createTeam({
      name: "Transmissão",
      description: "Equipe de transmissão e produção",
      leaderId: 2 // Carlos Silva
    });

    // Create demo roles for the team
    this.createRole({
      name: "Coordenador",
      teamId: transmissionTeam.id
    });
    this.createRole({
      name: "VMix",
      teamId: transmissionTeam.id
    });
    this.createRole({
      name: "Freehand",
      teamId: transmissionTeam.id
    });
    this.createRole({
      name: "Corte",
      teamId: transmissionTeam.id
    });
    this.createRole({
      name: "Grua",
      teamId: transmissionTeam.id
    });
    this.createRole({
      name: "Fixa",
      teamId: transmissionTeam.id
    });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentIds.team++;
    const team: Team = { ...insertTeam, id };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;

    const updatedTeam = { ...team, ...teamData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }

  async getTeamsByLeader(leaderId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.leaderId === leaderId
    );
  }

  // Role methods
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRolesByTeam(teamId: number): Promise<Role[]> {
    return Array.from(this.roles.values()).filter(
      (role) => role.teamId === teamId
    );
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.currentIds.role++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const role = this.roles.get(id);
    if (!role) return undefined;

    const updatedRole = { ...role, ...roleData };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    return this.roles.delete(id);
  }

  // Team Members methods
  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }

  async getTeamMembersByTeam(teamId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      (member) => member.teamId === teamId
    );
  }

  async getTeamMembersByUser(userId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      (member) => member.userId === userId
    );
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const id = this.currentIds.teamMember++;
    const teamMember: TeamMember = { ...insertTeamMember, id };
    this.teamMembers.set(id, teamMember);
    return teamMember;
  }

  async updateTeamMember(
    id: number,
    teamMemberData: Partial<InsertTeamMember>
  ): Promise<TeamMember | undefined> {
    const teamMember = this.teamMembers.get(id);
    if (!teamMember) return undefined;

    const updatedTeamMember = { ...teamMember, ...teamMemberData };
    this.teamMembers.set(id, updatedTeamMember);
    return updatedTeamMember;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // Services methods
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentIds.service++;
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  async updateService(
    id: number,
    serviceData: Partial<InsertService>
  ): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;

    const updatedService = { ...service, ...serviceData };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Events methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentIds.event++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(
    id: number,
    eventData: Partial<InsertEvent>
  ): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      }
    );
  }

  // Schedules methods
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentIds.schedule++;
    const schedule: Schedule = { ...insertSchedule, id };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(
    id: number,
    scheduleData: Partial<InsertSchedule>
  ): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;

    const updatedSchedule = { ...schedule, ...scheduleData };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      }
    );
  }

  async getSchedulesByTeam(teamId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.teamId === teamId
    );
  }

  async getSchedulesByDateAndTeam(date: Date, teamId: number): Promise<Schedule[]> {
    // Format date to compare only year, month, and day
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    return Array.from(this.schedules.values()).filter(
      (schedule) => {
        const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
        return scheduleDate === formattedDate && schedule.teamId === teamId;
      }
    );
  }

  // Schedule Details methods
  async getScheduleDetails(): Promise<ScheduleDetail[]> {
    return Array.from(this.scheduleDetails.values());
  }

  async getScheduleDetail(id: number): Promise<ScheduleDetail | undefined> {
    return this.scheduleDetails.get(id);
  }

  async getScheduleDetailsBySchedule(scheduleId: number): Promise<ScheduleDetail[]> {
    return Array.from(this.scheduleDetails.values()).filter(
      (detail) => detail.scheduleId === scheduleId
    );
  }

  async getScheduleDetailsByVolunteer(volunteerId: number): Promise<ScheduleDetail[]> {
    return Array.from(this.scheduleDetails.values()).filter(
      (detail) => detail.volunteerId === volunteerId
    );
  }

  async createScheduleDetail(insertScheduleDetail: InsertScheduleDetail): Promise<ScheduleDetail> {
    const id = this.currentIds.scheduleDetail++;
    const scheduleDetail: ScheduleDetail = { ...insertScheduleDetail, id };
    this.scheduleDetails.set(id, scheduleDetail);
    return scheduleDetail;
  }

  async updateScheduleDetail(
    id: number,
    scheduleDetailData: Partial<InsertScheduleDetail>
  ): Promise<ScheduleDetail | undefined> {
    const scheduleDetail = this.scheduleDetails.get(id);
    if (!scheduleDetail) return undefined;

    const updatedScheduleDetail = { ...scheduleDetail, ...scheduleDetailData };
    this.scheduleDetails.set(id, updatedScheduleDetail);
    return updatedScheduleDetail;
  }

  async deleteScheduleDetail(id: number): Promise<boolean> {
    return this.scheduleDetails.delete(id);
  }

  async checkScheduleConflict(date: Date, volunteerId: number): Promise<ScheduleDetail | undefined> {
    // Format date to compare only year, month, and day
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // Get all schedules for the given date
    const schedules = Array.from(this.schedules.values()).filter(
      (schedule) => {
        const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
        return scheduleDate === formattedDate;
      }
    );
    
    // Get all schedule details for the found schedules
    const scheduleIds = schedules.map(schedule => schedule.id);
    
    // Find if the volunteer is already scheduled for any of these schedules
    for (const detail of Array.from(this.scheduleDetails.values())) {
      if (scheduleIds.includes(detail.scheduleId) && detail.volunteerId === volunteerId) {
        return detail;
      }
    }
    
    return undefined;
  }

  // Availability Rules methods
  async getAvailabilityRules(): Promise<AvailabilityRule[]> {
    return Array.from(this.availabilityRules.values());
  }

  async getAvailabilityRule(id: number): Promise<AvailabilityRule | undefined> {
    return this.availabilityRules.get(id);
  }

  async getAvailabilityRulesByUser(userId: number): Promise<AvailabilityRule[]> {
    return Array.from(this.availabilityRules.values()).filter(
      (rule) => rule.userId === userId
    );
  }

  async createAvailabilityRule(insertRule: InsertAvailabilityRule): Promise<AvailabilityRule> {
    const id = this.currentIds.availabilityRule++;
    const rule: AvailabilityRule = { ...insertRule, id };
    this.availabilityRules.set(id, rule);
    return rule;
  }

  async updateAvailabilityRule(
    id: number,
    ruleData: Partial<InsertAvailabilityRule>
  ): Promise<AvailabilityRule | undefined> {
    const rule = this.availabilityRules.get(id);
    if (!rule) return undefined;

    const updatedRule = { ...rule, ...ruleData };
    this.availabilityRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteAvailabilityRule(id: number): Promise<boolean> {
    return this.availabilityRules.delete(id);
  }

  async checkAvailability(userId: number, date: Date, serviceId?: number): Promise<boolean> {
    const rules = await this.getAvailabilityRulesByUser(userId);
    
    // Format date to compare only year, month, and day
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    // Check date-specific rules
    for (const rule of rules) {
      const ruleData = rule.rule as any;
      
      if (ruleData.type === 'date' && ruleData.date === formattedDate) {
        return ruleData.isAvailable;
      }
      
      // Check service-specific rules if serviceId is provided
      if (serviceId && ruleData.type === 'service' && ruleData.serviceId === serviceId) {
        return ruleData.isAvailable;
      }
    }
    
    // If no rules match, volunteer is available by default
    return true;
  }

  // Swap Requests methods
  async getSwapRequests(): Promise<SwapRequest[]> {
    return Array.from(this.swapRequests.values());
  }

  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    return this.swapRequests.get(id);
  }

  async getSwapRequestsByRequester(requesterId: number): Promise<SwapRequest[]> {
    return Array.from(this.swapRequests.values()).filter(
      (request) => request.requesterId === requesterId
    );
  }

  async getSwapRequestsByReplacement(replacementId: number): Promise<SwapRequest[]> {
    return Array.from(this.swapRequests.values()).filter(
      (request) => request.replacementId === replacementId
    );
  }

  async getPendingSwapRequests(): Promise<SwapRequest[]> {
    return Array.from(this.swapRequests.values()).filter(
      (request) => request.status === 'pending'
    );
  }

  async createSwapRequest(insertRequest: InsertSwapRequest): Promise<SwapRequest> {
    const id = this.currentIds.swapRequest++;
    const now = new Date();
    const request: SwapRequest = { 
      ...insertRequest, 
      id, 
      createdAt: now,
      resolvedAt: null 
    };
    this.swapRequests.set(id, request);
    return request;
  }

  async updateSwapRequest(
    id: number,
    requestData: Partial<InsertSwapRequest>
  ): Promise<SwapRequest | undefined> {
    const request = this.swapRequests.get(id);
    if (!request) return undefined;

    const now = new Date();
    let updatedRequest = { ...request, ...requestData };
    
    // If status is changing from pending, set the resolvedAt date
    if (request.status === 'pending' && 
        (requestData.status === 'approved' || requestData.status === 'rejected')) {
      updatedRequest.resolvedAt = now;
    }
    
    this.swapRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteSwapRequest(id: number): Promise<boolean> {
    return this.swapRequests.delete(id);
  }
}

export const storage = new MemStorage();
