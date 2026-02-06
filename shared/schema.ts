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
  eventCode: text("event_code").notNull().unique(),
  isPublished: boolean("is_published").default(false).notNull(),
  agentId: text("agent_id").references(() => users.id), // The travel agent
  clientId: text("client_id").references(() => users.id), // The host client
  createdAt: timestamp("created_at").defaultNow(),
});

// Client Details
export const clientDetails = pgTable("client_details", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id).unique(),
  clientName: text("client_name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  hasVipGuests: boolean("has_vip_guests").default(false),
  hasFriends: boolean("has_friends").default(false),
  hasFamily: boolean("has_family").default(false),
});

// Hotel Bookings
export const hotelBookings = pgTable("hotel_bookings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  hotelName: text("hotel_name").notNull(),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  numberOfRooms: integer("number_of_rooms").notNull(),
});

// Travel Options
export const travelOptions = pgTable("travel_options", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  travelMode: text("travel_mode").notNull(), // 'flight' or 'train'
  departureDate: timestamp("departure_date"),
  returnDate: timestamp("return_date"),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
});

// Flight/Train Schedules
export const travelSchedules = pgTable("travel_schedules", {
  id: serial("id").primaryKey(),
  travelOptionId: integer("travel_option_id").notNull().references(() => travelOptions.id),
  scheduleType: text("schedule_type").notNull(), // 'departure' or 'return'
  carrier: text("carrier").notNull(), // Airline or Train operator
  flightNumber: text("flight_number"),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  isVisibleToClient: boolean("is_visible_to_client").default(true),
  isSelected: boolean("is_selected").default(false),
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
  phone: text("phone"),
  category: text("category"),
  dietaryRestrictions: text("dietary_restrictions"),
  specialRequests: text("special_requests"),
  bookingRef: text("booking_ref").notNull().unique(), // Simple code for lookup
  accessToken: text("access_token").notNull().unique(), // Secure token for guest portal access
  status: text("status").default("pending").notNull(), // pending, confirmed, declined
  // Fixed Travel Details (Read-only for guest)
  arrivalDate: timestamp("arrival_date"),
  departureDate: timestamp("departure_date"),
  travelMode: text("travel_mode"), // Flight, Train, etc.
  // Seat allocation
  allocatedSeats: integer("allocated_seats").default(1).notNull(), // e.g., "Reserved for Sarah + 1"
  confirmedSeats: integer("confirmed_seats").default(1).notNull(),
  // Bleisure extension
  hostCoveredCheckIn: timestamp("host_covered_check_in"),
  hostCoveredCheckOut: timestamp("host_covered_check_out"),
  extendedCheckIn: timestamp("extended_check_in"), // Self-paid extension
  extendedCheckOut: timestamp("extended_check_out"),
  // ID Verification
  idDocumentUrl: text("id_document_url"),
  idVerificationStatus: text("id_verification_status").default("pending"), // pending, verified, failed
  idVerifiedName: text("id_verified_name"),
  // Self-management
  selfManageFlights: boolean("self_manage_flights").default(false),
  selfManageHotel: boolean("self_manage_hotel").default(false),
  // Waitlist
  isOnWaitlist: boolean("is_on_waitlist").default(false),
  waitlistPriority: integer("waitlist_priority").default(0), // Based on tier (VIP=1, Family=2, etc.)
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

// Event Itinerary (Core events & add-on activities)
export const itineraryEvents = pgTable("itinerary_events", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  perkId: integer("perk_id").references(() => perks.id), // If it's tied to a perk (optional)
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  isMandatory: boolean("is_mandatory").default(false), // Core event vs optional
  capacity: integer("capacity"),
  currentAttendees: integer("current_attendees").default(0),
});

// Guest Itinerary Selections
export const guestItinerary = pgTable("guest_itinerary", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guests.id),
  itineraryEventId: integer("itinerary_event_id").notNull().references(() => itineraryEvents.id),
  status: text("status").default("attending").notNull(), // attending, declined, waitlist
});

// Relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  agent: one(users, { fields: [events.agentId], references: [users.id], relationName: 'agent_events' }),
  client: one(users, { fields: [events.clientId], references: [users.id], relationName: 'client_events' }),
  clientDetails: one(clientDetails, { fields: [events.id], references: [clientDetails.eventId] }),
  hotelBookings: many(hotelBookings),
  travelOptions: many(travelOptions),
  labels: many(labels),
  perks: many(perks),
  guests: many(guests),
  itineraryEvents: many(itineraryEvents),
}));

export const clientDetailsRelations = relations(clientDetails, ({ one }) => ({
  event: one(events, { fields: [clientDetails.eventId], references: [events.id] }),
}));

