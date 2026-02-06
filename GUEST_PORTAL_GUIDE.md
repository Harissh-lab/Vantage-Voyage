# Guest Portal Guide

## Overview

The GatherPath Guest Portal provides a comprehensive, secure platform for event guests to manage their entire event experience through a unique access link. Each guest receives a personalized token-based URL that grants access to their invitation and all related features.

## Architecture

### Access System

**Token-Based Authentication**: Each guest is assigned a unique `accessToken` upon creation. This token is used in the URL (`/guest/:token`) to provide secure, password-free access to the guest portal.

**Booking Reference**: A human-readable code (e.g., `BOOK-1234`) used for initial lookup and support communication.

### Database Schema Updates

New tables and fields added to support guest portal features:

#### Guests Table Extensions
```typescript
guests {
  // Access & Authentication
  accessToken: string (unique, auto-generated)
  bookingRef: string (unique, guest-facing)
  
  // Seat Allocation
  allocatedSeats: number (default: 1)
  confirmedSeats: number (default: 1)
  
  // Bleisure Dates
  hostCoveredCheckIn: timestamp
  hostCoveredCheckOut: timestamp
  extendedCheckIn: timestamp (self-paid extension)
  extendedCheckOut: timestamp (self-paid extension)
  
  // ID Verification
  idDocumentUrl: string
  idVerificationStatus: string (pending/verified/failed)
  idVerifiedName: string
  
  // Self-Management
  selfManageFlights: boolean
  selfManageHotel: boolean
  
  // Waitlist
  isOnWaitlist: boolean
  waitlistPriority: number (1=VIP, 2=Family, 3=General)
}
```

#### New Tables

**itineraryEvents**: Core events and optional add-on activities
```typescript
{
  eventId: number
  perkId: number (optional - if tied to a perk)
  title: string
  description: string
  startTime: timestamp
  endTime: timestamp
  location: string
  isMandatory: boolean
  capacity: number
  currentAttendees: number
}
```

**guestItinerary**: Guest registrations for events
```typescript
{
  guestId: number
  itineraryEventId: number
  status: string (attending/declined/waitlist)
}
```

## Core Features

### 1. Smart RSVP & Nomination

**Component**: `GuestRSVP.tsx`

**Features**:
- Pre-allocated seat display ("Reserved for Sarah + 1")
- Dynamic family member addition with seat cap enforcement
- Relationship tracking (spouse, child, etc.)
- Age capture for children
- Real-time seat count validation

**API Endpoints**:
- `PUT /api/guest/:token/rsvp`

**Example Usage**:
```typescript
await updateRSVP.mutateAsync({
  status: 'confirmed',
  confirmedSeats: 3,
  familyMembers: [
    { name: "John Doe", relationship: "Spouse" },
    { name: "Jane Doe", relationship: "Child", age: 8 }
  ]
});
```

### 2. Bleisure Calendar Selector

**Component**: `GuestBleisure.tsx`

**Features**:
- Visual calendar with dual date selection
- Host-covered dates highlighted in primary color
- Self-paid extensions highlighted in accent color
- Automatic cost calculation based on TBO retail rates
- Real-time price display

**API Endpoints**:
- `PUT /api/guest/:token/bleisure`

**Pricing Logic**:
```typescript
extraNightsBefore = days between extendedCheckIn and hostCoveredCheckIn
extraNightsAfter = days between hostCoveredCheckOut and extendedCheckOut
totalCost = (extraNightsBefore + extraNightsAfter) × retailRatePerNight
```

### 3. Conflict-Aware Itinerary

**Component**: `GuestItinerary.tsx`

**Features**:
- Time-based conflict detection
- Mandatory vs. optional event distinction
- Capacity tracking and "Full" status
- Real-time schedule updates
- Visual event grouping by day
- Icon-based event categorization

**Conflict Detection Algorithm**:
```typescript
function hasConflict(eventToCheck) {
  return registeredEvents.some(event => {
    return (
      (eventStart >= event.start && eventStart < event.end) ||
      (eventEnd > event.start && eventEnd <= event.end) ||
      (eventStart <= event.start && eventEnd >= event.end)
    );
  });
}
```

**API Endpoints**:
- `POST /api/guest/:token/itinerary/:eventId/register`
- `DELETE /api/guest/:token/itinerary/:eventId/unregister`

### 4. Waitlist Bell

**Component**: `WaitlistBell.tsx`

**Features**:
- Priority-based queue system (VIP → Family → General)
- Animated bell icon for visual appeal
- Automatic room swap notification system
- Real-time position tracking

**Priority Calculation**:
```typescript
VIP guests (label contains "VIP") = Priority 1
Family guests (label contains "Family") = Priority 2
General guests = Priority 3
```

**API Endpoints**:
- `POST /api/guest/:token/waitlist`

### 5. ID Vault with OCR

**Component**: `GuestIDVault.tsx`

**Features**:
- Multi-input support (camera capture or file upload)
- Image preview with validation
- OCR name extraction (simulated - integrate Tesseract.js or Google Vision)
- Name matching verification against booking
- Status tracking (pending/verified/failed)

**OCR Integration Points**:
```typescript
// Replace simulation with actual OCR service
async function performOCR(imageData: string) {
  // Option 1: Tesseract.js (client-side)
  const result = await Tesseract.recognize(imageData);
  return extractNameFromOCR(result.data.text);
  
  // Option 2: Backend API (recommended for production)
  const response = await fetch('/api/ocr/extract', {
    method: 'POST',
    body: JSON.stringify({ image: imageData })
  });
  return response.json();
}
```

