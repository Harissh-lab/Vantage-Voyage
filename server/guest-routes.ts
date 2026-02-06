/**
 * Guest Portal API Routes - Reference Implementation
 * 
 * These routes handle all guest-facing operations through token-based authentication.
 * Integrate these into your existing Express router.
 */

import { Router } from 'express';
import { db } from './db';
import { guests, guestFamily, itineraryEvents, guestItinerary, events, labels, labelPerks, perks, guestRequests } from '@shared/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const guestRoutes = Router();

/**
 * Helper: Find guest by access token
 */
async function getGuestByToken(token: string) {
  const [guest] = await db
    .select()
    .from(guests)
    .where(eq(guests.accessToken, token))
    .limit(1);
  
  if (!guest) {
    throw new Error('Invalid access token');
  }
  
  return guest;
}

/**
 * GET /api/guest/portal/:token
 * 
 * Main guest portal endpoint - returns all guest data including:
 * - Guest info
 * - Event details
 * - Label/tier
 * - Available perks
 * - Itinerary with registration status
 * - Family members
 */
guestRoutes.get('/api/guest/portal/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Get guest with relations
    const guest = await getGuestByToken(token);
    
    // Fetch event details
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, guest.eventId))
      .limit(1);
    
    // Fetch label
    const label = guest.labelId 
      ? (await db
          .select()
          .from(labels)
          .where(eq(labels.id, guest.labelId))
          .limit(1))[0]
      : null;
    
    // Fetch family members
    const family = await db
      .select()
      .from(guestFamily)
      .where(eq(guestFamily.guestId, guest.id));
    
    // Fetch available perks (filtered by label)
    const availablePerks = guest.labelId
      ? await db
          .select({
            id: labelPerks.id,
            labelId: labelPerks.labelId,
            perkId: labelPerks.perkId,
            isEnabled: labelPerks.isEnabled,
            expenseHandledByClient: labelPerks.expenseHandledByClient,
            perk: perks,
          })
          .from(labelPerks)
          .leftJoin(perks, eq(labelPerks.perkId, perks.id))
          .where(eq(labelPerks.labelId, guest.labelId))
      : [];
    
    // Fetch itinerary events with registration status
    const allEvents = await db
      .select()
      .from(itineraryEvents)
      .where(eq(itineraryEvents.eventId, guest.eventId));
    
    const guestRegistrations = await db
      .select()
      .from(guestItinerary)
      .where(eq(guestItinerary.guestId, guest.id));
    
    const registrationMap = new Map(
      guestRegistrations.map(r => [r.itineraryEventId, r.status])
    );
    
    const itinerary = allEvents.map(event => ({
      ...event,
      registered: registrationMap.has(event.id) && registrationMap.get(event.id) === 'attending',
      hasConflict: false, // TODO: Implement conflict detection
    }));
    
    // Return complete guest invitation
    res.json({
      ...guest,
      event,
      label,
      family,
      availablePerks: availablePerks.map((lp: any) => ({
        ...lp.perk,
        isEnabled: lp.isEnabled,
        expenseHandledByClient: lp.expenseHandledByClient,
      })),
      itinerary,
    });
    
  } catch (error) {
    console.error('Guest portal error:', error);
    res.status(404).json({ message: 'Invalid access token' });
  }
});

/**
 * PUT /api/guest/:token/rsvp
 * 
 * Update guest RSVP status and family members
 */
guestRoutes.put('/api/guest/:token/rsvp', async (req, res) => {
  try {
    const { token } = req.params;
    const { status, confirmedSeats, familyMembers } = req.body;
    
    const guest = await getGuestByToken(token);
    
    // If guest is declining, delete them from the system
    if (status === 'declined') {
      // Delete family members first
      await db
        .delete(guestFamily)
        .where(eq(guestFamily.guestId, guest.id));
      
      // Delete guest itinerary registrations
      await db
        .delete(guestItinerary)
        .where(eq(guestItinerary.guestId, guest.id));
      
      // Delete the guest
      await db
        .delete(guests)
        .where(eq(guests.id, guest.id));
      
      return res.json({ success: true, message: 'Your response has been recorded. You have been removed from the guest list.' });
    }
    
    // Validate seat allocation for confirmed guests
    if (confirmedSeats > guest.allocatedSeats) {
      return res.status(400).json({ 
        message: `Cannot confirm ${confirmedSeats} seats. Only ${guest.allocatedSeats} allocated.` 
      });
    }
    
    // Update guest status
    const [updatedGuest] = await db
      .update(guests)
      .set({
        status,
        confirmedSeats: status === 'confirmed' ? confirmedSeats : 0,
      })
      .where(eq(guests.id, guest.id))
      .returning();
    
    // Handle family members if confirming
    if (status === 'confirmed' && familyMembers?.length) {
      // Clear existing family members
      await db
        .delete(guestFamily)
        .where(eq(guestFamily.guestId, guest.id));
      
      // Add new family members
      for (const member of familyMembers) {
        await db.insert(guestFamily).values({
          guestId: guest.id,
          name: member.name,
          relationship: member.relationship,
          age: member.age,
        });
      }
    }
    
    res.json(updatedGuest);
    
  } catch (error) {
    console.error('RSVP update error:', error);
    res.status(400).json({ message: 'Failed to update RSVP' });
  }
});

