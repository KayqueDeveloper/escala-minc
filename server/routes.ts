import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTeamSchema, 
  insertRoleSchema, 
  insertVolunteerSchema, 
  insertEventSchema, 
  insertScheduleSchema, 
  insertSwapRequestSchema, 
  insertNotificationSchema, 
  insertAvailabilityRuleSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User related routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/leaders", async (req, res) => {
    try {
      const leaders = await storage.getUsersByRole("leader");
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaders" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const parsedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(parsedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Team related routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams" });
    }
  });

  app.get("/api/teams/with-roles", async (req, res) => {
    try {
      const teams = await storage.getAllTeamsWithRoles();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams with roles" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.getTeam(parseInt(req.params.id));
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const parsedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(parsedData);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  // Role related routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const role = await storage.getRole(parseInt(req.params.id));
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: "Error fetching role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const parsedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(parsedData);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: "Invalid role data" });
    }
  });

  // Volunteer related routes
  app.get("/api/volunteers", async (req, res) => {
    try {
      const volunteers = await storage.getAllVolunteersWithTeams();
      res.json(volunteers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching volunteers" });
    }
  });

  app.get("/api/volunteers/:id", async (req, res) => {
    try {
      const volunteer = await storage.getVolunteer(parseInt(req.params.id));
      if (!volunteer) {
        return res.status(404).json({ message: "Volunteer not found" });
      }
      res.json(volunteer);
    } catch (error) {
      res.status(500).json({ message: "Error fetching volunteer" });
    }
  });

  app.post("/api/volunteers", async (req, res) => {
    try {
      const parsedData = insertVolunteerSchema.parse(req.body);
      const volunteer = await storage.createVolunteer(parsedData);
      res.status(201).json(volunteer);
    } catch (error) {
      res.status(400).json({ message: "Invalid volunteer data" });
    }
  });

  // Event related routes
  app.get("/api/events", async (req, res) => {
    try {
      const filterType = req.query.filter as string;
      const events = await storage.getAllEvents();
      
      let filteredEvents = events;
      
      // Apply filters
      if (filterType === 'upcoming') {
        const now = new Date();
        filteredEvents = events.filter(e => new Date(e.eventDate) > now);
      } else if (filterType === 'past') {
        const now = new Date();
        filteredEvents = events.filter(e => new Date(e.eventDate) < now);
      } else if (filterType && filterType !== 'all') {
        // Filter by event type if specified
        filteredEvents = events.filter(e => e.eventType === filterType);
      }
      
      res.json(filteredEvents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const upcomingEvents = await storage.getUpcomingEvents();
      res.json(upcomingEvents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const parsedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(parsedData);
      
      // Create event schedules for each team
      if (req.body.teamIds && Array.isArray(req.body.teamIds)) {
        for (const teamId of req.body.teamIds) {
          await storage.createInitialSchedulesForEvent(event.id, teamId);
        }
      }
      
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Schedule related routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const filterType = req.query.filter as string;
      const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
      
      let schedules;
      
      if (eventId) {
        schedules = await storage.getSchedulesByEvent(eventId);
      } else {
        schedules = await storage.getAllSchedules();
      }
      
      // Apply filters
      let filteredSchedules = schedules;
      
      if (filterType === 'upcoming') {
        const now = new Date();
        filteredSchedules = schedules.filter(s => new Date(s.eventDate) > now);
      } else if (filterType === 'incomplete') {
        filteredSchedules = schedules.filter(s => s.status !== 'complete');
      } else if (filterType === 'conflicts') {
        filteredSchedules = schedules.filter(s => s.hasConflicts);
      } else if (filterType === 'past') {
        const now = new Date();
        filteredSchedules = schedules.filter(s => new Date(s.eventDate) < now);
      }
      
      res.json(filteredSchedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules" });
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.getSchedule(parseInt(req.params.id));
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const parsedData = insertScheduleSchema.parse(req.body);
      
      // Check for scheduling conflicts
      const hasConflict = await storage.checkSchedulingConflict(
        parsedData.eventId,
        parsedData.volunteerId
      );
      
      if (hasConflict) {
        // Create schedule but mark it as conflicted
        const schedule = await storage.createSchedule(parsedData);
        
        // Create conflict notification
        await storage.createConflictNotification(parsedData.volunteerId, parsedData.eventId);
        
        return res.status(201).json({
          ...schedule,
          warning: "Volunteer has a scheduling conflict"
        });
      }
      
      const schedule = await storage.createSchedule(parsedData);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  // Availability rules related routes
  app.get("/api/availability-rules", async (req, res) => {
    try {
      const volunteerId = req.query.volunteerId ? parseInt(req.query.volunteerId as string) : undefined;
      
      if (volunteerId) {
        const rules = await storage.getAvailabilityRulesByVolunteer(volunteerId);
        return res.json(rules);
      }
      
      const rules = await storage.getAllAvailabilityRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching availability rules" });
    }
  });

  app.post("/api/availability-rules", async (req, res) => {
    try {
      const parsedData = insertAvailabilityRuleSchema.parse(req.body);
      const rule = await storage.createAvailabilityRule(parsedData);
      res.status(201).json(rule);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability rule data" });
    }
  });

  // Swap request related routes
  app.get("/api/swap-requests", async (req, res) => {
    try {
      const swapRequests = await storage.getAllSwapRequests();
      res.json(swapRequests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching swap requests" });
    }
  });

  app.post("/api/swap-requests", async (req, res) => {
    try {
      const parsedData = insertSwapRequestSchema.parse(req.body);
      const swapRequest = await storage.createSwapRequest(parsedData);
      
      // Create notification for the target volunteer or team leader
      if (parsedData.targetVolunteerId) {
        await storage.createSwapRequestNotification(
          parsedData.targetVolunteerId,
          swapRequest.id
        );
      } else {
        // If no target volunteer, notify the team leader
        await storage.createSwapRequestNotificationForLeader(
          parsedData.requestorScheduleId,
          swapRequest.id
        );
      }
      
      res.status(201).json(swapRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid swap request data" });
    }
  });

  app.post("/api/swap-requests/:id/approve", async (req, res) => {
    try {
      const swapRequestId = parseInt(req.params.id);
      const updatedSwapRequest = await storage.approveSwapRequest(swapRequestId);
      res.json(updatedSwapRequest);
    } catch (error) {
      res.status(500).json({ message: "Error approving swap request" });
    }
  });

  app.post("/api/swap-requests/:id/reject", async (req, res) => {
    try {
      const swapRequestId = parseInt(req.params.id);
      const updatedSwapRequest = await storage.rejectSwapRequest(swapRequestId);
      res.json(updatedSwapRequest);
    } catch (error) {
      res.status(500).json({ message: "Error rejecting swap request" });
    }
  });

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Create a sanitized user object without the password
      const userResponse = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin'
      };
      
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Error during authentication" });
    }
  });

  // Notification related routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const parsedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(parsedData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Invalid notification data" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });

  // Conflict detection related routes
  app.get("/api/conflicts", async (req, res) => {
    try {
      const conflicts = await storage.getAllConflicts();
      res.json(conflicts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching conflicts" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