**API Endpoints**:
- `POST /api/guest/:token/upload-id`

### 6. Self-Management Toggle

**Component**: `GuestDashboard.tsx` (integrated)

**Features**:
- Independent flight and hotel toggles
- Automatic logistics count adjustment
- Real-time preference updates
- Clear impact messaging

**Impact**:
- When `selfManageFlights = true`: Guest removed from shuttle counts, flight manifests
- When `selfManageHotel = true`: Guest removed from room blocks, but kept on event list

**API Endpoints**:
- `PUT /api/guest/:token/self-manage`

### 7. Unified Guest Dashboard

**Component**: `GuestDashboard.tsx`

**Features**:
- Progress tracking (RSVP → Bleisure → Itinerary → ID Vault)
- Quick action cards for all features
- Travel details summary
- Self-management controls
- Upcoming events preview
- Integrated waitlist status

**Progress Calculation**:
```typescript
const completionPercentage = 
  (rsvpComplete ? 25 : 0) +
  (bleisureSet ? 25 : 0) +
  (hasItinerarySelections ? 25 : 0) +
  (idVerified ? 25 : 0);
```

## Guest Portal Hooks

### `use-guest-portal.ts`

All guest-facing operations use this centralized hook library:

```typescript
// Access portal with token
useGuestPortal(token: string)

// Update RSVP
useUpdateRSVP(token: string)

// Manage bleisure dates
useUpdateBleisure(token: string)

// Upload ID
useUploadID(token: string)

// Toggle self-management
useToggleSelfManagement(token: string)

// Join waitlist
useJoinWaitlist(token: string)

// Register for events
useRegisterForEvent(token: string)
useUnregisterFromEvent(token: string)
```

## Security Considerations

### Token Security
- Tokens are cryptographically secure (UUID v4 recommended)
- Tokens are unique per guest and never reused
- No password required (passwordless authentication)
- Tokens should be transmitted over HTTPS only

### Data Privacy
- Guest data is isolated by token
- No cross-guest data exposure
- ID documents should be encrypted at rest
- Implement rate limiting on all endpoints

## Implementation Checklist

### Backend Implementation Required

1. **Token Generation**: Generate unique access tokens on guest creation
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   const accessToken = uuidv4();
   ```

2. **Guest Link Generation**: Create shareable links for agents
   ```typescript
   const guestLink = `${process.env.APP_URL}/guest/${guest.accessToken}`;
   ```

3. **Email Distribution**: Send guest links via email
   ```typescript
   await sendEmail({
     to: guest.email,
     subject: `Your invitation to ${event.name}`,
     body: `Access your invitation: ${guestLink}`
   });
   ```

4. **OCR Integration**: Integrate with OCR service (Tesseract.js, Google Vision, AWS Textract)

5. **File Storage**: Set up document storage (AWS S3, Cloudinary, Supabase Storage)

6. **Waitlist Processing**: Implement background job to process waitlist when rooms open

7. **Conflict Detection**: Server-side validation for itinerary conflicts

### Frontend Routing

Add routes to your main routing configuration:

```typescript
// In your router setup
<Route path="/guest/:token" component={GuestDashboard} />
<Route path="/guest/:token/rsvp" component={GuestRSVP} />
<Route path="/guest/:token/bleisure" component={GuestBleisure} />
<Route path="/guest/:token/itinerary" component={GuestItinerary} />
<Route path="/guest/:token/id-vault" component={GuestIDVault} />
```

## Testing

### Test Scenarios

1. **Token Access**
   - Valid token shows dashboard
   - Invalid token shows error
   - Expired token (if implementing expiration)

2. **RSVP Flow**
   - Confirm with full seats
   - Confirm with partial seats
   - Decline invitation
   - Exceed seat allocation (should fail)

3. **Bleisure**
   - Extend before host dates
   - Extend after host dates
   - Extend both before and after
   - Calculate costs correctly

4. **Itinerary Conflicts**
   - Register for non-conflicting events
   - Attempt to register for conflicting events (should fail)
   - Unregister and re-register
   - Reach capacity (should show "Full")

5. **Waitlist**
   - Join waitlist
   - Priority ordering (VIP before Family before General)
   - Auto-swap when room opens

6. **ID Vault**
   - Upload valid document
   - Match name correctly
   - Reject mismatched name
   - Show verification status

7. **Self-Management**
   - Toggle flights on/off
   - Toggle hotel on/off
   - Verify logistics count changes

## Future Enhancements

1. **Real-time Notifications**: WebSocket/SSR for instant waitlist updates
2. **Multi-language Support**: i18n for international guests
3. **Mobile App**: Native iOS/Android apps
4. **QR Code Check-in**: Generate QR codes from booking refs
5. **Chat Support**: Integrated live chat with concierge
6. **Payment Integration**: Process bleisure extensions via Stripe
7. **Calendar Syncing**: Export itinerary to Google/Apple Calendar
8. **Social Features**: See which friends are attending (with privacy controls)

## Support

For technical questions or implementation help, refer to:
- Schema documentation in `shared/schema.ts`
- API routes in `shared/routes.ts`
- Component implementations in `client/src/pages/guest/`

---

**Last Updated**: February 2026
**Version**: 1.0.0
