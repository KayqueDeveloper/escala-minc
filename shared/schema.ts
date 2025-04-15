import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("volunteer"), // admin, leader, volunteer
  createdAt: timestamp("created_at").defaultNow(),
});

// Team table (Ministry teams like Transmission, Kids, etc.)
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: integer("leader_id").references(() => users.id),
});

// Role table (Specific roles within a team like coordinator, vmix, etc.)
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  description: text("description"),
});

// Volunteer table (Link between users and teams with specific roles)
export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  isTrainee: boolean("is_trainee").default(false),
});

// Event table (Cultos and special events)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventType: text("event_type").notNull(), // regular_service, special_event
  recurrent: boolean("recurrent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schedule table (The actual scheduling of volunteers for events)
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  volunteerId: integer("volunteer_id").references(() => volunteers.id).notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, pending, cancelled
  traineePartnerId: integer("trainee_partner_id").references(() => volunteers.id),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Availability rules table (Custom rules for volunteer availability)
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  volunteerId: integer("volunteer_id").references(() => volunteers.id).notNull(),
  description: text("description").notNull(),
  dayOfWeek: integer("day_of_week"), // 0-6 for Sunday-Saturday, null if not day-specific
  startTime: text("start_time"), // HH:MM format, null if all day
  endTime: text("end_time"), // HH:MM format, null if all day
  startDate: timestamp("start_date"), // null if permanent
  endDate: timestamp("end_date"), // null if permanent
});

// Swap requests table (For volunteers to request schedule changes)
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  requestorScheduleId: integer("requestor_schedule_id").references(() => schedules.id).notNull(),
  targetScheduleId: integer("target_schedule_id").references(() => schedules.id),
  targetVolunteerId: integer("target_volunteer_id").references(() => volunteers.id),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // conflict, swap_request, reminder
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertVolunteerSchema = createInsertSchema(volunteers).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true, createdAt: true });
export const insertAvailabilityRuleSchema = createInsertSchema(availabilityRules).omit({ id: true });
export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type InsertAvailabilityRule = z.infer<typeof insertAvailabilityRuleSchema>;

export type SwapRequest = typeof swapRequests.$inferSelect;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
