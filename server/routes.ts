import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertTeamSchema, insertTeamRoleSchema, 
  insertTeamMemberSchema, insertEventSchema, insertScheduleSchema,
  insertScheduleAssignmentSchema, insertAvailabilityRuleSchema,
  insertSwapRequestSchema, insertNotificationSchema,
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return { success: true, data: schema.parse(data) };
    } catch (error) {
      if (error instanceof ZodError) {
        return { 
          success: false, 
          error: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        };
      }
      return { success: false, error: "Invalid request data" };
    }
  };

  // Error handler middleware
  const handleError = (res: Response, error: any) => {
    console.error(error);
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Internal server error" });
  };

  // ===== User Routes =====
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validation = validateRequest(insertUserSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Teams Routes =====
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(Number(req.params.id));
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validation = validateRequest(insertTeamSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const team = await storage.createTeam(validation.data);
      res.status(201).json(team);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const updatedTeam = await storage.updateTeam(id, req.body);
      res.json(updatedTeam);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Team Roles Routes =====
  app.get("/api/teams/:teamId/roles", async (req, res) => {
    try {
      const teamId = Number(req.params.teamId);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const roles = await storage.getTeamRoles(teamId);
      res.json(roles);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/teams/:teamId/roles", async (req, res) => {
    try {
      const teamId = Number(req.params.teamId);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const roleData = { ...req.body, teamId };
      const validation = validateRequest(insertTeamRoleSchema, roleData);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const role = await storage.createTeamRole(validation.data);
      res.status(201).json(role);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/team-roles/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const role = await storage.getTeamRole(id);
      if (!role) {
        return res.status(404).json({ error: "Team role not found" });
      }

      const updatedRole = await storage.updateTeamRole(id, req.body);
      res.json(updatedRole);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/team-roles/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const role = await storage.getTeamRole(id);
      if (!role) {
        return res.status(404).json({ error: "Team role not found" });
      }

      await storage.deleteTeamRole(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Team Members Routes =====
  app.get("/api/teams/:teamId/members", async (req, res) => {
    try {
      const teamId = Number(req.params.teamId);
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/teams", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/team-members", async (req, res) => {
    try {
      const validation = validateRequest(insertTeamMemberSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const member = await storage.addTeamMember(validation.data);
      res.status(201).json(member);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/team-members/:userId/:teamId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const teamId = Number(req.params.teamId);
      
      const updatedMember = await storage.updateTeamMember(userId, teamId, req.body);
      if (!updatedMember) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(updatedMember);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/team-members/:userId/:teamId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const teamId = Number(req.params.teamId);
      
      await storage.removeTeamMember(userId, teamId);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Events Routes =====
  app.get("/api/events", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const events = await storage.getEvents({ startDate, endDate });
      res.json(events);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(Number(req.params.id));
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const validation = validateRequest(insertEventSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const event = await storage.createEvent(validation.data);
      res.status(201).json(event);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const updatedEvent = await storage.updateEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await storage.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Schedules Routes =====
  app.get("/api/schedules", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.teamId) filters.teamId = Number(req.query.teamId);
      if (req.query.eventId) filters.eventId = Number(req.query.eventId);
      if (req.query.status) filters.status = req.query.status as string;
      
      const schedules = await storage.getSchedules(filters);
      res.json(schedules);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.getSchedule(Number(req.params.id));
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validation = validateRequest(insertScheduleSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const schedule = await storage.createSchedule(validation.data);
      res.status(201).json(schedule);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const schedule = await storage.getSchedule(id);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const updatedSchedule = await storage.updateSchedule(id, req.body);
      res.json(updatedSchedule);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const schedule = await storage.getSchedule(id);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      await storage.deleteSchedule(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Schedule Assignments Routes =====
  app.get("/api/schedules/:scheduleId/assignments", async (req, res) => {
    try {
      const scheduleId = Number(req.params.scheduleId);
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const assignments = await storage.getScheduleAssignments(scheduleId);
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/assignments", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const assignments = await storage.getUserAssignments(userId);
      res.json(assignments);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/schedule-assignments", async (req, res) => {
    try {
      const validation = validateRequest(insertScheduleAssignmentSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      // Check for conflicts
      const scheduleId = validation.data.scheduleId;
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      
      const event = await storage.getEvent(schedule.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const eventDate = new Date(event.date);
      const eventEndTime = new Date(event.endTime).toTimeString().substring(0, 5);
      const eventStartTime = new Date(event.date).toTimeString().substring(0, 5);
      
      const conflict = await storage.detectScheduleConflicts(
        validation.data.userId, 
        eventDate, 
        eventStartTime,
        eventEndTime
      );
      
      if (conflict.hasConflict) {
        return res.status(409).json({ 
          error: "Schedule conflict detected", 
          conflicts: conflict.conflictingAssignments 
        });
      }
      
      const assignment = await storage.createScheduleAssignment(validation.data);
      res.status(201).json(assignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/schedule-assignments/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const assignment = await storage.getScheduleAssignment(id);
      if (!assignment) {
        return res.status(404).json({ error: "Schedule assignment not found" });
      }

      const updatedAssignment = await storage.updateScheduleAssignment(id, req.body);
      res.json(updatedAssignment);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/schedule-assignments/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const assignment = await storage.getScheduleAssignment(id);
      if (!assignment) {
        return res.status(404).json({ error: "Schedule assignment not found" });
      }

      await storage.deleteScheduleAssignment(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Availability Rules Routes =====
  app.get("/api/users/:userId/availability", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const rules = await storage.getAvailabilityRules(userId);
      res.json(rules);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/availability-rules", async (req, res) => {
    try {
      const validation = validateRequest(insertAvailabilityRuleSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const rule = await storage.createAvailabilityRule(validation.data);
      res.status(201).json(rule);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/availability-rules/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rule = await Promise.resolve(
        Array.from(await storage.getAvailabilityRules(req.body.userId || 0))
          .find(r => r.id === id)
      );
      
      if (!rule) {
        return res.status(404).json({ error: "Availability rule not found" });
      }

      const updatedRule = await storage.updateAvailabilityRule(id, req.body);
      res.json(updatedRule);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/availability-rules/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteAvailabilityRule(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Swap Requests Routes =====
  app.get("/api/swap-requests", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.requesterId) filters.requesterId = Number(req.query.requesterId);
      if (req.query.status) filters.status = req.query.status as string;
      
      const requests = await storage.getSwapRequests(filters);
      res.json(requests);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/swap-requests/:id", async (req, res) => {
    try {
      const request = await storage.getSwapRequest(Number(req.params.id));
      if (!request) {
        return res.status(404).json({ error: "Swap request not found" });
      }
      res.json(request);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/swap-requests", async (req, res) => {
    try {
      const validation = validateRequest(insertSwapRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const request = await storage.createSwapRequest(validation.data);
      
      // Create notification for the team leader
      const schedule = await storage.getSchedule(request.scheduleId);
      if (schedule && schedule.createdBy) {
        await storage.createNotification({
          userId: schedule.createdBy,
          type: "swap_request",
          title: "New Swap Request",
          message: "A volunteer has requested a schedule swap",
          relatedId: request.id,
          isRead: false
        });
      }
      
      res.status(201).json(request);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/swap-requests/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const request = await storage.getSwapRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Swap request not found" });
      }

      const updatedRequest = await storage.updateSwapRequest(id, req.body);
      
      // Create notification for the requester about status update
      if (req.body.status && req.body.status !== request.status) {
        await storage.createNotification({
          userId: request.requesterId,
          type: "swap_request_update",
          title: `Swap Request ${req.body.status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your swap request has been ${req.body.status}`,
          relatedId: request.id,
          isRead: false
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/swap-requests/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const request = await storage.getSwapRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Swap request not found" });
      }

      await storage.deleteSwapRequest(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Notifications Routes =====
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:userId/unread-notifications", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const notifications = await storage.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validation = validateRequest(insertNotificationSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation error", details: validation.error });
      }
      
      const notification = await storage.createNotification(validation.data);
      res.status(201).json(notification);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteNotification(id);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== Conflict Detection Routes =====
  app.post("/api/conflicts/detect", async (req, res) => {
    try {
      const { userId, date, startTime, endTime } = req.body;
      
      if (!userId || !date || !startTime || !endTime) {
        return res.status(400).json({ 
          error: "Missing required parameters", 
          details: "userId, date, startTime, and endTime are required" 
        });
      }
      
      const conflicts = await storage.detectScheduleConflicts(
        Number(userId),
        new Date(date),
        startTime,
        endTime
      );
      
      res.json(conflicts);
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
