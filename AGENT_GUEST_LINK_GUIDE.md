# Agent Guide: Managing Guest Links

## Overview

This guide explains how agents can generate, manage, and share secure access links with event guests. Each guest receives a unique, token-based URL that provides complete access to their personalized event portal.

## Guest Link System

### How It Works

1. **Guest Creation**: When you add a guest to an event, the system automatically generates:
   - **Booking Reference**: Human-readable code (e.g., `BOOK-1234`)
   - **Access Token**: Secure UUID for portal access (e.g., `a7b3c9d2-e4f5-6789-abcd-ef0123456789`)

2. **Link Format**: 
   ```
   https://gatherpath.com/guest/[ACCESS_TOKEN]
   ```

3. **Security**: The access token is unique per guest and provides passwordless access to their portal.

## Creating and Sharing Guest Links

### Step 1: Add Guest to Event

In the Event Setup or Guest Management page:

1. Navigate to your event
2. Click "Add Guest" or "Import Guests"
3. Fill in guest information:
   - Name
   - Email
   - Assigned Label (VIP, Family, Friend, etc.)
   - Allocated Seats (default: 1)

### Step 2: Generate Link

The system automatically generates the access link upon guest creation. You can:

1. **Copy Link**: Click the "Copy Link" button next to the guest name
2. **View Link**: Find it in the guest details panel
3. **Regenerate**: If needed, regenerate a new token for security

### Step 3: Share with Guest

#### Option A: Automated Email (Recommended)

The system can automatically send invitation emails:

```typescript
// This happens automatically when you create a guest
Email Content:
---
Subject: Your invitation to [Event Name]

Dear [Guest Name],

You're invited to [Event Name]!

Access your personalized invitation portal:
[Guest Portal Link]

Your booking reference: [BOOK-1234]

Please complete the following:
✓ Confirm your RSVP
✓ Select your travel dates
✓ Choose your add-on activities
✓ Upload your ID for verification

We look forward to seeing you!
---
```

#### Option B: Manual Sharing

1. Copy the guest link
2. Send via your preferred channel (email, SMS, WhatsApp, etc.)
3. Include the booking reference for support purposes

## Guest Portal Features Accessible via Link

Once guests access their unique link, they can:

### 1. **Smart RSVP** (`/guest/:token/rsvp`)
- View pre-allocated seats
- Confirm or decline attendance
- Add family members/plus-ones (up to allocation)
- Edit names and relationships

### 2. **Bleisure Dates** (`/guest/:token/bleisure`)
- View host-covered accommodation dates
- Extend stay with self-paid nights
- See real-time pricing for extensions
- Confirm final dates

### 3. **Itinerary Management** (`/guest/:token/itinerary`)
- View core events (mandatory)
- Select optional add-ons
- Automatic conflict detection
- Capacity-aware registration

### 4. **Waitlist** (from dashboard)
- Join waitlist if primary hotel is full
- Priority-based queue (VIP → Family → General)
- Automatic notification when room opens

### 5. **ID Vault** (`/guest/:token/id-vault`)
- Upload passport or ID
- OCR-powered name verification
- Ensure flight manifest accuracy

### 6. **Self-Management** (from dashboard)
- Opt-out of group flights
- Opt-out of room blocks
- Automatically removed from logistics counts

## Managing Guest Links

### View All Guest Links

#### From Event Dashboard

1. Go to Event Details
2. Navigate to "Guest List" tab
3. Each guest row shows:
   - Name and email
   - Booking reference
   - Status (Pending/Confirmed/Declined)
   - Link actions (Copy, View, Email)

#### Bulk Operations

```typescript
// Export all guest links
const allLinks = guests.map(g => ({
  name: g.name,
  email: g.email,
  bookingRef: g.bookingRef,
  link: `${appUrl}/guest/${g.accessToken}`
}));

// Download as CSV
downloadCSV(allLinks, 'guest-links.csv');
```

### Resend Invitation

If a guest loses their link:

1. Find the guest in the guest list
2. Click "Resend Invitation"
3. Email automatically sent with fresh link

### Regenerate Token (Security)

If you need to invalidate an old link:

1. Select guest
2. Click "Regenerate Access Token"
3. Old link becomes invalid
4. New link generated and emailed

**⚠️ Warning**: This will invalidate the old link immediately!

## Monitoring Guest Progress

### Dashboard View

Track guest completion status:

```
Guest Name        | Status    | RSVP | Dates | Events | ID  | Link Action
------------------|-----------|------|-------|--------|-----|------------
Sarah Johnson     | Confirmed | ✓    | ✓     | ✓      | ✓   | [Copy Link]
Michael Chen      | Pending   | ✓    | ✗     | ✗      | ✗   | [Resend]
Emily Rodriguez   | Confirmed | ✓    | ✓     | ✓      | ⏳   | [Copy Link]
```

