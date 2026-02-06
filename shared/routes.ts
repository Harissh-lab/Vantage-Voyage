import { z } from 'zod';
import { 
  insertEventSchema, 
  insertLabelSchema, 
  insertPerkSchema, 
  insertLabelPerkSchema, 
  insertGuestSchema, 
  insertGuestFamilySchema, 
  insertGuestRequestSchema,
  insertItineraryEventSchema,
  insertGuestItinerarySchema,
  events,
  labels,
  perks,
  labelPerks,
  guests,
  guestFamily,
  guestRequests,
  itineraryEvents,
  guestItinerary,
  type GuestInvitation
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/events/:id',
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/events/:id',
      input: insertEventSchema.partial(),
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  labels: {
    list: { // List labels for an event
      method: 'GET' as const,
      path: '/api/events/:eventId/labels',
      responses: {
        200: z.array(z.custom<typeof labels.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events/:eventId/labels',
      input: insertLabelSchema.omit({ eventId: true }),
      responses: {
        201: z.custom<typeof labels.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
        method: 'PUT' as const,
        path: '/api/labels/:id',
        input: insertLabelSchema.partial(),
        responses: {
            200: z.custom<typeof labels.$inferSelect>(),
            404: errorSchemas.notFound
        }
    }
  },
  perks: {
    list: { // List perks for an event
      method: 'GET' as const,
      path: '/api/events/:eventId/perks',
      responses: {
        200: z.array(z.custom<typeof perks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events/:eventId/perks',
      input: insertPerkSchema.omit({ eventId: true }),
      responses: {
        201: z.custom<typeof perks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
        method: 'PUT' as const,
        path: '/api/perks/:id',
        input: insertPerkSchema.partial(),
        responses: {
            200: z.custom<typeof perks.$inferSelect>(),
            404: errorSchemas.notFound
        }
    }
  },
  labelPerks: {
    update: { // Update specific label-perk configuration
      method: 'PUT' as const,
      path: '/api/labels/:labelId/perks/:perkId',
      input: insertLabelPerkSchema.omit({ labelId: true, perkId: true }),
      responses: {
        200: z.custom<typeof labelPerks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/labels/:labelId/perks',
        responses: {
            200: z.array(z.custom<typeof labelPerks.$inferSelect & { perk: typeof perks.$inferSelect }>())
        }
    }
  },
  guests: {
    list: { // List guests for an event
      method: 'GET' as const,
      path: '/api/events/:eventId/guests',
      responses: {
        200: z.array(z.custom<typeof guests.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events/:eventId/guests',
      input: insertGuestSchema.omit({ eventId: true }),
      responses: {
        201: z.custom<typeof guests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/guests/:id',
      responses: {
        200: z.custom<typeof guests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
        method: 'PUT' as const,
        path: '/api/guests/:id',
        input: insertGuestSchema.partial(),
        responses: {
            200: z.custom<typeof guests.$inferSelect>(),
            404: errorSchemas.notFound
        }
    },
    delete: {
        method: 'DELETE' as const,
        path: '/api/guests/:id',
        responses: {
            200: z.object({ success: z.boolean() }),
            404: errorSchemas.notFound
        }
    },
    lookup: {
        method: 'GET' as const,
        path: '/api/guests/lookup',
        input: z.object({ ref: z.string() }),
        responses: {
            200: z.custom<typeof guests.$inferSelect & { event: typeof events.$inferSelect, label: typeof labels.$inferSelect }>(),
            404: errorSchemas.notFound
        }
    },
    // Guest portal access with token
    portal: {
        method: 'GET' as const,
        path: '/api/guest/portal/:token',
        responses: {
            200: z.custom<GuestInvitation>(),
            404: errorSchemas.notFound,
            401: z.object({ message: z.string() })
        }
    },
    updateRSVP: {
        method: 'PUT' as const,
        path: '/api/guest/:token/rsvp',
        input: z.object({
            status: z.enum(['confirmed', 'declined']),
            confirmedSeats: z.number().optional(),
            familyMembers: z.array(z.object({
                name: z.string(),
                relationship: z.string(),
                age: z.number().optional()
            })).optional()
        }),
        responses: {
            200: z.custom<typeof guests.$inferSelect>(),
            400: errorSchemas.validation,
            404: errorSchemas.notFound
        }
    },
    updateBleisure: {
        method: 'PUT' as const,
        path: '/api/guest/:token/bleisure',
        input: z.object({
            extendedCheckIn: z.coerce.date().optional(),
            extendedCheckOut: z.coerce.date().optional()
        }),
        responses: {
            200: z.custom<typeof guests.$inferSelect>(),
            400: errorSchemas.validation
        }
    },
    uploadID: {
        method: 'POST' as const,
        path: '/api/guest/:token/upload-id',
        input: z.object({
            documentUrl: z.string(),
            verifiedName: z.string()
        }),
        responses: {
            200: z.object({ success: z.boolean(), message: z.string() }),
            400: errorSchemas.validation
        }
    },
    toggleSelfManagement: {
        method: 'PUT' as const,
        path: '/api/guest/:token/self-manage',
        input: z.object({
            selfManageFlights: z.boolean().optional(),
            selfManageHotel: z.boolean().optional()
        }),
        responses: {
            200: z.custom<typeof guests.$inferSelect>(),
            400: errorSchemas.validation
        }
    },
    joinWaitlist: {
        method: 'POST' as const,
        path: '/api/guest/:token/waitlist',
        responses: {
            200: z.object({ success: z.boolean(), position: z.number() }),
            400: errorSchemas.validation
        }
    },
    submitRequest: {
        method: 'POST' as const,
        path: '/api/guest/:token/request',
        input: z.object({
            type: z.string(),
            notes: z.string().optional()
        }),
        responses: {
            201: z.custom<typeof guestRequests.$inferSelect>(),
            400: errorSchemas.validation
        }
    }
  },
  guestFamily: {
    list: {
        method: 'GET' as const,
        path: '/api/guests/:guestId/family',
        responses: {
            200: z.array(z.custom<typeof guestFamily.$inferSelect>())
        }
    },
    create: {
        method: 'POST' as const,
        path: '/api/guests/:guestId/family',
        input: insertGuestFamilySchema.omit({ guestId: true }),
        responses: {
            201: z.custom<typeof guestFamily.$inferSelect>(),
            400: errorSchemas.validation
        }
    }
  },
  requests: {
      list: { // Agent view
          method: 'GET' as const,
          path: '/api/events/:eventId/requests',
          responses: {
              200: z.array(z.custom<typeof guestRequests.$inferSelect & { guest: typeof guests.$inferSelect, perk: typeof perks.$inferSelect }>())
          }
      },
      create: { // Guest view
          method: 'POST' as const,
          path: '/api/guests/:guestId/requests',
          input: insertGuestRequestSchema.omit({ guestId: true }),
          responses: {
              201: z.custom<typeof guestRequests.$inferSelect>(),
              400: errorSchemas.validation
          }
      },
      update: { // Agent approve/reject
          method: 'PUT' as const,
          path: '/api/requests/:id',
          input: z.object({ status: z.enum(['approved', 'rejected', 'forwarded_to_client']), notes: z.string().optional() }),
          responses: {
              200: z.custom<typeof guestRequests.$inferSelect>(),
              404: errorSchemas.notFound
          }
      }
  },
  itinerary: {
      list: { // Get all itinerary events for an event
          method: 'GET' as const,
          path: '/api/events/:eventId/itinerary',
          responses: {
              200: z.array(z.custom<typeof itineraryEvents.$inferSelect>())
          }
      },
      create: {
          method: 'POST' as const,
          path: '/api/events/:eventId/itinerary',
          input: insertItineraryEventSchema.omit({ eventId: true }),
          responses: {
              201: z.custom<typeof itineraryEvents.$inferSelect>(),
              400: errorSchemas.validation
          }
      },
      register: { // Guest registers for an itinerary event
          method: 'POST' as const,
          path: '/api/guest/:token/itinerary/:eventId/register',
          responses: {
              200: z.object({ success: z.boolean(), conflicts: z.array(z.string()).optional() }),
              400: errorSchemas.validation
          }
      },
      unregister: {
          method: 'DELETE' as const,
          path: '/api/guest/:token/itinerary/:eventId/unregister',
          responses: {
              200: z.object({ success: z.boolean() })
          }
      }
  }
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type EventInput = z.infer<typeof api.events.create.input>;
export type GuestInput = z.infer<typeof api.guests.create.input>;
export type LabelInput = z.infer<typeof api.labels.create.input>;
export type PerkInput = z.infer<typeof api.perks.create.input>;
export type LabelPerkUpdateInput = z.infer<typeof api.labelPerks.update.input>;
export type RequestInput = z.infer<typeof api.requests.create.input>;
