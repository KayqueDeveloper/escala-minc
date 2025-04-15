import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertTeamSchema, insertRoleSchema, insertTeamMemberSchema,
  insertServiceSchema, insertEventSchema, insertScheduleSchema, insertScheduleDetailSchema,
  insertAvailabilityRuleSchema, insertSwapRequestSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Auth Routes
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Don't send password back to client
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User Routes
  app.get('/api/users', async (_req, res) => {
    try {
      const users = await storage.getUsers();
      // Filter out passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
      const userData = req.body;
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Team Routes
  app.get('/api/teams', async (_req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch teams' });
    }
  });

  app.get('/api/teams/:id', async (req, res) => {
    const teamId = parseInt(req.params.id);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch team' });
    }
  });

  app.post('/api/teams', async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const newTeam = await storage.createTeam(teamData);
      res.status(201).json(newTeam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid team data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create team' });
    }
  });

  app.put('/api/teams/:id', async (req, res) => {
    const teamId = parseInt(req.params.id);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
      const teamData = req.body;
      const updatedTeam = await storage.updateTeam(teamId, teamData);
      
      if (!updatedTeam) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      res.json(updatedTeam);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update team' });
    }
  });

  app.delete('/api/teams/:id', async (req, res) => {
    const teamId = parseInt(req.params.id);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
      const success = await storage.deleteTeam(teamId);
      if (!success) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete team' });
    }
  });

  // Role Routes
  app.get('/api/roles', async (_req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.get('/api/teams/:teamId/roles', async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
      const roles = await storage.getRolesByTeam(teamId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch roles for team' });
    }
  });

  app.post('/api/roles', async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const newRole = await storage.createRole(roleData);
      res.status(201).json(newRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid role data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create role' });
    }
  });

  app.put('/api/roles/:id', async (req, res) => {
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    try {
      const roleData = req.body;
      const updatedRole = await storage.updateRole(roleId, roleData);
      
      if (!updatedRole) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  app.delete('/api/roles/:id', async (req, res) => {
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID' });
    }

    try {
      const success = await storage.deleteRole(roleId);
      if (!success) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete role' });
    }
  });

  // Team Members Routes
  app.get('/api/team-members', async (_req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  });

  app.get('/api/teams/:teamId/members', async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    try {
      const members = await storage.getTeamMembersByTeam(teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  });

  app.get('/api/users/:userId/teams', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
      const teamMembers = await storage.getTeamMembersByUser(userId);
      
      // Get the team details for each membership
      const teams = await Promise.all(
        teamMembers.map(async (member) => {
          const team = await storage.getTeam(member.teamId);
          const role = await storage.getRole(member.roleId);
          return {
            ...member,
            teamDetails: team,
            roleDetails: role
          };
        })
      );
      
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user teams' });
    }
  });

  app.post('/api/team-members', async (req, res) => {
    try {
      const memberData = insertTeamMemberSchema.parse(req.body);
      const newMember = await storage.createTeamMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid team member data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to add team member' });
    }
  });

  app.put('/api/team-members/:id', async (req, res) => {
    const memberId = parseInt(req.params.id);
    if (isNaN(memberId)) {
      return res.status(400).json({ message: 'Invalid team member ID' });
    }

    try {
      const memberData = req.body;
      const updatedMember = await storage.updateTeamMember(memberId, memberData);
      
      if (!updatedMember) {
        return res.status(404).json({ message: 'Team member not found' });
      }
      
      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update team member' });
    }
  });

  app.delete('/api/team-members/:id', async (req, res) => {
    const memberId = parseInt(req.params.id);
    if (isNaN(memberId)) {
      return res.status(400).json({ message: 'Invalid team member ID' });
    }

    try {
      const success = await storage.deleteTeamMember(memberId);
      if (!success) {
        return res.status(404).json({ message: 'Team member not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove team member' });
    }
  });

  // Services Routes
  app.get('/api/services', async (_req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  app.post('/api/services', async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const newService = await storage.createService(serviceData);
      res.status(201).json(newService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid service data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create service' });
    }
  });

  // Events Routes
  app.get('/api/events', async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (start && end) {
        // If date range is provided, return events within range
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: 'Invalid date range' });
        }
        
        const events = await storage.getEventsByDateRange(startDate, endDate);
        return res.json(events);
      }
      
      // Otherwise return all events
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    try {
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event' });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const newEvent = await storage.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid event data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.put('/api/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    try {
      const eventData = req.body;
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    try {
      const success = await storage.deleteEvent(eventId);
      if (!success) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  // Schedule Routes
  app.get('/api/schedules', async (req, res) => {
    try {
      const { start, end, teamId } = req.query;
      
      if (start && end) {
        // If date range is provided, return schedules within range
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: 'Invalid date range' });
        }
        
        if (teamId) {
          // If team ID is also provided, filter by team
          const teamIdNum = parseInt(teamId as string);
          
          if (isNaN(teamIdNum)) {
            return res.status(400).json({ message: 'Invalid team ID' });
          }
          
          const teamSchedules = await storage.getSchedulesByTeam(teamIdNum);
          const filteredSchedules = teamSchedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= startDate && scheduleDate <= endDate;
          });
          
          return res.json(filteredSchedules);
        }
        
        const schedules = await storage.getSchedulesByDateRange(startDate, endDate);
        return res.json(schedules);
      }
      
      if (teamId) {
        // If only team ID is provided, get all schedules for that team
        const teamIdNum = parseInt(teamId as string);
        
        if (isNaN(teamIdNum)) {
          return res.status(400).json({ message: 'Invalid team ID' });
        }
        
        const teamSchedules = await storage.getSchedulesByTeam(teamIdNum);
        return res.json(teamSchedules);
      }
      
      // Otherwise return all schedules
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch schedules' });
    }
  });

  app.get('/api/schedules/:id', async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    try {
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch schedule' });
    }
  });

  app.post('/api/schedules', async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const newSchedule = await storage.createSchedule(scheduleData);
      res.status(201).json(newSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid schedule data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create schedule' });
    }
  });

  app.put('/api/schedules/:id', async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    try {
      const scheduleData = req.body;
      const updatedSchedule = await storage.updateSchedule(scheduleId, scheduleData);
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update schedule' });
    }
  });

  app.delete('/api/schedules/:id', async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    try {
      const success = await storage.deleteSchedule(scheduleId);
      if (!success) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete schedule' });
    }
  });

  // Schedule Details Routes
  app.get('/api/schedule-details', async (req, res) => {
    try {
      const { scheduleId, volunteerId } = req.query;
      
      if (scheduleId) {
        const scheduleIdNum = parseInt(scheduleId as string);
        
        if (isNaN(scheduleIdNum)) {
          return res.status(400).json({ message: 'Invalid schedule ID' });
        }
        
        const details = await storage.getScheduleDetailsBySchedule(scheduleIdNum);
        return res.json(details);
      }
      
      if (volunteerId) {
        const volunteerIdNum = parseInt(volunteerId as string);
        
        if (isNaN(volunteerIdNum)) {
          return res.status(400).json({ message: 'Invalid volunteer ID' });
        }
        
        const details = await storage.getScheduleDetailsByVolunteer(volunteerIdNum);
        return res.json(details);
      }
      
      const scheduleDetails = await storage.getScheduleDetails();
      res.json(scheduleDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch schedule details' });
    }
  });

  app.post('/api/schedule-details', async (req, res) => {
    try {
      const detailData = insertScheduleDetailSchema.parse(req.body);
      
      // Check for scheduling conflicts
      const schedule = await storage.getSchedule(detailData.scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      const conflict = await storage.checkScheduleConflict(schedule.date, detailData.volunteerId);
      
      if (conflict) {
        // If conflict exists, return error with conflict details
        const conflictSchedule = await storage.getSchedule(conflict.scheduleId);
        const conflictRole = await storage.getRole(conflict.roleId);
        const conflictTeam = await storage.getTeam(conflictSchedule.teamId);
        
        return res.status(409).json({
          message: 'Volunteer already scheduled for this date',
          conflict: {
            scheduleDetail: conflict,
            schedule: conflictSchedule,
            role: conflictRole,
            team: conflictTeam
          }
        });
      }
      
      // Check volunteer availability
      const isAvailable = await storage.checkAvailability(
        detailData.volunteerId, 
        schedule.date, 
        schedule.serviceId
      );
      
      if (!isAvailable) {
        return res.status(400).json({
          message: 'Volunteer not available for this date/service'
        });
      }
      
      const newDetail = await storage.createScheduleDetail(detailData);
      res.status(201).json(newDetail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid schedule detail data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create schedule detail' });
    }
  });

  app.put('/api/schedule-details/:id', async (req, res) => {
    const detailId = parseInt(req.params.id);
    if (isNaN(detailId)) {
      return res.status(400).json({ message: 'Invalid schedule detail ID' });
    }

    try {
      const detailData = req.body;
      const updatedDetail = await storage.updateScheduleDetail(detailId, detailData);
      
      if (!updatedDetail) {
        return res.status(404).json({ message: 'Schedule detail not found' });
      }
      
      res.json(updatedDetail);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update schedule detail' });
    }
  });

  app.delete('/api/schedule-details/:id', async (req, res) => {
    const detailId = parseInt(req.params.id);
    if (isNaN(detailId)) {
      return res.status(400).json({ message: 'Invalid schedule detail ID' });
    }

    try {
      const success = await storage.deleteScheduleDetail(detailId);
      if (!success) {
        return res.status(404).json({ message: 'Schedule detail not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete schedule detail' });
    }
  });

  // Availability Rules Routes
  app.get('/api/availability-rules', async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (userId) {
        const userIdNum = parseInt(userId as string);
        
        if (isNaN(userIdNum)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const rules = await storage.getAvailabilityRulesByUser(userIdNum);
        return res.json(rules);
      }
      
      const rules = await storage.getAvailabilityRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch availability rules' });
    }
  });

  app.post('/api/availability-rules', async (req, res) => {
    try {
      const ruleData = insertAvailabilityRuleSchema.parse(req.body);
      const newRule = await storage.createAvailabilityRule(ruleData);
      res.status(201).json(newRule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid rule data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create availability rule' });
    }
  });

  app.delete('/api/availability-rules/:id', async (req, res) => {
    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: 'Invalid rule ID' });
    }

    try {
      const success = await storage.deleteAvailabilityRule(ruleId);
      if (!success) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete availability rule' });
    }
  });

  // Swap Requests Routes
  app.get('/api/swap-requests', async (req, res) => {
    try {
      const { requesterId, replacementId, status } = req.query;
      
      if (requesterId) {
        const requesterIdNum = parseInt(requesterId as string);
        
        if (isNaN(requesterIdNum)) {
          return res.status(400).json({ message: 'Invalid requester ID' });
        }
        
        const requests = await storage.getSwapRequestsByRequester(requesterIdNum);
        return res.json(requests);
      }
      
      if (replacementId) {
        const replacementIdNum = parseInt(replacementId as string);
        
        if (isNaN(replacementIdNum)) {
          return res.status(400).json({ message: 'Invalid replacement ID' });
        }
        
        const requests = await storage.getSwapRequestsByReplacement(replacementIdNum);
        return res.json(requests);
      }
      
      if (status === 'pending') {
        const pendingRequests = await storage.getPendingSwapRequests();
        return res.json(pendingRequests);
      }
      
      const requests = await storage.getSwapRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch swap requests' });
    }
  });

  app.post('/api/swap-requests', async (req, res) => {
    try {
      const requestData = insertSwapRequestSchema.parse(req.body);
      const newRequest = await storage.createSwapRequest(requestData);
      res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.format() });
      }
      res.status(500).json({ message: 'Failed to create swap request' });
    }
  });

  app.put('/api/swap-requests/:id', async (req, res) => {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    try {
      const requestData = req.body;
      const updatedRequest = await storage.updateSwapRequest(requestId, requestData);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: 'Swap request not found' });
      }
      
      // If the request is approved, update the schedule detail
      if (updatedRequest.status === 'approved') {
        const scheduleDetail = await storage.getScheduleDetail(updatedRequest.scheduleDetailId);
        
        if (scheduleDetail) {
          await storage.updateScheduleDetail(scheduleDetail.id, {
            volunteerId: updatedRequest.replacementId
          });
        }
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update swap request' });
    }
  });

  return httpServer;
}