export const hotelBookingsRelations = relations(hotelBookings, ({ one }) => ({
  event: one(events, { fields: [hotelBookings.eventId], references: [events.id] }),
}));

export const travelOptionsRelations = relations(travelOptions, ({ one, many }) => ({
  event: one(events, { fields: [travelOptions.eventId], references: [events.id] }),
  schedules: many(travelSchedules),
}));

export const travelSchedulesRelations = relations(travelSchedules, ({ one }) => ({
  travelOption: one(travelOptions, { fields: [travelSchedules.travelOptionId], references: [travelOptions.id] }),
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
  itinerarySelections: many(guestItinerary),
}));

export const itineraryEventsRelations = relations(itineraryEvents, ({ one, many }) => ({
  event: one(events, { fields: [itineraryEvents.eventId], references: [events.id] }),
  perk: one(perks, { fields: [itineraryEvents.perkId], references: [perks.id] }),
  guestSelections: many(guestItinerary),
}));

export const guestItineraryRelations = relations(guestItinerary, ({ one }) => ({
  guest: one(guests, { fields: [guestItinerary.guestId], references: [guests.id] }),
  itineraryEvent: one(itineraryEvents, { fields: [guestItinerary.itineraryEventId], references: [itineraryEvents.id] }),
}));

export const guestFamilyRelations = relations(guestFamily, ({ one }) => ({
  guest: one(guests, { fields: [guestFamily.guestId], references: [guests.id] }),
}));

export const guestRequestsRelations = relations(guestRequests, ({ one }) => ({
  guest: one(guests, { fields: [guestRequests.guestId], references: [guests.id] }),
  perk: one(perks, { fields: [guestRequests.perkId], references: [perks.id] }),
}));

// Schemas
export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true, 
  createdAt: true, 
  eventCode: true // Auto-generated on server
}).extend({
  date: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  clientName: z.string().min(1, "Client name is required"), // For event code generation
});
export const insertClientDetailsSchema = createInsertSchema(clientDetails).omit({ id: true });
export const insertHotelBookingSchema = createInsertSchema(hotelBookings, {
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
}).omit({ id: true });
export const insertTravelOptionSchema = createInsertSchema(travelOptions, {
  departureDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional(),
}).omit({ id: true });
export const insertTravelScheduleSchema = createInsertSchema(travelSchedules).omit({ id: true });
export const insertLabelSchema = createInsertSchema(labels).omit({ id: true });
export const insertPerkSchema = createInsertSchema(perks).omit({ id: true });
export const insertLabelPerkSchema = createInsertSchema(labelPerks).omit({ id: true });
export const insertGuestSchema = createInsertSchema(guests).omit({ 
  id: true, 
  accessToken: true, 
  bookingRef: true 
});
export const insertGuestFamilySchema = createInsertSchema(guestFamily).omit({ id: true });
export const insertGuestRequestSchema = createInsertSchema(guestRequests).omit({ id: true, createdAt: true });
export const insertItineraryEventSchema = createInsertSchema(itineraryEvents).omit({ id: true });
export const insertGuestItinerarySchema = createInsertSchema(guestItinerary).omit({ id: true });

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type ClientDetails = typeof clientDetails.$inferSelect;
export type InsertClientDetails = z.infer<typeof insertClientDetailsSchema>;
export type HotelBooking = typeof hotelBookings.$inferSelect;
export type InsertHotelBooking = z.infer<typeof insertHotelBookingSchema>;
export type TravelOption = typeof travelOptions.$inferSelect;
export type InsertTravelOption = z.infer<typeof insertTravelOptionSchema>;
export type TravelSchedule = typeof travelSchedules.$inferSelect;
export type InsertTravelSchedule = z.infer<typeof insertTravelScheduleSchema>;
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
export type ItineraryEvent = typeof itineraryEvents.$inferSelect;
export type InsertItineraryEvent = z.infer<typeof insertItineraryEventSchema>;
export type GuestItinerary = typeof guestItinerary.$inferSelect;
export type InsertGuestItinerary = z.infer<typeof insertGuestItinerarySchema>;

// Complex Types for API Responses
export type LabelWithPerks = Label & { perks: (LabelPerk & { perk: Perk })[] };
export type GuestWithFamily = Guest & { family: GuestFamily[] };
export type GuestInvitation = Guest & { 
  event: Event; 
  label: Label; 
  family: GuestFamily[];
  availablePerks: (Perk & { isEnabled: boolean; expenseHandledByClient: boolean })[];
  itinerary: (ItineraryEvent & { registered: boolean; hasConflict: boolean })[];
};
