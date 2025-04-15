import { pgTable, text, serial, integer, boolean, primaryKey, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User (Volunteer/Leader) schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").default("volunteer").notNull(), // volunteer, leader, admin
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Teams schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: integer("leader_id").references(() => users.id), // Team leader
  color: text("color").default("#3f51b5"), // Team color for UI display
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
});

// Team roles (functions specific to each team)
export const teamRoles = pgTable("team_roles", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  name: text("name").notNull(), // Role name like "VMix", "Freehand", etc.
  description: text("description"),
  requiresTraining: boolean("requires_training").default(false),
});

export const insertTeamRoleSchema = createInsertSchema(teamRoles).omit({
  id: true,
});

// Team membership links users to teams
export const teamMembers = pgTable("team_members", {
  userId: integer("user_id").references(() => users.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  roleIds: text("role_ids").array(), // Array of role IDs the user can perform in this team
  isTrainee: boolean("is_trainee").default(false),
  isActive: boolean("is_active").default(true),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.teamId] }),
  };
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers);

// Events (services, special events)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Culto da Manhã"
  date: timestamp("date").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: json("recurring_pattern").default({}), // For recurring events
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

// Schedules for team members
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  status: text("status").default("draft").notNull(), // draft, published
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  notes: text("notes"),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schedule assignments link users to specific roles in a schedule
export const scheduleAssignments = pgTable("schedule_assignments", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").references(() => schedules.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roleId: integer("role_id").references(() => teamRoles.id).notNull(),
  hasTrainee: boolean("has_trainee").default(false),
  traineeId: integer("trainee_id").references(() => users.id), // Optional trainee
});

export const insertScheduleAssignmentSchema = createInsertSchema(scheduleAssignments).omit({
  id: true,
});

// Volunteer availability rules
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week"), // 0-6 (Sunday-Saturday), null means any day
  startTime: text("start_time"), // Format: "HH:MM"
  endTime: text("end_time"), // Format: "HH:MM"
  isAvailable: boolean("is_available").default(false).notNull(), // false means not available in this time slot
  reason: text("reason"),
  startDate: timestamp("start_date"), // Start date for temp unavailability
  endDate: timestamp("end_date"), // End date for temp unavailability
});

export const insertAvailabilityRuleSchema = createInsertSchema(availabilityRules).omit({
  id: true,
});

// Swap requests
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  scheduleId: integer("schedule_id").references(() => schedules.id).notNull(),
  assignmentId: integer("assignment_id").references(() => scheduleAssignments.id).notNull(),
  replacementId: integer("replacement_id").references(() => users.id), // Optional proposed replacement
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedBy: integer("resolved_by").references(() => users.id), // Leader who approved/rejected
  resolvedAt: timestamp("resolved_at"),
});

export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // e.g., "swap_request", "schedule_published"
  title: text("title").notNull(),
  message: text("message"),
  relatedId: integer("related_id"), // ID of related entity (e.g., swap_request id)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamRole = typeof teamRoles.$inferSelect;
export type InsertTeamRole = z.infer<typeof insertTeamRoleSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;
export type InsertScheduleAssignment = z.infer<typeof insertScheduleAssignmentSchema>;

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type InsertAvailabilityRule = z.infer<typeof insertAvailabilityRuleSchema>;

export type SwapRequest = typeof swapRequests.$inferSelect;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
