import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").default("volunteer"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team model
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: integer("leader_id").references(() => users.id),
});

// Role model
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").references(() => teams.id),
});

// Team Member model (connects volunteers to teams)
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  roleId: integer("role_id").references(() => roles.id),
  isTrainee: boolean("is_trainee").default(false),
});

// Service model (regular worship services)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  time: text("time").notNull(), // E.g. "9h", "11h", "18h"
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
});

// Events model (special events)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  description: text("description"),
});

// Schedule model
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  serviceId: integer("service_id").references(() => services.id),
  eventId: integer("event_id").references(() => events.id),
  date: timestamp("date").notNull(),
  status: text("status").default("draft"), // draft, published, completed
  createdBy: integer("created_by").references(() => users.id),
});

// Schedule details model (connects schedules to roles and volunteers)
export const scheduleDetails = pgTable("schedule_details", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").references(() => schedules.id),
  roleId: integer("role_id").references(() => roles.id),
  volunteerId: integer("volunteer_id").references(() => users.id),
  traineeId: integer("trainee_id").references(() => users.id),
  status: text("status").default("pending"), // pending, confirmed, unavailable
});

// Availability Rules model
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  description: text("description").notNull(),
  // Store rule details in JSON format
  // E.g. { type: "service", serviceId: 1, isAvailable: false }
  // Or { type: "date", date: "2023-07-15", isAvailable: false }
  rule: json("rule").notNull(),
});

// Swap Requests model
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id),
  replacementId: integer("replacement_id").references(() => users.id),
  scheduleDetailId: integer("schedule_detail_id").references(() => scheduleDetails.id),
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  reason: text("reason"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertScheduleDetailSchema = createInsertSchema(scheduleDetails).omit({ id: true });
export const insertAvailabilityRuleSchema = createInsertSchema(availabilityRules).omit({ id: true });
export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({ id: true, createdAt: true, resolvedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type InsertScheduleDetail = z.infer<typeof insertScheduleDetailSchema>;
export type InsertAvailabilityRule = z.infer<typeof insertAvailabilityRuleSchema>;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type ScheduleDetail = typeof scheduleDetails.$inferSelect;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type SwapRequest = typeof swapRequests.$inferSelect;
