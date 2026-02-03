import { db } from "./db";
import { 
  events, labels, perks, labelPerks, guests, guestFamily, guestRequests,
  type InsertEvent, type InsertLabel, type InsertPerk, type InsertLabelPerk,
  type InsertGuest, type InsertGuestFamily, type InsertGuestRequest,
  type Event, type Label, type Perk, type LabelPerk, type Guest, type GuestFamily, type GuestRequest
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage"; // Import existing auth storage

// Combine IAuthStorage with app-specific storage methods if needed, 
// or just export a new interface for app data.
// For simplicity in this structure, we'll keep them somewhat separate but can be merged.

export interface IStorage {
  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;

  // Labels
  getLabels(eventId: number): Promise<Label[]>;
  createLabel(label: InsertLabel): Promise<Label>;
  updateLabel(id: number, label: Partial<InsertLabel>): Promise<Label | undefined>;

  // Perks
  getPerks(eventId: number): Promise<Perk[]>;
  createPerk(perk: InsertPerk): Promise<Perk>;
  updatePerk(id: number, perk: Partial<InsertPerk>): Promise<Perk | undefined>;

  // LabelPerks
  getLabelPerks(labelId: number): Promise<(LabelPerk & { perk: Perk })[]>;
  updateLabelPerk(labelId: number, perkId: number, data: Partial<InsertLabelPerk>): Promise<LabelPerk>;

  // Guests
  getGuests(eventId: number): Promise<Guest[]>;
  getGuest(id: number): Promise<Guest | undefined>;
  getGuestByRef(ref: string): Promise<(Guest & { event: Event, label: Label | null }) | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: number, guest: Partial<InsertGuest>): Promise<Guest | undefined>;

  // GuestFamily
  getGuestFamily(guestId: number): Promise<GuestFamily[]>;
  createGuestFamily(member: InsertGuestFamily): Promise<GuestFamily>;

  // Requests
  getRequests(eventId: number): Promise<(GuestRequest & { guest: Guest, perk: Perk | null })[]>;
  createRequest(request: InsertGuestRequest): Promise<GuestRequest>;
  updateRequest(id: number, data: { status: string, notes?: string }): Promise<GuestRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Events
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return updated;
  }

  // Labels
  async getLabels(eventId: number): Promise<Label[]> {
    return await db.select().from(labels).where(eq(labels.eventId, eventId));
  }
  async createLabel(label: InsertLabel): Promise<Label> {
    const [newLabel] = await db.insert(labels).values(label).returning();
    return newLabel;
  }
  async updateLabel(id: number, label: Partial<InsertLabel>): Promise<Label | undefined> {
      const [updated] = await db.update(labels).set(label).where(eq(labels.id, id)).returning();
      return updated;
  }

  // Perks
  async getPerks(eventId: number): Promise<Perk[]> {
    return await db.select().from(perks).where(eq(perks.eventId, eventId));
  }
  async createPerk(perk: InsertPerk): Promise<Perk> {
    const [newPerk] = await db.insert(perks).values(perk).returning();
    return newPerk;
  }
  async updatePerk(id: number, perk: Partial<InsertPerk>): Promise<Perk | undefined> {
      const [updated] = await db.update(perks).set(perk).where(eq(perks.id, id)).returning();
      return updated;
  }

  // LabelPerks
  async getLabelPerks(labelId: number): Promise<(LabelPerk & { perk: Perk })[]> {
    const rows = await db.select()
        .from(labelPerks)
        .innerJoin(perks, eq(labelPerks.perkId, perks.id))
        .where(eq(labelPerks.labelId, labelId));
    
    return rows.map(r => ({ ...r.label_perks, perk: r.perks }));
  }
  async updateLabelPerk(labelId: number, perkId: number, data: Partial<InsertLabelPerk>): Promise<LabelPerk> {
    // Check if exists
    const [existing] = await db.select().from(labelPerks)
        .where(and(eq(labelPerks.labelId, labelId), eq(labelPerks.perkId, perkId)));

    if (existing) {
        const [updated] = await db.update(labelPerks)
            .set(data)
            .where(eq(labelPerks.id, existing.id))
            .returning();
        return updated;
    } else {
        const [created] = await db.insert(labelPerks)
            .values({ labelId, perkId, isEnabled: data.isEnabled ?? true, expenseHandledByClient: data.expenseHandledByClient ?? false })
            .returning();
        return created;
    }
  }

  // Guests
  async getGuests(eventId: number): Promise<Guest[]> {
    return await db.select().from(guests).where(eq(guests.eventId, eventId));
  }
  async getGuest(id: number): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest;
  }
  async getGuestByRef(ref: string): Promise<(Guest & { event: Event, label: Label | null }) | undefined> {
    const [result] = await db.select()
        .from(guests)
        .innerJoin(events, eq(guests.eventId, events.id))
        .leftJoin(labels, eq(guests.labelId, labels.id))
        .where(eq(guests.bookingRef, ref));
    
    if (result) {
        return { ...result.guests, event: result.events, label: result.labels };
    }
    return undefined;
  }
  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [newGuest] = await db.insert(guests).values(guest).returning();
    return newGuest;
  }
  async updateGuest(id: number, guest: Partial<InsertGuest>): Promise<Guest | undefined> {
    const [updated] = await db.update(guests).set(guest).where(eq(guests.id, id)).returning();
    return updated;
  }

  // GuestFamily
  async getGuestFamily(guestId: number): Promise<GuestFamily[]> {
    return await db.select().from(guestFamily).where(eq(guestFamily.guestId, guestId));
  }
  async createGuestFamily(member: InsertGuestFamily): Promise<GuestFamily> {
    const [newMember] = await db.insert(guestFamily).values(member).returning();
    return newMember;
  }

  // Requests
  async getRequests(eventId: number): Promise<(GuestRequest & { guest: Guest, perk: Perk | null })[]> {
    // Join through guests to filter by eventId
    const rows = await db.select({
        request: guestRequests,
        guest: guests,
        perk: perks
    })
    .from(guestRequests)
    .innerJoin(guests, eq(guestRequests.guestId, guests.id))
    .leftJoin(perks, eq(guestRequests.perkId, perks.id))
    .where(eq(guests.eventId, eventId));

    return rows.map(r => ({ ...r.request, guest: r.guest, perk: r.perk }));
  }
  async createRequest(request: InsertGuestRequest): Promise<GuestRequest> {
    const [newRequest] = await db.insert(guestRequests).values(request).returning();
    return newRequest;
  }
  async updateRequest(id: number, data: { status: string, notes?: string }): Promise<GuestRequest | undefined> {
    const [updated] = await db.update(guestRequests).set(data).where(eq(guestRequests.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
export { authStorage };
