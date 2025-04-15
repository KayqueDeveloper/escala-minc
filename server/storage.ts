import { 
  users, 
  teams, 
  roles, 
  volunteers, 
  events, 
  schedules, 
  availabilityRules, 
  swapRequests, 
  notifications,
  type User, 
  type InsertUser,
  type Team,
  type InsertTeam,
  type Role,
  type InsertRole,
  type Volunteer,
  type InsertVolunteer,
  type Event,
  type InsertEvent,
  type Schedule,
  type InsertSchedule,
  type AvailabilityRule,
  type InsertAvailabilityRule,
  type SwapRequest,
  type InsertSwapRequest,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Team methods
  getTeam(id: number): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  getAllTeamsWithRoles(): Promise<any[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  
  // Role methods
  getRole(id: number): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  getRolesByTeam(teamId: number): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  
  // Volunteer methods
  getVolunteer(id: number): Promise<Volunteer | undefined>;
  getAllVolunteers(): Promise<Volunteer[]>;
  getAllVolunteersWithTeams(): Promise<any[]>;
  getVolunteersByTeam(teamId: number): Promise<Volunteer[]>;
  createVolunteer(volunteer: InsertVolunteer): Promise<Volunteer>;
  
  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<any[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Schedule methods
  getSchedule(id: number): Promise<Schedule | undefined>;
  getAllSchedules(): Promise<any[]>;
  getSchedulesByEvent(eventId: number): Promise<any[]>;
  getSchedulesByVolunteer(volunteerId: number): Promise<Schedule[]>;
  checkSchedulingConflict(eventId: number, volunteerId: number): Promise<boolean>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  createInitialSchedulesForEvent(eventId: number, teamId: number): Promise<void>;
  
  // Availability rule methods
  getAvailabilityRule(id: number): Promise<AvailabilityRule | undefined>;
  getAllAvailabilityRules(): Promise<AvailabilityRule[]>;
  getAvailabilityRulesByVolunteer(volunteerId: number): Promise<AvailabilityRule[]>;
  createAvailabilityRule(rule: InsertAvailabilityRule): Promise<AvailabilityRule>;
  
  // Swap request methods
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  getAllSwapRequests(): Promise<any[]>;
  createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest>;
  approveSwapRequest(id: number): Promise<SwapRequest>;
  rejectSwapRequest(id: number): Promise<SwapRequest>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getAllNotifications(): Promise<any[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  createSwapRequestNotification(userId: number, swapRequestId: number): Promise<Notification>;
  createSwapRequestNotificationForLeader(scheduleId: number, swapRequestId: number): Promise<Notification>;
  createConflictNotification(volunteerId: number, eventId: number): Promise<Notification>;
  
  // Conflict detection methods
  getAllConflicts(): Promise<any[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private roles: Map<number, Role>;
  private volunteers: Map<number, Volunteer>;
  private events: Map<number, Event>;
  private schedules: Map<number, Schedule>;
  private availabilityRules: Map<number, AvailabilityRule>;
  private swapRequests: Map<number, SwapRequest>;
  private notifications: Map<number, Notification>;
  
  currentUserId: number;
  currentTeamId: number;
  currentRoleId: number;
  currentVolunteerId: number;
  currentEventId: number;
  currentScheduleId: number;
  currentRuleId: number;
  currentSwapRequestId: number;
  currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.roles = new Map();
    this.volunteers = new Map();
    this.events = new Map();
    this.schedules = new Map();
    this.availabilityRules = new Map();
    this.swapRequests = new Map();
    this.notifications = new Map();
    
    this.currentUserId = 1;
    this.currentTeamId = 1;
    this.currentRoleId = 1;
    this.currentVolunteerId = 1;
    this.currentEventId = 1;
    this.currentScheduleId = 1;
    this.currentRuleId = 1;
    this.currentSwapRequestId = 1;
    this.currentNotificationId = 1;
    
    // Initialize sample data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@igreja.org",
      role: "admin",
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create leader user
    const leaderUser: User = {
      id: this.currentUserId++,
      username: "lider",
      password: "lider123",
      name: "Líder Silva",
      email: "lider.silva@igreja.org",
      role: "leader",
      createdAt: new Date()
    };
    this.users.set(leaderUser.id, leaderUser);
    
    // Create some teams
    const transmissionTeam: Team = {
      id: this.currentTeamId++,
      name: "Transmissão",
      description: "Equipe responsável pela transmissão online dos cultos",
      leaderId: leaderUser.id
    };
    this.teams.set(transmissionTeam.id, transmissionTeam);
    
    const kidsTeam: Team = {
      id: this.currentTeamId++,
      name: "Kids",
      description: "Equipe responsável pelo ministério infantil",
      leaderId: leaderUser.id
    };
    this.teams.set(kidsTeam.id, kidsTeam);
    
    const worshipTeam: Team = {
      id: this.currentTeamId++,
      name: "Louvor",
      description: "Equipe responsável pela adoração e louvor nos cultos",
      leaderId: leaderUser.id
    };
    this.teams.set(worshipTeam.id, worshipTeam);
    
    // Create roles for each team
    // Transmissão roles
    const roles = [
      { name: "Coordenador", teamId: transmissionTeam.id, description: "Coordena a equipe de transmissão" },
      { name: "Operador de Câmera", teamId: transmissionTeam.id, description: "Responsável pelas câmeras" },
      { name: "Diretor", teamId: transmissionTeam.id, description: "Dirige a transmissão" },
      { name: "Operador de Vmix", teamId: transmissionTeam.id, description: "Opera o software Vmix" },
      
      { name: "Líder de Sala", teamId: kidsTeam.id, description: "Lidera uma sala do ministério infantil" },
      { name: "Ajudante", teamId: kidsTeam.id, description: "Auxilia o líder de sala" },
      { name: "Coordenador Kids", teamId: kidsTeam.id, description: "Coordena toda a equipe Kids" },
      
      { name: "Baterista", teamId: worshipTeam.id, description: "Toca bateria" },
      { name: "Guitarrista", teamId: worshipTeam.id, description: "Toca guitarra" },
      { name: "Vocalista", teamId: worshipTeam.id, description: "Canta" },
      { name: "Tecladista", teamId: worshipTeam.id, description: "Toca teclado" },
      { name: "Baixista", teamId: worshipTeam.id, description: "Toca baixo" },
    ];
    
    for (const roleData of roles) {
      const role: Role = {
        id: this.currentRoleId++,
        ...roleData
      };
      this.roles.set(role.id, role);
    }
    
    // Create some upcoming services
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    
    const service9AM = new Date(nextSunday);
    service9AM.setHours(9, 0, 0, 0);
    
    const service11AM = new Date(nextSunday);
    service11AM.setHours(11, 0, 0, 0);
    
    const service6PM = new Date(nextSunday);
    service6PM.setHours(18, 0, 0, 0);
    
    const upcomingServices = [
      {
        title: "Culto de Celebração",
        description: "Culto dominical",
        location: "Auditório Principal",
        eventDate: service9AM,
        eventType: "regular_service",
        recurrent: true
      },
      {
        title: "Culto de Celebração",
        description: "Culto dominical",
        location: "Auditório Principal",
        eventDate: service11AM,
        eventType: "regular_service",
        recurrent: true
      },
      {
        title: "Culto de Celebração",
        description: "Culto dominical",
        location: "Auditório Principal",
        eventDate: service6PM,
        eventType: "regular_service",
        recurrent: true
      }
    ];
    
    for (const serviceData of upcomingServices) {
      const event: Event = {
        id: this.currentEventId++,
        ...serviceData,
        createdAt: new Date()
      };
      this.events.set(event.id, event);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }
  
  async getAllTeamsWithRoles(): Promise<any[]> {
    const teams = Array.from(this.teams.values());
    
    return teams.map(team => {
      const roles = Array.from(this.roles.values())
        .filter(role => role.teamId === team.id)
        .map(role => {
          // Count volunteers with this role
          const volunteerCount = Array.from(this.volunteers.values())
            .filter(v => v.roleId === role.id)
            .length;
            
          return {
            ...role,
            volunteerCount
          };
        });
      
      // Count volunteers in this team
      const volunteerCount = Array.from(this.volunteers.values())
        .filter(volunteer => volunteer.teamId === team.id)
        .length;
      
      // Get team leader if exists
      let leader = undefined;
      if (team.leaderId) {
        const leaderUser = this.users.get(team.leaderId);
        if (leaderUser) {
          leader = {
            id: leaderUser.id,
            name: leaderUser.name,
            avatarUrl: undefined
          };
        }
      }
      
      return {
        ...team,
        roles,
        volunteerCount,
        leader
      };
    });
  }
  
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentTeamId++;
    const team: Team = { ...insertTeam, id };
    this.teams.set(id, team);
    return team;
  }
  
  // Role methods
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }
  
  async getRolesByTeam(teamId: number): Promise<Role[]> {
    return Array.from(this.roles.values()).filter(role => role.teamId === teamId);
  }
  
  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.currentRoleId++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }
  
  // Volunteer methods
  async getVolunteer(id: number): Promise<Volunteer | undefined> {
    return this.volunteers.get(id);
  }
  
  async getAllVolunteers(): Promise<Volunteer[]> {
    return Array.from(this.volunteers.values());
  }
  
  async getAllVolunteersWithTeams(): Promise<any[]> {
    const volunteers = Array.from(this.volunteers.values());
    const result = [];
    
    for (const volunteer of volunteers) {
      const user = this.users.get(volunteer.userId);
      if (!user) continue;
      
      const team = this.teams.get(volunteer.teamId);
      const role = this.roles.get(volunteer.roleId);
      
      if (!team || !role) continue;
      
      // Check if this volunteer is already in the result
      const existingIndex = result.findIndex(v => v.userId === volunteer.userId);
      
      if (existingIndex >= 0) {
        // Add this team to the existing volunteer
        result[existingIndex].teams.push({
          id: team.id,
          name: team.name,
          role: role.name,
          roleId: role.id
        });
      } else {
        // Create a new volunteer entry
        result.push({
          id: volunteer.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: undefined,
          isTrainee: volunteer.isTrainee,
          hasConflicts: false, // This would be calculated based on schedules
          teams: [{
            id: team.id,
            name: team.name,
            role: role.name,
            roleId: role.id
          }]
        });
      }
    }
    
    return result;
  }
  
  async getVolunteersByTeam(teamId: number): Promise<Volunteer[]> {
    return Array.from(this.volunteers.values()).filter(volunteer => volunteer.teamId === teamId);
  }
  
  async createVolunteer(insertVolunteer: InsertVolunteer): Promise<Volunteer> {
    const id = this.currentVolunteerId++;
    const volunteer: Volunteer = { ...insertVolunteer, id };
    this.volunteers.set(id, volunteer);
    return volunteer;
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getUpcomingEvents(): Promise<any[]> {
    const now = new Date();
    const upcomingEvents = Array.from(this.events.values())
      .filter(event => new Date(event.eventDate) > now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5); // Limit to 5 upcoming events
    
    // Transform events to include volunteer info and team count
    return upcomingEvents.map(event => {
      // Get schedules for this event
      const eventSchedules = Array.from(this.schedules.values())
        .filter(schedule => schedule.eventId === event.id);
      
      // Get unique teams involved in this event
      const teamIds = new Set(eventSchedules.map(schedule => {
        const volunteer = this.volunteers.get(schedule.volunteerId);
        return volunteer?.teamId;
      }).filter(id => id !== undefined));
      
      // Get volunteers assigned to this event
      const volunteers = eventSchedules.map(schedule => {
        const volunteer = this.volunteers.get(schedule.volunteerId);
        if (!volunteer) return null;
        
        const user = this.users.get(volunteer.userId);
        if (!user) return null;
        
        return {
          id: volunteer.id,
          name: user.name,
          avatarUrl: undefined
        };
      }).filter(v => v !== null) as Array<{ id: number, name: string, avatarUrl?: string }>;
      
      // Determine status based on volunteer count and conflicts
      let status = 'complete';
      if (volunteers.length < 5) {
        status = 'incomplete';
      } else if (volunteers.length < 10) {
        status = 'warning';
      }
      
      return {
        ...event,
        teamCount: teamIds.size,
        volunteers,
        status
      };
    });
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = { ...insertEvent, id, createdAt: new Date() };
    this.events.set(id, event);
    return event;
  }
  
  // Schedule methods
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }
  
  async getAllSchedules(): Promise<any[]> {
    const schedules = Array.from(this.schedules.values());
    const result = [];
    
    // Group schedules by event
    const eventGroups = new Map<number, Schedule[]>();
    for (const schedule of schedules) {
      const eventId = schedule.eventId;
      if (!eventGroups.has(eventId)) {
        eventGroups.set(eventId, []);
      }
      eventGroups.get(eventId)?.push(schedule);
    }
    
    // Transform event groups into schedule summaries
    for (const [eventId, eventSchedules] of eventGroups.entries()) {
      const event = this.events.get(eventId);
      if (!event) continue;
      
      // Get volunteers for this event
      const volunteerData = eventSchedules.map(schedule => {
        const volunteer = this.volunteers.get(schedule.volunteerId);
        if (!volunteer) return null;
        
        const user = this.users.get(volunteer.userId);
        if (!user) return null;
        
        return {
          id: volunteer.id,
          name: user.name,
          avatarUrl: undefined
        };
      }).filter(v => v !== null) as Array<{ id: number, name: string, avatarUrl?: string }>;
      
      // Count unique teams
      const teamIds = new Set(eventSchedules.map(schedule => {
        const volunteer = this.volunteers.get(schedule.volunteerId);
        return volunteer?.teamId;
      }).filter(id => id !== undefined));
      
      // Check for conflicts
      const hasConflicts = this.hasVolunteerConflictsInEvent(eventId);
      
      // Determine status based on volunteer count and conflicts
      let status = 'complete';
      if (volunteerData.length < 5) {
        status = 'incomplete';
      } else if (volunteerData.length < 10 || hasConflicts) {
        status = 'warning';
      }
      
      result.push({
        id: eventId, // Using event ID as schedule ID for simplicity
        eventId,
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        teamCount: teamIds.size,
        volunteers: volunteerData,
        status,
        hasConflicts
      });
    }
    
    // Sort by date
    result.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    return result;
  }
  
  private hasVolunteerConflictsInEvent(eventId: number): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;
    
    const eventDate = new Date(event.eventDate);
    const schedules = Array.from(this.schedules.values())
      .filter(schedule => {
        const scheduleEvent = this.events.get(schedule.eventId);
        if (!scheduleEvent) return false;
        
        const scheduleDate = new Date(scheduleEvent.eventDate);
        return scheduleDate.getTime() === eventDate.getTime();
      });
    
    // Check if any volunteer is scheduled multiple times for the same date/time
    const volunteerCounts = new Map<number, number>();
    for (const schedule of schedules) {
      const count = volunteerCounts.get(schedule.volunteerId) || 0;
      volunteerCounts.set(schedule.volunteerId, count + 1);
    }
    
    // If any volunteer has more than one schedule at this time, there's a conflict
    return Array.from(volunteerCounts.values()).some(count => count > 1);
  }
  
  async getSchedulesByEvent(eventId: number): Promise<any[]> {
    const schedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.eventId === eventId);
    
    // Group schedules by team
    const teamGroups = new Map<number, Schedule[]>();
    for (const schedule of schedules) {
      const volunteer = this.volunteers.get(schedule.volunteerId);
      if (!volunteer) continue;
      
      const teamId = volunteer.teamId;
      if (!teamGroups.has(teamId)) {
        teamGroups.set(teamId, []);
      }
      teamGroups.get(teamId)?.push(schedule);
    }
    
    const result = [];
    for (const [teamId, teamSchedules] of teamGroups.entries()) {
      const team = this.teams.get(teamId);
      if (!team) continue;
      
      // Get volunteers for this team
      const volunteers = teamSchedules.map(schedule => {
        const volunteer = this.volunteers.get(schedule.volunteerId);
        if (!volunteer) return null;
        
        const user = this.users.get(volunteer.userId);
        if (!user) return null;
        
        const role = this.roles.get(volunteer.roleId);
        
        return {
          id: volunteer.id,
          name: user.name,
          avatarUrl: undefined,
          role: role?.name || "Unknown role",
          isTrainee: volunteer.isTrainee
        };
      }).filter(v => v !== null) as Array<any>;
      
      result.push({
        teamId,
        teamName: team.name,
        volunteers
      });
    }
    
    return result;
  }
  
  async getSchedulesByVolunteer(volunteerId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.volunteerId === volunteerId);
  }
  
  async checkSchedulingConflict(eventId: number, volunteerId: number): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event) return false;
    
    const eventDate = new Date(event.eventDate);
    
    // Get all schedules for this volunteer
    const volunteerSchedules = await this.getSchedulesByVolunteer(volunteerId);
    
    // Check if any existing schedule conflicts with the new one
    for (const schedule of volunteerSchedules) {
      const scheduleEvent = this.events.get(schedule.eventId);
      if (!scheduleEvent) continue;
      
      const scheduleDate = new Date(scheduleEvent.eventDate);
      
      // If dates match (same day and time), there's a conflict
      if (scheduleDate.getTime() === eventDate.getTime()) {
        return true;
      }
    }
    
    return false;
  }
  
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentScheduleId++;
    const schedule: Schedule = { ...insertSchedule, id, createdAt: new Date() };
    this.schedules.set(id, schedule);
    return schedule;
  }
  
  async createInitialSchedulesForEvent(eventId: number, teamId: number): Promise<void> {
    // This would create empty schedule slots for each role in the team
    // In a real application, this would be more sophisticated
    const roles = await this.getRolesByTeam(teamId);
    
    // Just create a placeholder for now
    await this.createSchedule({
      eventId,
      volunteerId: 0, // Placeholder - no volunteer assigned yet
      status: "pending",
      createdById: 1, // Admin user
    });
  }
  
  // Availability rule methods
  async getAvailabilityRule(id: number): Promise<AvailabilityRule | undefined> {
    return this.availabilityRules.get(id);
  }
  
  async getAllAvailabilityRules(): Promise<AvailabilityRule[]> {
    return Array.from(this.availabilityRules.values());
  }
  
  async getAvailabilityRulesByVolunteer(volunteerId: number): Promise<AvailabilityRule[]> {
    return Array.from(this.availabilityRules.values())
      .filter(rule => rule.volunteerId === volunteerId);
  }
  
  async createAvailabilityRule(insertRule: InsertAvailabilityRule): Promise<AvailabilityRule> {
    const id = this.currentRuleId++;
    const rule: AvailabilityRule = { ...insertRule, id };
    this.availabilityRules.set(id, rule);
    return rule;
  }
  
  // Swap request methods
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    return this.swapRequests.get(id);
  }
  
  async getAllSwapRequests(): Promise<any[]> {
    const swapRequests = Array.from(this.swapRequests.values());
    const result = [];
    
    for (const request of swapRequests) {
      // Get requestor schedule
      const requestorSchedule = this.schedules.get(request.requestorScheduleId);
      if (!requestorSchedule) continue;
      
      // Get requestor volunteer
      const volunteer = this.volunteers.get(requestorSchedule.volunteerId);
      if (!volunteer) continue;
      
      // Get user info
      const user = this.users.get(volunteer.userId);
      if (!user) continue;
      
      // Get team and role info
      const team = this.teams.get(volunteer.teamId);
      const role = this.roles.get(volunteer.roleId);
      if (!team || !role) continue;
      
      // Get event info for display
      const event = this.events.get(requestorSchedule.eventId);
      if (!event) continue;
      
      let swapDetails = '';
      
      // If there's a target schedule, get its details
      if (request.targetScheduleId) {
        const targetSchedule = this.schedules.get(request.targetScheduleId);
        if (targetSchedule) {
          const targetEvent = this.events.get(targetSchedule.eventId);
          if (targetEvent) {
            swapDetails = `Culto: ${this.formatDate(event.eventDate)} → Culto: ${this.formatDate(targetEvent.eventDate)}`;
          }
        }
      } 
      // If there's a target volunteer, get their name
      else if (request.targetVolunteerId) {
        const targetVolunteer = this.volunteers.get(request.targetVolunteerId);
        if (targetVolunteer) {
          const targetUser = this.users.get(targetVolunteer.userId);
          if (targetUser) {
            swapDetails = `Culto: ${this.formatDate(event.eventDate)} → Troca com ${targetUser.name} (${team.name})`;
          }
        }
      } 
      // Generic swap request
      else {
        swapDetails = `Culto: ${this.formatDate(event.eventDate)} → Solicitando substituição`;
      }
      
      // Check if this is a "new" request (less than 24 hours old)
      const isNew = (Date.now() - new Date(request.createdAt).getTime()) < 24 * 60 * 60 * 1000;
      
      result.push({
        ...request,
        requestor: {
          id: user.id,
          name: user.name,
          avatarUrl: undefined
        },
        teamName: team.name,
        roleName: role.name,
        swapDetails,
        isNew
      });
    }
    
    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return result;
  }
  
  private formatDate(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    } (${date.getHours().toString().padStart(2, '0')}:${
      date.getMinutes().toString().padStart(2, '0')
    })`;
  }
  
  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const id = this.currentSwapRequestId++;
    const swapRequest: SwapRequest = { 
      ...insertSwapRequest, 
      id, 
      createdAt: new Date() 
    };
    this.swapRequests.set(id, swapRequest);
    return swapRequest;
  }
  
  async approveSwapRequest(id: number): Promise<SwapRequest> {
    const swapRequest = this.swapRequests.get(id);
    if (!swapRequest) {
      throw new Error("Swap request not found");
    }
    
    // Update status
    const updatedRequest: SwapRequest = {
      ...swapRequest,
      status: "approved"
    };
    this.swapRequests.set(id, updatedRequest);
    
    // In a real app, we would also update the schedules here
    // to reflect the approved swap
    
    return updatedRequest;
  }
  
  async rejectSwapRequest(id: number): Promise<SwapRequest> {
    const swapRequest = this.swapRequests.get(id);
    if (!swapRequest) {
      throw new Error("Swap request not found");
    }
    
    // Update status
    const updatedRequest: SwapRequest = {
      ...swapRequest,
      status: "rejected"
    };
    this.swapRequests.set(id, updatedRequest);
    
    return updatedRequest;
  }
  
  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async getAllNotifications(): Promise<any[]> {
    const notifications = Array.from(this.notifications.values());
    
    // Sort by date (newest first)
    return notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      read: false,
      createdAt: new Date() 
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    
    const updatedNotification: Notification = {
      ...notification,
      read: true
    };
    this.notifications.set(id, updatedNotification);
    
    return updatedNotification;
  }
  
  async createSwapRequestNotification(userId: number, swapRequestId: number): Promise<Notification> {
    const swapRequest = this.swapRequests.get(swapRequestId);
    if (!swapRequest) {
      throw new Error("Swap request not found");
    }
    
    const requestorSchedule = this.schedules.get(swapRequest.requestorScheduleId);
    if (!requestorSchedule) {
      throw new Error("Requestor schedule not found");
    }
    
    const requestorVolunteer = this.volunteers.get(requestorSchedule.volunteerId);
    if (!requestorVolunteer) {
      throw new Error("Requestor volunteer not found");
    }
    
    const requestorUser = this.users.get(requestorVolunteer.userId);
    if (!requestorUser) {
      throw new Error("Requestor user not found");
    }
    
    const event = this.events.get(requestorSchedule.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const notification: InsertNotification = {
      userId,
      title: "Nova solicitação de troca",
      message: `${requestorUser.name} solicitou uma troca para o culto de ${this.formatDate(event.eventDate)}.`,
      type: "swap_request"
    };
    
    return this.createNotification(notification);
  }
  
  async createSwapRequestNotificationForLeader(scheduleId: number, swapRequestId: number): Promise<Notification> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }
    
    const volunteer = this.volunteers.get(schedule.volunteerId);
    if (!volunteer) {
      throw new Error("Volunteer not found");
    }
    
    const team = this.teams.get(volunteer.teamId);
    if (!team || !team.leaderId) {
      throw new Error("Team or team leader not found");
    }
    
    return this.createSwapRequestNotification(team.leaderId, swapRequestId);
  }
  
  async createConflictNotification(volunteerId: number, eventId: number): Promise<Notification> {
    const volunteer = this.volunteers.get(volunteerId);
    if (!volunteer) {
      throw new Error("Volunteer not found");
    }
    
    const user = this.users.get(volunteer.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Notify the volunteer
    const volunteerNotification: InsertNotification = {
      userId: user.id,
      title: "Conflito de escala detectado",
      message: `Você foi escalado em mais de um time para o culto de ${this.formatDate(event.eventDate)}.`,
      type: "conflict"
    };
    await this.createNotification(volunteerNotification);
    
    // Find team leaders to notify as well
    const teams = Array.from(this.teams.values())
      .filter(t => t.leaderId && t.leaderId > 0);
    
    for (const team of teams) {
      if (!team.leaderId) continue;
      
      const leaderNotification: InsertNotification = {
        userId: team.leaderId,
        title: "Conflito de escala detectado",
        message: `${user.name} foi escalado em mais de um time para o culto de ${this.formatDate(event.eventDate)}.`,
        type: "conflict"
      };
      await this.createNotification(leaderNotification);
    }
    
    return volunteerNotification as Notification;
  }
  
  // Conflict detection methods
  async getAllConflicts(): Promise<any[]> {
    const conflicts = [];
    const events = Array.from(this.events.values());
    
    for (const event of events) {
      // Get all schedules for this event
      const eventSchedules = Array.from(this.schedules.values())
        .filter(schedule => schedule.eventId === event.id);
      
      // Count schedules per volunteer
      const volunteerCounts = new Map<number, Schedule[]>();
      for (const schedule of eventSchedules) {
        if (!volunteerCounts.has(schedule.volunteerId)) {
          volunteerCounts.set(schedule.volunteerId, []);
        }
        volunteerCounts.get(schedule.volunteerId)?.push(schedule);
      }
      
      // Find volunteers with conflicts (more than one schedule)
      for (const [volunteerId, schedules] of volunteerCounts.entries()) {
        if (schedules.length <= 1) continue;
        
        const volunteer = this.volunteers.get(volunteerId);
        if (!volunteer) continue;
        
        const user = this.users.get(volunteer.userId);
        if (!user) continue;
        
        // Get team and role assignments
        const assignments = [];
        for (const schedule of schedules) {
          const volunteerForSchedule = this.volunteers.get(schedule.volunteerId);
          if (!volunteerForSchedule) continue;
          
          const team = this.teams.get(volunteerForSchedule.teamId);
          const role = this.roles.get(volunteerForSchedule.roleId);
          if (!team || !role) continue;
          
          // Assign a color class based on team
          let colorClass = "bg-blue-100 text-blue-800";
          if (team.name === "Kids") {
            colorClass = "bg-purple-100 text-purple-800";
          } else if (team.name === "Louvor") {
            colorClass = "bg-blue-100 text-blue-800";
          } else if (team.name === "Transmissão") {
            colorClass = "bg-green-100 text-green-800";
          } else if (team.name === "Recepção") {
            colorClass = "bg-yellow-100 text-yellow-800";
          }
          
          assignments.push({
            teamId: team.id,
            teamName: team.name,
            roleId: role.id,
            roleName: role.name,
            colorClass
          });
        }
        
        conflicts.push({
          id: conflicts.length + 1,
          volunteer: {
            id: volunteer.id,
            name: user.name,
            email: user.email,
            avatarUrl: undefined
          },
          eventDate: event.eventDate,
          location: event.location,
          assignments
        });
      }
    }
    
    return conflicts;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const volunteerCount = this.volunteers.size;
    const teamCount = this.teams.size;
    
    // Count services this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyServiceCount = Array.from(this.events.values())
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      })
      .length;
    
    // Count conflicts
    const conflicts = await this.getAllConflicts();
    
    return {
      volunteerCount,
      teamCount,
      monthlyServiceCount,
      conflictCount: conflicts.length
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }
  
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }
  
  async getAllTeamsWithRoles(): Promise<any[]> {
    const allTeams = await db.select().from(teams);
    const result = [];
    
    for (const team of allTeams) {
      const teamRoles = await db.select().from(roles).where(eq(roles.teamId, team.id));
      
      // For each role, count volunteers
      const rolesWithCount = await Promise.all(
        teamRoles.map(async (role) => {
          const volunteerCount = await db
            .select({ count: db.fn.count() })
            .from(volunteers)
            .where(eq(volunteers.roleId, role.id));
          
          return {
            ...role,
            volunteerCount: Number(volunteerCount[0].count) || 0
          };
        })
      );
      
      // Count volunteers in this team
      const volunteerCount = await db
        .select({ count: db.fn.count() })
        .from(volunteers)
        .where(eq(volunteers.teamId, team.id));
      
      // Get team leader if exists
      let leader = undefined;
      if (team.leaderId) {
        const [leaderUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, team.leaderId));
        
        if (leaderUser) {
          leader = {
            id: leaderUser.id,
            name: leaderUser.name,
            avatarUrl: undefined
          };
        }
      }
      
      result.push({
        ...team,
        roles: rolesWithCount,
        volunteerCount: Number(volunteerCount[0].count) || 0,
        leader
      });
    }
    
    return result;
  }
  
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }
  
  // Role methods
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }
  
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  async getRolesByTeam(teamId: number): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.teamId, teamId));
  }
  
  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }
  
  // Volunteer methods
  async getVolunteer(id: number): Promise<Volunteer | undefined> {
    const [volunteer] = await db.select().from(volunteers).where(eq(volunteers.id, id));
    return volunteer || undefined;
  }
  
  async getAllVolunteers(): Promise<Volunteer[]> {
    return await db.select().from(volunteers);
  }
  
  async getAllVolunteersWithTeams(): Promise<any[]> {
    const allVolunteers = await db.select().from(volunteers);
    const result = [];
    
    // Usar um mapa para agrupar voluntários pelo usuário
    const volunteersByUser = new Map();
    
    for (const volunteer of allVolunteers) {
      // Obter informações do usuário, equipe e função
      const [user] = await db.select().from(users).where(eq(users.id, volunteer.userId));
      const [team] = await db.select().from(teams).where(eq(teams.id, volunteer.teamId));
      const [role] = await db.select().from(roles).where(eq(roles.id, volunteer.roleId));
      
      if (!user || !team || !role) continue;
      
      // Se o usuário já existe no mapa, adicione essa equipe às equipes existentes
      if (volunteersByUser.has(user.id)) {
        volunteersByUser.get(user.id).teams.push({
          id: team.id,
          name: team.name,
          role: role.name,
          roleId: role.id
        });
      } else {
        // Caso contrário, crie uma nova entrada para este usuário
        volunteersByUser.set(user.id, {
          id: volunteer.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: undefined,
          isTrainee: volunteer.isTrainee,
          hasConflicts: false, // Será calculado com base nas programações
          teams: [{
            id: team.id,
            name: team.name,
            role: role.name,
            roleId: role.id
          }]
        });
      }
    }
    
    // Converter o mapa em uma matriz
    for (const volunteer of volunteersByUser.values()) {
      result.push(volunteer);
    }
    
    return result;
  }
  
  async getVolunteersByTeam(teamId: number): Promise<Volunteer[]> {
    return await db.select().from(volunteers).where(eq(volunteers.teamId, teamId));
  }
  
  async createVolunteer(insertVolunteer: InsertVolunteer): Promise<Volunteer> {
    const [volunteer] = await db
      .insert(volunteers)
      .values(insertVolunteer)
      .returning();
    return volunteer;
  }
  
  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }
  
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }
  
  async getUpcomingEvents(): Promise<any[]> {
    const now = new Date();
    
    // Obter eventos futuros, ordenados por data
    const upcomingEvents = await db
      .select()
      .from(events)
      .where(gt(events.eventDate, now))
      .orderBy(events.eventDate)
      .limit(5);
    
    const result = [];
    
    for (const event of upcomingEvents) {
      // Obter programações para este evento
      const eventSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.eventId, event.id));
      
      // Obter equipes únicas envolvidas neste evento
      const teamIds = new Set();
      
      for (const schedule of eventSchedules) {
        const [volunteer] = await db
          .select()
          .from(volunteers)
          .where(eq(volunteers.id, schedule.volunteerId));
        
        if (volunteer) {
          teamIds.add(volunteer.teamId);
        }
      }
      
      // Obter voluntários designados para este evento
      const volunteers = [];
      
      for (const schedule of eventSchedules) {
        const [volunteer] = await db
          .select()
          .from(volunteers)
          .where(eq(volunteers.id, schedule.volunteerId));
        
        if (!volunteer) continue;
        
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, volunteer.userId));
        
        if (!user) continue;
        
        volunteers.push({
          id: volunteer.id,
          name: user.name,
          avatarUrl: undefined
        });
      }
      
      // Determinar o status com base na contagem de voluntários e conflitos
      let status = 'complete';
      if (volunteers.length < 5) {
        status = 'incomplete';
      } else if (volunteers.length < 10) {
        status = 'warning';
      }
      
      result.push({
        ...event,
        teamCount: teamIds.size,
        volunteers,
        status
      });
    }
    
    return result;
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }
  
  // Schedule methods
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }
  
  async getAllSchedules(): Promise<any[]> {
    const allSchedules = await db.select().from(schedules);
    const result = [];
    
    for (const schedule of allSchedules) {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, schedule.eventId));
      
      if (!event) continue;
      
      const [volunteer] = await db
        .select()
        .from(volunteers)
        .where(eq(volunteers.id, schedule.volunteerId));
      
      if (!volunteer) continue;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, volunteer.userId));
      
      if (!user) continue;
      
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, volunteer.teamId));
      
      if (!team) continue;
      
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, volunteer.roleId));
      
      if (!role) continue;
      
      // Verificar se há conflitos
      const hasConflict = await this.checkSchedulingConflict(event.id, volunteer.id);
      
      result.push({
        id: schedule.id,
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        status: schedule.status,
        volunteer: {
          id: volunteer.id,
          name: user.name,
          avatarUrl: undefined
        },
        team: {
          id: team.id,
          name: team.name
        },
        role: {
          id: role.id,
          name: role.name
        },
        hasConflict
      });
    }
    
    return result;
  }
  
  async getSchedulesByEvent(eventId: number): Promise<any[]> {
    const eventSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.eventId, eventId));
    
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!event) return [];
    
    const result = [];
    
    for (const schedule of eventSchedules) {
      const [volunteer] = await db
        .select()
        .from(volunteers)
        .where(eq(volunteers.id, schedule.volunteerId));
      
      if (!volunteer) continue;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, volunteer.userId));
      
      if (!user) continue;
      
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, volunteer.teamId));
      
      if (!team) continue;
      
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, volunteer.roleId));
      
      if (!role) continue;
      
      // Verificar conflitos
      const hasConflict = await this.checkSchedulingConflict(eventId, volunteer.id);
      
      result.push({
        id: schedule.id,
        eventId: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        status: schedule.status,
        volunteer: {
          id: volunteer.id,
          name: user.name,
          avatarUrl: undefined
        },
        team: {
          id: team.id,
          name: team.name
        },
        role: {
          id: role.id,
          name: role.name
        },
        hasConflict
      });
    }
    
    return result;
  }
  
  async getSchedulesByVolunteer(volunteerId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.volunteerId, volunteerId));
  }
  
  async checkSchedulingConflict(eventId: number, volunteerId: number): Promise<boolean> {
    // Obter o evento para verificar a data
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!event) return false;
    
    // Obter todos os outros eventos que ocorrem no mesmo dia
    const sameTimeEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.eventDate, event.eventDate),
          eq(events.location, event.location),
          event.id !== events.id
        )
      );
    
    if (sameTimeEvents.length === 0) return false;
    
    // Verificar se o voluntário está programado para esses eventos
    const eventIds = sameTimeEvents.map(e => e.id);
    
    const conflictingSchedules = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.volunteerId, volunteerId),
          inArray(schedules.eventId, eventIds)
        )
      );
    
    return conflictingSchedules.length > 0;
  }
  
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }
  
  async createInitialSchedulesForEvent(eventId: number, teamId: number): Promise<void> {
    // Criar programações iniciais vazias para cada função da equipe
    const teamRoles = await this.getRolesByTeam(teamId);
    
    for (const role of teamRoles) {
      // Para cada função, criar uma entrada vazia de programação
      await this.createSchedule({
        eventId,
        volunteerId: 0, // Placeholder, será atualizado quando um voluntário for atribuído
        status: 'incomplete',
        createdById: 1, // Administrador por padrão
        traineePartnerId: null
      });
    }
  }
  
  // Availability rule methods
  async getAvailabilityRule(id: number): Promise<AvailabilityRule | undefined> {
    const [rule] = await db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.id, id));
    return rule || undefined;
  }
  
  async getAllAvailabilityRules(): Promise<AvailabilityRule[]> {
    return await db.select().from(availabilityRules);
  }
  
  async getAvailabilityRulesByVolunteer(volunteerId: number): Promise<AvailabilityRule[]> {
    return await db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.volunteerId, volunteerId));
  }
  
  async createAvailabilityRule(insertRule: InsertAvailabilityRule): Promise<AvailabilityRule> {
    const [rule] = await db
      .insert(availabilityRules)
      .values(insertRule)
      .returning();
    return rule;
  }
  
  // Swap request methods
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    const [swapRequest] = await db
      .select()
      .from(swapRequests)
      .where(eq(swapRequests.id, id));
    return swapRequest || undefined;
  }
  
  async getAllSwapRequests(): Promise<any[]> {
    const allSwapRequests = await db
      .select()
      .from(swapRequests)
      .orderBy(desc(swapRequests.createdAt));
    
    const result = [];
    
    for (const swapRequest of allSwapRequests) {
      // Obter informações do programador solicitante
      const [requestorSchedule] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, swapRequest.requestorScheduleId));
      
      if (!requestorSchedule) continue;
      
      // Obter informações do voluntário solicitante
      const [requestor] = await db
        .select()
        .from(volunteers)
        .where(eq(volunteers.id, requestorSchedule.volunteerId));
      
      if (!requestor) continue;
      
      // Obter usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, requestor.userId));
      
      if (!user) continue;
      
      // Obter informações da equipe e função
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, requestor.teamId));
      
      if (!team) continue;
      
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, requestor.roleId));
      
      if (!role) continue;
      
      // Obter informações do evento
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, requestorSchedule.eventId));
      
      if (!event) continue;
      
      // Formatar o detalhamento da troca
      const formattedDate = new Date(event.eventDate).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const swapDetails = `${event.title} - ${formattedDate}`;
      
      result.push({
        id: swapRequest.id,
        requestor: {
          id: requestor.id,
          name: user.name,
          avatarUrl: undefined
        },
        teamName: team.name,
        roleName: role.name,
        swapDetails,
        reason: swapRequest.reason,
        status: swapRequest.status,
        isNew: true // Sempre marcado como novo no frontend
      });
    }
    
    return result;
  }
  
  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const [swapRequest] = await db
      .insert(swapRequests)
      .values(insertSwapRequest)
      .returning();
    return swapRequest;
  }
  
  async approveSwapRequest(id: number): Promise<SwapRequest> {
    const [swapRequest] = await db
      .update(swapRequests)
      .set({ status: 'approved' })
      .where(eq(swapRequests.id, id))
      .returning();
    
    // Atualizar programações se necessário
    // Implementar lógica de troca de voluntários
    
    return swapRequest;
  }
  
  async rejectSwapRequest(id: number): Promise<SwapRequest> {
    const [swapRequest] = await db
      .update(swapRequests)
      .set({ status: 'rejected' })
      .where(eq(swapRequests.id, id))
      .returning();
    
    return swapRequest;
  }
  
  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification || undefined;
  }
  
  async getAllNotifications(): Promise<any[]> {
    const allNotifications = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
    
    return allNotifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt
    }));
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return notification;
  }
  
  async createSwapRequestNotification(userId: number, swapRequestId: number): Promise<Notification> {
    const notification: InsertNotification = {
      title: "Nova solicitação de troca",
      message: `Você recebeu uma nova solicitação de troca de escala. Por favor, verifique a aba de solicitações.`,
      type: "swap_request",
      userId,
      relatedId: swapRequestId
    };
    
    return await this.createNotification(notification);
  }
  
  async createSwapRequestNotificationForLeader(scheduleId: number, swapRequestId: number): Promise<Notification> {
    // Obter informações da programação
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, scheduleId));
    
    if (!schedule) throw new Error("Programação não encontrada");
    
    // Obter informações do voluntário
    const [volunteer] = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, schedule.volunteerId));
    
    if (!volunteer) throw new Error("Voluntário não encontrado");
    
    // Obter informações da equipe
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, volunteer.teamId));
    
    if (!team || !team.leaderId) throw new Error("Líder de equipe não encontrado");
    
    // Criar notificação para o líder da equipe
    const notification: InsertNotification = {
      title: "Nova solicitação de troca na sua equipe",
      message: `Um voluntário da sua equipe solicitou uma troca de escala. Por favor, verifique a aba de solicitações.`,
      type: "swap_request",
      userId: team.leaderId,
      relatedId: swapRequestId
    };
    
    return await this.createNotification(notification);
  }
  
  async createConflictNotification(volunteerId: number, eventId: number): Promise<Notification> {
    // Obter informações do voluntário
    const [volunteer] = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.id, volunteerId));
    
    if (!volunteer) throw new Error("Voluntário não encontrado");
    
    // Obter informações do usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, volunteer.userId));
    
    if (!user) throw new Error("Usuário não encontrado");
    
    // Obter informações do evento
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    
    if (!event) throw new Error("Evento não encontrado");
    
    // Obter informações da equipe
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, volunteer.teamId));
    
    if (!team || !team.leaderId) throw new Error("Líder de equipe não encontrado");
    
    // Criar notificação para o voluntário
    const volunteerNotification: InsertNotification = {
      title: "Conflito de programação detectado",
      message: `Foi detectado um conflito em sua programação para o evento "${event.title}". Por favor, entre em contato com seu líder de equipe.`,
      type: "conflict",
      userId: user.id,
      relatedId: eventId
    };
    
    await this.createNotification(volunteerNotification);
    
    // Criar notificação para o líder da equipe
    const leaderNotification: InsertNotification = {
      title: "Conflito de programação em sua equipe",
      message: `Foi detectado um conflito de programação para o voluntário ${user.name} no evento "${event.title}". Por favor, resolva este conflito.`,
      type: "conflict",
      userId: team.leaderId,
      relatedId: eventId
    };
    
    return await this.createNotification(leaderNotification);
  }
  
  // Conflict detection methods
  async getAllConflicts(): Promise<any[]> {
    // Obter todos os eventos
    const allEvents = await db.select().from(events);
    
    const conflicts = [];
    
    // Para cada evento, verificar conflitos
    for (const event of allEvents) {
      // Encontrar outros eventos no mesmo horário
      const sameTimeEvents = allEvents.filter(e => 
        e.id !== event.id && 
        e.eventDate.getTime() === event.eventDate.getTime() &&
        e.location === event.location
      );
      
      if (sameTimeEvents.length === 0) continue;
      
      const sameTimeEventIds = sameTimeEvents.map(e => e.id);
      
      // Obter todas as programações para este evento
      const eventSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.eventId, event.id));
      
      // Para cada programação, verificar se o voluntário está em outro evento ao mesmo tempo
      for (const schedule of eventSchedules) {
        const conflictingSchedules = await db
          .select()
          .from(schedules)
          .where(
            and(
              eq(schedules.volunteerId, schedule.volunteerId),
              inArray(schedules.eventId, sameTimeEventIds)
            )
          );
        
        if (conflictingSchedules.length === 0) continue;
        
        // Obter informações do voluntário
        const [volunteer] = await db
          .select()
          .from(volunteers)
          .where(eq(volunteers.id, schedule.volunteerId));
        
        if (!volunteer) continue;
        
        // Obter informações do usuário
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, volunteer.userId));
        
        if (!user) continue;
        
        // Obter todas as atribuições deste voluntário (incluindo a atual e as conflitantes)
        const allAssignments = [
          { scheduleId: schedule.id, eventId: event.id },
          ...conflictingSchedules.map(s => ({ scheduleId: s.id, eventId: s.eventId }))
        ];
        
        // Obter informações da equipe e função para cada atribuição
        const assignments = [];
        
        for (const assignment of allAssignments) {
          const [volunteer] = await db
            .select()
            .from(volunteers)
            .where(eq(volunteers.id, schedule.volunteerId));
          
          if (!volunteer) continue;
          
          const [team] = await db
            .select()
            .from(teams)
            .where(eq(teams.id, volunteer.teamId));
          
          if (!team) continue;
          
          const [role] = await db
            .select()
            .from(roles)
            .where(eq(roles.id, volunteer.roleId));
          
          if (!role) continue;
          
          assignments.push({
            teamId: team.id,
            teamName: team.name,
            roleId: role.id,
            roleName: role.name,
            colorClass: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'][Math.floor(Math.random() * 4)]
          });
        }
        
        conflicts.push({
          id: schedule.id,
          volunteer: {
            id: volunteer.id,
            name: user.name,
            email: user.email,
            avatarUrl: undefined
          },
          eventDate: event.eventDate,
          location: event.location,
          assignments
        });
      }
    }
    
    return conflicts;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    // Contar voluntários
    const volunteerCount = await db
      .select({ count: db.fn.count() })
      .from(volunteers);
    
    // Contar equipes
    const teamCount = await db
      .select({ count: db.fn.count() })
      .from(teams);
    
    // Contar serviços mensais
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyServiceCount = await db
      .select({ count: db.fn.count() })
      .from(events)
      .where(
        and(
          gte(events.eventDate, startOfMonth),
          lte(events.eventDate, endOfMonth)
        )
      );
    
    // Contar conflitos
    const conflicts = await this.getAllConflicts();
    
    return {
      volunteerCount: Number(volunteerCount[0].count) || 0,
      teamCount: Number(teamCount[0].count) || 0,
      monthlyServiceCount: Number(monthlyServiceCount[0].count) || 0,
      conflictCount: conflicts.length
    };
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