/**
 * PUT /api/guest/:token/bleisure
 * 
 * Update bleisure date extensions
 */
guestRoutes.put('/api/guest/:token/bleisure', async (req, res) => {
  try {
    const { token } = req.params;
    const { extendedCheckIn, extendedCheckOut } = req.body;
    
    const guest = await getGuestByToken(token);
    
    // Validate dates
    if (extendedCheckIn && guest.hostCoveredCheckIn) {
      const extended = new Date(extendedCheckIn);
      const hostStart = new Date(guest.hostCoveredCheckIn);
      
      if (extended >= hostStart) {
        return res.status(400).json({ 
          message: 'Extended check-in must be before host-covered dates' 
        });
      }
    }
    
    if (extendedCheckOut && guest.hostCoveredCheckOut) {
      const extended = new Date(extendedCheckOut);
      const hostEnd = new Date(guest.hostCoveredCheckOut);
      
      if (extended <= hostEnd) {
        return res.status(400).json({ 
          message: 'Extended check-out must be after host-covered dates' 
        });
      }
    }
    
    // Update dates
    const [updatedGuest] = await db
      .update(guests)
      .set({
        extendedCheckIn: extendedCheckIn ? new Date(extendedCheckIn) : null,
        extendedCheckOut: extendedCheckOut ? new Date(extendedCheckOut) : null,
      })
      .where(eq(guests.id, guest.id))
      .returning();
    
    res.json(updatedGuest);
    
  } catch (error) {
    console.error('Bleisure update error:', error);
    res.status(400).json({ message: 'Failed to update dates' });
  }
});

/**
 * POST /api/guest/:token/upload-id
 * 
 * Upload and verify ID document
 */
guestRoutes.post('/api/guest/:token/upload-id', async (req, res) => {
  try {
    const { token } = req.params;
    const { documentUrl, verifiedName } = req.body;
    
    const guest = await getGuestByToken(token);
    
    // Verify name match (case-insensitive)
    const nameMatch = verifiedName.toLowerCase().trim() === guest.name.toLowerCase().trim();
    
    const verificationStatus = nameMatch ? 'verified' : 'failed';
    
    // Update guest with ID info
    const [updatedGuest] = await db
      .update(guests)
      .set({
        idDocumentUrl: documentUrl,
        idVerifiedName: verifiedName,
        idVerificationStatus: verificationStatus,
      })
      .where(eq(guests.id, guest.id))
      .returning();
    
    res.json({
      success: nameMatch,
      message: nameMatch 
        ? 'ID verified successfully' 
        : 'Name mismatch - verification failed',
    });
    
  } catch (error) {
    console.error('ID upload error:', error);
    res.status(400).json({ message: 'Failed to upload ID' });
  }
});

/**
 * PUT /api/guest/:token/self-manage
 * 
 * Toggle self-management preferences
 */
guestRoutes.put('/api/guest/:token/self-manage', async (req, res) => {
  try {
    const { token } = req.params;
    const { selfManageFlights, selfManageHotel } = req.body;
    
    const guest = await getGuestByToken(token);
    
    const updates: any = {};
    if (typeof selfManageFlights === 'boolean') {
      updates.selfManageFlights = selfManageFlights;
    }
    if (typeof selfManageHotel === 'boolean') {
      updates.selfManageHotel = selfManageHotel;
    }
    
    const [updatedGuest] = await db
      .update(guests)
      .set(updates)
      .where(eq(guests.id, guest.id))
      .returning();
    
    // TODO: Update logistics counts (shuttles, room blocks, etc.)
    
    res.json(updatedGuest);
    
  } catch (error) {
    console.error('Self-manage update error:', error);
    res.status(400).json({ message: 'Failed to update preferences' });
  }
});

/**
 * POST /api/guest/:token/waitlist
 * 
 * Join hotel waitlist
 */
