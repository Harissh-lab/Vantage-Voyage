import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { insertEventSchema, insertGuestSchema, insertLabelSchema, insertPerkSchema, insertLabelPerkSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Events
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post(api.events.create.path, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
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
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
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
    const guests = await storage.getGuests(Number(req.params.eventId));
    res.json(guests);
  });

  app.post(api.guests.create.path, async (req, res) => {
    try {
      const input = api.guests.create.input.parse(req.body);
      const guest = await storage.createGuest({ ...input, eventId: Number(req.params.eventId) });
      res.status(201).json(guest);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
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
      } catch (err) {
          if (err instanceof z.ZodError) {
              res.status(400).json({ message: err.errors[0].message });
          } else {
              res.status(500).json({ message: "Internal Server Error" });
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
  
  // Seed Data (Basic check if empty)
  const existingEvents = await storage.getEvents();
  if (existingEvents.length === 0) {
      console.log("Seeding database...");
      const event = await storage.createEvent({
          name: "Smith & Jones Wedding",
          date: new Date("2024-08-15"),
          location: "Grand Hotel, Amalfi Coast",
          description: "A beautiful celebration of love.",
          agentId: null, // Would be user ID
          clientId: null // Would be user ID
      });

      const vipLabel = await storage.createLabel({ eventId: event.id, name: "VIP", description: "Close family and friends" });
      const friendLabel = await storage.createLabel({ eventId: event.id, name: "Friend", description: "Friends of the couple" });

      const transport = await storage.createPerk({ eventId: event.id, name: "Airport Pickup", description: "Private car from NAP airport", type: "transport" });
      const spa = await storage.createPerk({ eventId: event.id, name: "Spa Access", description: "Full access to hotel spa", type: "activity" });

      // VIP gets both, client pays
      await storage.updateLabelPerk(vipLabel.id, transport.id, { isEnabled: true, expenseHandledByClient: true });
      await storage.updateLabelPerk(vipLabel.id, spa.id, { isEnabled: true, expenseHandledByClient: true });

      // Friend gets transport (client pays), Spa (they pay)
      await storage.updateLabelPerk(friendLabel.id, transport.id, { isEnabled: true, expenseHandledByClient: true });
      await storage.updateLabelPerk(friendLabel.id, spa.id, { isEnabled: true, expenseHandledByClient: false });

      await storage.createGuest({
          eventId: event.id,
          labelId: vipLabel.id,
          name: "Alice Smith",
          email: "alice@example.com",
          bookingRef: "SMITH24",
          status: "confirmed",
          arrivalDate: new Date("2024-08-14"),
          departureDate: new Date("2024-08-16"),
          travelMode: "Flight"
      });
      console.log("Database seeded!");
  }

  return httpServer;
}