Legend:
- ✓ = Completed
- ✗ = Not started
- ⏳ = In progress

### Progress Indicators

Each guest has a completion percentage:
- RSVP: 25%
- Bleisure Dates: 25%
- Itinerary Selection: 25%
- ID Verification: 25%

**Total: 100%** when all steps complete

## Link Distribution Best Practices

### Timing

1. **Initial Invitation**: Send 6-8 weeks before event
2. **First Reminder**: 4 weeks before (for non-responders)
3. **Final Reminder**: 2 weeks before event
4. **Last Call**: 1 week before (urgent)

### Email Templates

#### Initial Invitation
```
Subject: 🎉 You're invited to [Event Name]!

Hi [Name],

We're thrilled to invite you to [Event Name]!

📅 Date: [Event Date]
📍 Location: [Event Location]

Click here to access your personalized portal:
[Guest Link]

Your booking reference: [Ref Code]

Please RSVP by [Deadline Date]

See you there!
[Agent Name]
```

#### Reminder (Incomplete Actions)
```
Subject: ⏰ Action needed for [Event Name]

Hi [Name],

We noticed you haven't completed your event setup:

Pending actions:
☐ Confirm RSVP
☐ Select travel dates
☐ Upload ID verification

Complete now: [Guest Link]

Questions? Reply to this email!

[Agent Name]
```

#### Final Confirmation
```
Subject: ✅ You're all set for [Event Name]!

Hi [Name],

Great news! Your event portal is 100% complete:

✓ RSVP confirmed
✓ Dates selected
✓ Activities booked
✓ ID verified

View your itinerary: [Guest Link]

We'll see you on [Event Date]!

[Agent Name]
```

## Troubleshooting

### Guest Can't Access Link

**Issue**: Link shows "Invalid access link"

**Solutions**:
1. Verify token hasn't been regenerated
2. Check if guest was deleted
3. Ensure link wasn't truncated in email
4. Try resending invitation

### Guest Lost Email

**Issue**: Guest can't find invitation

**Solutions**:
1. Check spam/junk folders
2. Use "Resend Invitation" feature
3. Provide new link via SMS/WhatsApp
4. Guest can lookup using booking reference at `/guest/lookup`

### Multiple Guests Same Email

**Issue**: Spouse/family share email address

**Solutions**:
1. Create separate guest records
2. Each gets unique link
3. Note in guest details: "Shares email with [Name]"
4. Send both links in same email

## Security Considerations

### Token Best Practices

✅ **DO**:
- Generate tokens with cryptographically secure random generation
- Use HTTPS for all links
- Monitor for suspicious access patterns
- Regenerate tokens if compromised

❌ **DON'T**:
- Share tokens publicly
- Reuse tokens across guests
- Include tokens in URL parameters after initial access
- Store tokens in plaintext logs

### Data Protection

- Guest data is isolated by token
- No cross-guest access possible
- ID documents encrypted at rest
- Automatic logout after 30 days inactivity (configurable)

## Analytics & Reporting

### Track Guest Engagement

Monitor how guests interact with their portal:

```typescript
Analytics Dashboard:
- Total invitations sent: 150
- Portal accessed: 142 (94.7%)
- RSVP complete: 138 (92%)
- Bleisure set: 125 (83.3%)
- Itinerary complete: 140 (93.3%)
- ID verified: 135 (90%)
```

### Export Reports

Generate CSV reports:
- Guest completion status
- RSVP summary
- Bleisure extension revenue
- Itinerary capacity by event
- ID verification status

## Integration with Client Portal

Clients can also view guest progress:

1. Client logs into their portal
2. Views their event
3. Sees anonymized guest statistics:
   - Total guests: 150
   - Confirmed: 145
   - Declined: 5
   - Pending: 0

**Note**: Clients do NOT see individual guest links (privacy protection)

## API Reference for Developers

### Generate Guest Link Programmatically

```typescript
POST /api/events/:eventId/guests

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "labelId": 1,
  "allocatedSeats": 2
}

Response:
{
  "id": 123,
  "bookingRef": "BOOK-5678",
  "accessToken": "uuid-here",
  "guestLink": "https://app.com/guest/uuid-here"
}
```

### Bulk Generate Links

```typescript
POST /api/events/:eventId/guests/bulk

Body:
[
  { "name": "Guest 1", "email": "g1@ex.com", "labelId": 1 },
  { "name": "Guest 2", "email": "g2@ex.com", "labelId": 2 }
]

Response:
{
  "created": 2,
  "guests": [
    { "name": "Guest 1", "link": "..." },
    { "name": "Guest 2", "link": "..." }
  ]
}
```

## Support

For questions about guest link management:
- **Technical Issues**: support@gatherpath.com
- **Feature Requests**: features@gatherpath.com
- **Security Concerns**: security@gatherpath.com

---

**Last Updated**: February 2026
**Version**: 1.0.0
