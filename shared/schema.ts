import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export auth models first
export * from "./models/auth";
import { users } from "./models/auth";

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  agentId: text("agent_id").references(() => users.id), // The travel agent
  clientId: text("client_id").references(() => users.id), // The host client
  createdAt: timestamp("created_at").defaultNow(),
});

// Labels (VIP, Friend, Staff, etc.)
export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  description: text("description"),
});

// Perks (Add-ons like Airport Pickup, Meals, etc.)
export const perks = pgTable("perks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // e.g., 'transport', 'accommodation', 'meal', 'activity'
});

// Label Perks Configuration (The core logic for permissions/expenses)
export const labelPerks = pgTable("label_perks", {
  id: serial("id").primaryKey(),
  labelId: integer("label_id").notNull().references(() => labels.id),
  perkId: integer("perk_id").notNull().references(() => perks.id),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  expenseHandledByClient: boolean("expense_handled_by_client").default(false).notNull(), // If true, guest sees "Included". If false, "Contact Agent"
});

// Guests
export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  labelId: integer("label_id").references(() => labels.id), // Assigned label
  name: text("name").notNull(),
  email: text("email").notNull(),
  bookingRef: text("booking_ref").notNull().unique(), // Simple code for lookup
  status: text("status").default("pending").notNull(), // pending, confirmed, declined
  // Fixed Travel Details (Read-only for guest)
  arrivalDate: timestamp("arrival_date"),
  departureDate: timestamp("departure_date"),
  travelMode: text("travel_mode"), // Flight, Train, etc.
});

// Family Members (for Rooming)
export const guestFamily = pgTable("guest_family", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guests.id),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  age: integer("age"),
});

// Guest Requests (when asking for something not enabled or requiring manual approval)
export const guestRequests = pgTable("guest_requests", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guests.id),
  perkId: integer("perk_id").references(() => perks.id), // Optional, could be a general request
  type: text("type").notNull(), // 'perk_request', 'custom'
  status: text("status").default("pending").notNull(), // pending, approved, rejected, forwarded_to_client
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  agent: one(users, { fields: [events.agentId], references: [users.id], relationName: 'agent_events' }),
  client: one(users, { fields: [events.clientId], references: [users.id], relationName: 'client_events' }),
  labels: many(labels),
  perks: many(perks),
  guests: many(guests),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  event: one(events, { fields: [labels.eventId], references: [events.id] }),
  labelPerks: many(labelPerks),
  guests: many(guests),
}));

export const perksRelations = relations(perks, ({ one, many }) => ({
  event: one(events, { fields: [perks.eventId], references: [events.id] }),
  labelPerks: many(labelPerks),
}));

export const labelPerksRelations = relations(labelPerks, ({ one }) => ({
  label: one(labels, { fields: [labelPerks.labelId], references: [labels.id] }),
  perk: one(perks, { fields: [labelPerks.perkId], references: [perks.id] }),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  event: one(events, { fields: [guests.eventId], references: [events.id] }),
  label: one(labels, { fields: [guests.labelId], references: [labels.id] }),
  family: many(guestFamily),
  requests: many(guestRequests),
}));

export const guestFamilyRelations = relations(guestFamily, ({ one }) => ({
  guest: one(guests, { fields: [guestFamily.guestId], references: [guests.id] }),
}));

export const guestRequestsRelations = relations(guestRequests, ({ one }) => ({
  guest: one(guests, { fields: [guestRequests.guestId], references: [guests.id] }),
  perk: one(perks, { fields: [guestRequests.perkId], references: [perks.id] }),
}));

// Schemas
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertLabelSchema = createInsertSchema(labels).omit({ id: true });
export const insertPerkSchema = createInsertSchema(perks).omit({ id: true });
export const insertLabelPerkSchema = createInsertSchema(labelPerks).omit({ id: true });
export const insertGuestSchema = createInsertSchema(guests).omit({ id: true });
export const insertGuestFamilySchema = createInsertSchema(guestFamily).omit({ id: true });
export const insertGuestRequestSchema = createInsertSchema(guestRequests).omit({ id: true, createdAt: true });

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Label = typeof labels.$inferSelect;
export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Perk = typeof perks.$inferSelect;
export type InsertPerk = z.infer<typeof insertPerkSchema>;
export type LabelPerk = typeof labelPerks.$inferSelect;
export type InsertLabelPerk = z.infer<typeof insertLabelPerkSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type GuestFamily = typeof guestFamily.$inferSelect;
export type InsertGuestFamily = z.infer<typeof insertGuestFamilySchema>;
export type GuestRequest = typeof guestRequests.$inferSelect;
export type InsertGuestRequest = z.infer<typeof insertGuestRequestSchema>;

// Complex Types for API Responses
export type LabelWithPerks = Label & { perks: (LabelPerk & { perk: Perk })[] };
export type GuestWithFamily = Guest & { family: GuestFamily[] };
export type GuestInvitation = Guest & { 
  event: Event; 
  label: Label; 
  family: GuestFamily[];
  availablePerks: (Perk & { isEnabled: boolean; expenseHandledByClient: boolean })[];
};
