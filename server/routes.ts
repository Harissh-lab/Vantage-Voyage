import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertEventSchema, insertGuestSchema, insertLabelSchema, insertPerkSchema, insertLabelPerkSchema, type Event as EventType } from "@shared/schema";
import bcrypt from "bcryptjs";
import guestRoutes from "./guest-routes";

// Middleware to get user from session
function getUser(req: any) {
  return req.session?.user;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      // Set session
      req.session.user = user;

      res.status(201).json(user);
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Missing email or password" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check role if provided
      if (role && user.role !== role) {
        return res.status(401).json({ message: "Invalid credentials for this role" });
      }

      // Set session
      req.session.user = user;

      res.json(user);
    } catch (err) {
      console.error("Signin error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get("/api/user", async (req, res) => {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(user);
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.post("/api/user/event-code", async (req, res) => {
    try {
      const user = getUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { eventCode } = req.body;
      if (!eventCode) {
        return res.status(400).json({ message: "Event code is required" });
      }

      // Verify event code exists
      const event = await storage.getEventByCode(eventCode);
      if (!event) {
        return res.status(404).json({ message: "Invalid event code" });
      }

      // Update user with event code
      await storage.updateUserEventCode(user.id, eventCode);
      
      // Update session
      req.session.user = { ...user, eventCode };

      res.json({ success: true });
    } catch (err) {
      console.error("Event code error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let events: EventType[];
    if (user.role === "agent") {
      // Agents see all their events (published and unpublished)
      events = await storage.getEventsByAgent(user.id);
    } else if (user.role === "client" && user.eventCode) {
      // Clients see events matching their event code
      // TODO: In production, filter by: events = events.filter(e => e.isPublished);
      events = await storage.getEventsByCode(user.eventCode);
    } else {
      events = [];
    }

    res.json(events);
  });

  app.post(api.events.create.path, async (req, res) => {
    try {
      const user = getUser(req);
      console.log("Create event - User:", user);
      if (!user || user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can create events" });
      }

      console.log("Create event - Request body:", req.body);
      const input = api.events.create.input.parse(req.body);
      console.log("Create event - Parsed input:", input);
      
      // Auto-generate event code: [CLIENT_3][EVENT_3][YEAR][MMDD]
      const eventDate = new Date(input.date);
      const clientPrefix = (req.body.clientName || '').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'XXX');
      const namePrefix = input.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      
      // Ensure prefixes are padded to 3 characters
      const paddedClientPrefix = clientPrefix.padEnd(3, 'X');
      const paddedNamePrefix = namePrefix.padEnd(3, 'X');
      
      let eventCode = `${paddedClientPrefix}${paddedNamePrefix}${year}${month}${day}`;
      
      // Check if event code already exists, add random suffix if needed
      let existingEvent = await storage.getEventByCode(eventCode);
      if (existingEvent) {
        // Add random 2-character suffix
        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        eventCode = `${eventCode}${randomSuffix}`;
      }
      
      const event = await storage.createEvent({ ...input, eventCode, agentId: user.id });
      console.log("Create event - Created event:", event);
      res.status(201).json(event);
    } catch (err: any) {
      console.error("Create event error:", err?.message || err);
      
      // Handle database constraint violations
      if (err?.code === '23505') {
        return res.status(400).json({ 
          message: "Event code already exists. Please try again." 
        });
      }
      
      if (err instanceof z.ZodError) {
        console.log("Validation errors:", err.errors);
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
      } else {
        res.status(500).json({ message: err?.message || "Failed to create event" });
      }
    }
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.post("/api/events/:id/publish", async (req, res) => {
    try {
      const user = getUser(req);
      if (!user || user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can publish events" });
      }

      const eventId = Number(req.params.id);
      const event = await storage.updateEvent(eventId, { isPublished: true });
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (err: any) {
      console.error("Publish event error:", err);
      res.status(500).json({ message: err.message || "Failed to publish event" });
    }
  });

  app.put(api.events.update.path, async (req, res) => {
      try {
          const input = api.events.update.input.parse(req.body);
          const event = await storage.updateEvent(Number(req.params.id), input);
          if (!event) return res.status(404).json({ message: "Event not found" });
          res.json(event);
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
          }
      }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const user = getUser(req);
      if (!user || user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can delete events" });
      }

      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Verify the agent owns this event
      if (event.agentId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own events" });
      }

      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (err: any) {
      console.error("Delete event error:", err);
      // Handle foreign key constraint errors
      if (err.code === '23503') {
        return res.status(400).json({ 
          message: "Cannot delete event with existing data. Please delete all guests, labels, and perks first." 
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Client Details Routes
  app.post("/api/events/:id/client-details", async (req, res) => {
    try {
      const user = getUser(req);
      if (!user || user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can add client details" });
      }

      const eventId = Number(req.params.id);
      
      // Check if client details already exist for this event
      const existingDetails = await storage.getClientDetails(eventId);
      
      let clientDetails;
      if (existingDetails) {
        // Update existing client details
        clientDetails = await storage.updateClientDetails(eventId, req.body);
      } else {
        // Create new client details
        clientDetails = await storage.createClientDetails({
          eventId,
          ...req.body,
        });
      }

      res.status(existingDetails ? 200 : 201).json(clientDetails);
    } catch (err: any) {
      console.error("Client details error:", err);
      res.status(500).json({ message: err.message || "Failed to save client details" });
    }
  });

  app.get("/api/events/:id/client-details", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const clientDetails = await storage.getClientDetails(eventId);
      
      if (!clientDetails) {
        return res.status(404).json({ message: "Client details not found" });
      }

      res.json(clientDetails);
    } catch (err) {
      console.error("Get client details error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Hotel Booking Routes
  app.post("/api/events/:id/hotel-booking", async (req, res) => {
    try {
      const user = getUser(req);
      if (!user || user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can add hotel bookings" });
      }

      const booking = await storage.createHotelBooking(req.body);
      res.status(201).json(booking);
    } catch (err: any) {
      console.error("Hotel booking error:", err);
      res.status(500).json({ message: err.message || "Failed to create hotel booking" });
    }
  });

  app.get("/api/events/:id/hotel-bookings", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const bookings = await storage.getHotelBookings(eventId);
      res.json(bookings);
    } catch (err) {
      console.error("Get hotel bookings error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Travel Options Routes
  app.post("/api/events/:id/travel-options", async (req, res) => {
    try {
      const user = getUser(req);
      if (!user || user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can add travel options" });
      }

      const travelOption = await storage.createTravelOption(req.body);
      res.status(201).json(travelOption);
    } catch (err: any) {
      console.error("Travel option error:", err);
      res.status(500).json({ message: err.message || "Failed to create travel option" });
    }
  });

  app.get("/api/events/:id/travel-options", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const options = await storage.getTravelOptions(eventId);
      res.json(options);
    } catch (err) {
      console.error("Get travel options error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Labels
  app.get(api.labels.list.path, async (req, res) => {
    const labels = await storage.getLabels(Number(req.params.eventId));
    res.json(labels);
  });

  app.post(api.labels.create.path, async (req, res) => {
    try {
      const input = api.labels.create.input.parse(req.body);
      const label = await storage.createLabel({ ...input, eventId: Number(req.params.eventId) });
      res.status(201).json(label);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: err.message || "Failed to create label" });
      }
    }
  });
  
  app.put(api.labels.update.path, async (req, res) => {
      try {
          const input = api.labels.update.input.parse(req.body);
          const label = await storage.updateLabel(Number(req.params.id), input);
          if (!label) return res.status(404).json({ message: "Label not found" });
          res.json(label);
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
          }
      }
  });

  // Perks
  app.get(api.perks.list.path, async (req, res) => {
    const perks = await storage.getPerks(Number(req.params.eventId));
    res.json(perks);
  });

  app.post(api.perks.create.path, async (req, res) => {
    try {
      const input = api.perks.create.input.parse(req.body);
      const perk = await storage.createPerk({ ...input, eventId: Number(req.params.eventId) });
      res.status(201).json(perk);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.put(api.perks.update.path, async (req, res) => {
      try {
          const input = api.perks.update.input.parse(req.body);
          const perk = await storage.updatePerk(Number(req.params.id), input);
          if (!perk) return res.status(404).json({ message: "Perk not found" });
          res.json(perk);
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
          }
      }
  });

  // Label Perks
  app.get(api.labelPerks.list.path, async (req, res) => {
      const labelPerks = await storage.getLabelPerks(Number(req.params.labelId));
      res.json(labelPerks);
  });

  app.put(api.labelPerks.update.path, async (req, res) => {
    try {
      const input = api.labelPerks.update.input.parse(req.body);
      const labelPerk = await storage.updateLabelPerk(Number(req.params.labelId), Number(req.params.perkId), input);
      res.json(labelPerk);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Guests
  app.get(api.guests.list.path, async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      console.log('[DEBUG] Fetching guests for event:', eventId);
      const guests = await storage.getGuests(eventId);
      console.log('[DEBUG] Found guests:', guests.length, guests);
      res.json(guests);
    } catch (error) {
      console.error('[ERROR] Failed to fetch guests:', error);
      res.status(500).json({ message: "Failed to fetch guests", error: String(error) });
    }
  });

  app.post(api.guests.create.path, async (req, res) => {
    try {
      console.log('[DEBUG] Creating guest for event:', req.params.eventId);
      console.log('[DEBUG] Guest data:', req.body);
      const input = api.guests.create.input.parse(req.body);
      const guest = await storage.createGuest({ ...input, eventId: Number(req.params.eventId) });
      console.log('[DEBUG] Created guest successfully');
      res.status(201).json(guest);
    } catch (err: any) {
      console.error('[ERROR] Failed to create guest:', err.message || String(err));
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: err.message || "Internal Server Error" });
      }
    }
  });

  app.get(api.guests.get.path, async (req, res) => {
    const guest = await storage.getGuest(Number(req.params.id));
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json(guest);
  });

  app.put(api.guests.update.path, async (req, res) => {
      try {
          const input = api.guests.update.input.parse(req.body);
          const guest = await storage.updateGuest(Number(req.params.id), input);
          if (!guest) return res.status(404).json({ message: "Guest not found" });
          res.json(guest);
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
          }
      }
  });

  app.delete(api.guests.delete.path, async (req, res) => {
    try {
      const user = getUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guestId = Number(req.params.id);
      const guest = await storage.getGuest(guestId);
      
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      await storage.deleteGuest(guestId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete guest error:', error);
      res.status(500).json({ message: "Failed to delete guest" });
    }
  });

  app.get(api.guests.lookup.path, async (req, res) => {
    const ref = req.query.ref as string;
    if (!ref) return res.status(400).json({ message: "Booking reference required" });
    
    const guest = await storage.getGuestByRef(ref);
    if (!guest) return res.status(404).json({ message: "Invitation not found" });
    
    // Enrich with available perks based on label
    let availablePerks: any[] = [];
    if (guest.label) {
        const labelPerks = await storage.getLabelPerks(guest.label.id);
        availablePerks = labelPerks
            .filter(lp => lp.isEnabled)
            .map(lp => ({
                ...lp.perk,
                isEnabled: lp.isEnabled,
                expenseHandledByClient: lp.expenseHandledByClient
            }));
    }
    
    // Enrich with family
    const family = await storage.getGuestFamily(guest.id);

    res.json({ ...guest, family, availablePerks });
  });

  // Guest Family
  app.get(api.guestFamily.list.path, async (req, res) => {
      const family = await storage.getGuestFamily(Number(req.params.guestId));
      res.json(family);
  });

  app.post(api.guestFamily.create.path, async (req, res) => {
      try {
          const input = api.guestFamily.create.input.parse(req.body);
          const member = await storage.createGuestFamily({ ...input, guestId: Number(req.params.guestId) });
          res.status(201).json(member);
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
          }
      }
  });

  // Requests
  app.get(api.requests.list.path, async (req, res) => {
      const requests = await storage.getRequests(Number(req.params.eventId));
      res.json(requests);
  });

  app.post(api.requests.create.path, async (req, res) => {
      try {
          const input = api.requests.create.input.parse(req.body);
          const request = await storage.createRequest({ ...input, guestId: Number(req.params.guestId) });
          res.status(201).json(request);
      } catch (err: any) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: err.message || "Failed to create guest" });
          }
      }
  });

  app.put(api.requests.update.path, async (req, res) => {
      try {
          const input = api.requests.update.input.parse(req.body);
          const request = await storage.updateRequest(Number(req.params.id), input);
          if (!request) return res.status(404).json({ message: "Request not found" });
          res.json(request);
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
          }
      }
  });
  
  // Seed itinerary events (for demo purposes)
  app.post("/api/events/:id/seed-itinerary", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Get event date
      const eventDate = new Date(event.date);
      const year = eventDate.getFullYear();
      const month = eventDate.getMonth();
      const day = eventDate.getDate();
      
      // Create sample itinerary events with some conflicts
      const sampleEvents = [
        {
          eventId,
          title: "Welcome Reception",
          description: "Meet fellow guests and enjoy cocktails",
          startTime: new Date(year, month, day, 18, 0), // 6:00 PM
          endTime: new Date(year, month, day, 19, 30), // 7:30 PM
          location: "Grand Ballroom",
          isMandatory: true,
          capacity: 150,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "Dinner Gala",
          description: "Formal dinner with live entertainment",
          startTime: new Date(year, month, day, 19, 0), // 7:00 PM
          endTime: new Date(year, month, day, 22, 0), // 10:00 PM
          location: "Crystal Hall",
          isMandatory: false,
          capacity: 120,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "Cocktail Lounge Experience",
          description: "Intimate cocktail tasting and mixology demo",
          startTime: new Date(year, month, day, 19, 30), // 7:30 PM - CONFLICTS with Dinner Gala
          endTime: new Date(year, month, day, 21, 0), // 9:00 PM
          location: "Sky Lounge",
          isMandatory: false,
          capacity: 30,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "Morning Yoga Session",
          description: "Start your day with guided meditation and yoga",
          startTime: new Date(year, month, day + 1, 7, 0), // Next day 7:00 AM
          endTime: new Date(year, month, day + 1, 8, 0), // 8:00 AM
          location: "Wellness Center",
          isMandatory: false,
          capacity: 25,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "Breakfast Buffet",
          description: "Continental and hot breakfast buffet",
          startTime: new Date(year, month, day + 1, 7, 30), // Next day 7:30 AM - CONFLICTS with Yoga
          endTime: new Date(year, month, day + 1, 9, 30), // 9:30 AM
          location: "Terrace Restaurant",
          isMandatory: true,
          capacity: 150,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "City Tour",
          description: "Guided tour of local attractions",
          startTime: new Date(year, month, day + 1, 10, 0), // 10:00 AM
          endTime: new Date(year, month, day + 1, 13, 0), // 1:00 PM
          location: "Hotel Lobby (Departure)",
          isMandatory: false,
          capacity: 40,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "Spa & Wellness Workshop",
          description: "Rejuvenating spa treatments and wellness talk",
          startTime: new Date(year, month, day + 1, 11, 0), // 11:00 AM - CONFLICTS with City Tour
          endTime: new Date(year, month, day + 1, 13, 30), // 1:30 PM
          location: "Spa Suite",
          isMandatory: false,
          capacity: 20,
          currentAttendees: 0,
        },
        {
          eventId,
          title: "Farewell Lunch",
          description: "Closing celebration with lunch service",
          startTime: new Date(year, month, day + 1, 13, 0), // 1:00 PM
          endTime: new Date(year, month, day + 1, 15, 0), // 3:00 PM
          location: "Garden Pavilion",
          isMandatory: true,
          capacity: 150,
          currentAttendees: 0,
        },
      ];
      
      await storage.seedItineraryEvents(sampleEvents);
      
      res.json({ 
        message: "Itinerary events seeded successfully",
        count: sampleEvents.length,
        conflicts: [
          "Dinner Gala (7:00-10:00 PM) overlaps with Cocktail Lounge (7:30-9:00 PM)",
          "Morning Yoga (7:00-8:00 AM) overlaps with Breakfast Buffet (7:30-9:30 AM)",
          "City Tour (10:00 AM-1:00 PM) overlaps with Spa Workshop (11:00 AM-1:30 PM)"
        ]
      });
    } catch (err: any) {
      console.error("Seed error:", err);
      res.status(500).json({ message: err.message || "Failed to seed itinerary" });
    }
  });
  
  // Seeding disabled - using Supabase with fresh database
  // You can create test data through the UI
  console.log("Database ready!");

  // Register guest portal routes
  app.use(guestRoutes);

  return httpServer;
}