guestRoutes.post('/api/guest/:token/waitlist', async (req, res) => {
  try {
    const { token } = req.params;
    const guest = await getGuestByToken(token);
    
    // Determine priority based on label
    let priority = 3; // Default (General)
    if (guest.labelId) {
      const [label] = await db
        .select()
        .from(labels)
        .where(eq(labels.id, guest.labelId))
        .limit(1);
      
      if (label?.name.toLowerCase().includes('vip')) {
        priority = 1;
      } else if (label?.name.toLowerCase().includes('family')) {
        priority = 2;
      }
    }
    
    // Add to waitlist
    const [updatedGuest] = await db
      .update(guests)
      .set({
        isOnWaitlist: true,
        waitlistPriority: priority,
      })
      .where(eq(guests.id, guest.id))
      .returning();
    
    // Calculate position in queue
    const higherPriorityCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(
        and(
          eq(guests.eventId, guest.eventId),
          eq(guests.isOnWaitlist, true),
          lt(guests.waitlistPriority, priority)
        )
      );
    
    const samePriorityCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(
        and(
          eq(guests.eventId, guest.eventId),
          eq(guests.isOnWaitlist, true),
          eq(guests.waitlistPriority, priority),
          lt(guests.id, guest.id)
        )
      );
    
    const position = (higherPriorityCount[0]?.count || 0) + (samePriorityCount[0]?.count || 0) + 1;
    
    res.json({
      success: true,
      position,
    });
    
  } catch (error) {
    console.error('Waitlist join error:', error);
    res.status(400).json({ message: 'Failed to join waitlist' });
  }
});

/**
 * POST /api/guest/:token/itinerary/:eventId/register
 * 
 * Register for an itinerary event
 */
guestRoutes.post('/api/guest/:token/itinerary/:eventId/register', async (req, res) => {
  try {
    const { token, eventId } = req.params;
    const guest = await getGuestByToken(token);
    
    // Get event details
    const [event] = await db
      .select()
      .from(itineraryEvents)
      .where(eq(itineraryEvents.id, parseInt(eventId)))
      .limit(1);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check capacity
    if (event.capacity && (event.currentAttendees ?? 0) >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }
    
    // TODO: Check for time conflicts with other registered events
    
    // Register guest
    await db.insert(guestItinerary).values({
      guestId: guest.id,
      itineraryEventId: event.id,
      status: 'attending',
    });
    
    // Update attendee count
    await db
      .update(itineraryEvents)
      .set({
        currentAttendees: (event.currentAttendees ?? 0) + 1,
      })
      .where(eq(itineraryEvents.id, event.id));
    
    res.json({
      success: true,
      conflicts: [], // TODO: Return actual conflicts if any
    });
    
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(400).json({ message: 'Failed to register for event' });
  }
});

/**
 * DELETE /api/guest/:token/itinerary/:eventId/unregister
 * 
 * Unregister from an itinerary event
 */
guestRoutes.delete('/api/guest/:token/itinerary/:eventId/unregister', async (req, res) => {
  try {
    const { token, eventId } = req.params;
    const guest = await getGuestByToken(token);
    
    // Remove registration
    await db
      .delete(guestItinerary)
      .where(
        and(
          eq(guestItinerary.guestId, guest.id),
          eq(guestItinerary.itineraryEventId, parseInt(eventId))
        )
      );
    
    // Update attendee count
    const [event] = await db
      .select()
      .from(itineraryEvents)
      .where(eq(itineraryEvents.id, parseInt(eventId)))
      .limit(1);
    
    if (event && (event.currentAttendees ?? 0) > 0) {
      await db
        .update(itineraryEvents)
        .set({
          currentAttendees: (event.currentAttendees ?? 0) - 1,
        })
        .where(eq(itineraryEvents.id, event.id));
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(400).json({ message: 'Failed to unregister from event' });
  }
});

/**
 * Helper function to generate guest link
 * Use this when creating new guests
 */
export async function createGuestWithLink(eventId: number, guestData: any) {
  const accessToken = randomUUID();
  const bookingRef = generateBookingRef(); // Implement your own logic
  
  const [guest] = await db
    .insert(guests)
    .values({
      ...guestData,
      eventId,
      accessToken,
      bookingRef,
    })
    .returning();
  
  const guestLink = `${process.env.APP_URL}/guest/${accessToken}`;
  
  // TODO: Send email with link
  await sendGuestInvitationEmail(guest.email, {
    guestName: guest.name,
    guestLink,
    bookingRef,
  });
  
  return {
    ...guest,
    guestLink,
  };
}

/**
 * Generate unique booking reference
 */
function generateBookingRef(): string {
  const prefix = 'BOOK';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

/**
 * Send guest invitation email
 * Integrate with your email service (SendGrid, Resend, etc.)
 */
async function sendGuestInvitationEmail(email: string, data: any) {
  // TODO: Implement with your email service
  console.log('Sending invitation email to:', email);
  console.log('Guest link:', data.guestLink);
}

/**
 * POST /api/guest/:token/request
 * 
 * Submit a guest request (room upgrade, etc.)
 */
guestRoutes.post('/api/guest/:token/request', async (req, res) => {
  try {
    const { token } = req.params;
    const { type, notes } = req.body;
    
    // Validate guest
    const guest = await getGuestByToken(token);
    
    // Create request
    const [request] = await db
      .insert(guestRequests)
      .values({
        guestId: guest.id,
        type: type || 'room_upgrade',
        notes,
        status: 'pending'
      })
      .returning();
    
    res.status(201).json(request);
  } catch (error: any) {
    console.error('Guest request error:', error);
    res.status(400).json({ message: error.message || 'Failed to submit request' });
  }
});

export default guestRoutes;
