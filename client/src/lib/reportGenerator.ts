import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface EventData {
  event: any;
  guests: any[];
  labels: any[];
  perks: any[];
  requests: any[];
  hotelBookings: any[];
}

export function generateEventReport(data: EventData) {
  const { event, guests, labels, perks, requests, hotelBookings } = data;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Event Summary
  const summaryData = [
    ['Event Report'],
    ['Generated on:', format(new Date(), 'PPP p')],
    [''],
    ['Event Name:', event.name],
    ['Event Code:', event.eventCode],
    ['Date:', format(new Date(event.date), 'PPP p')],
    ['Location:', event.location],
    ['Description:', event.description || 'N/A'],
    [''],
    ['Statistics'],
    ['Total Guests:', guests.length],
    ['Confirmed:', guests.filter((g: any) => g.status === 'confirmed').length],
    ['Pending:', guests.filter((g: any) => g.status === 'pending').length],
    ['Declined:', guests.filter((g: any) => g.status === 'declined').length],
    ['Total Hotel Rooms:', hotelBookings.reduce((sum: number, b: any) => sum + (b.numberOfRooms || 0), 0)],
    ['Labels Created:', labels.length],
    ['Perks Available:', perks.length],
    ['Pending Requests:', requests.filter((r: any) => r.status === 'pending').length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Event Summary');

  // Sheet 2: Guest List
  const guestData = [
    ['Name', 'Email', 'Phone', 'Category', 'Status', 'Dietary Restrictions', 'Special Requests', 'Booking Ref'],
    ...guests.map((guest: any) => [
      guest.name,
      guest.email,
      guest.phone || '',
      guest.category || '',
      guest.status || 'pending',
      guest.dietaryRestrictions || '',
      guest.specialRequests || '',
      guest.bookingRef || '',
    ]),
  ];
  const wsGuests = XLSX.utils.aoa_to_sheet(guestData);
  XLSX.utils.book_append_sheet(wb, wsGuests, 'Guest List');

  // Sheet 3: Hotel Bookings
  if (hotelBookings.length > 0) {
    const hotelData = [
      ['Hotel Name', 'Check-In', 'Check-Out', 'Number of Rooms'],
      ...hotelBookings.map((booking: any) => [
        booking.hotelName,
        format(new Date(booking.checkInDate), 'PPP'),
        format(new Date(booking.checkOutDate), 'PPP'),
        booking.numberOfRooms,
      ]),
    ];
    const wsHotels = XLSX.utils.aoa_to_sheet(hotelData);
    XLSX.utils.book_append_sheet(wb, wsHotels, 'Hotel Bookings');
  }

  // Sheet 4: Labels & Perks
  if (labels.length > 0) {
    const labelData = [
      ['Label Name', 'Guest Category'],
      ...labels.map((label: any) => [label.name, 'Custom Label']),
    ];
    const wsLabels = XLSX.utils.aoa_to_sheet(labelData);
    XLSX.utils.book_append_sheet(wb, wsLabels, 'Labels');
  }

  if (perks.length > 0) {
    const perkData = [
      ['Perk Name', 'Description', 'Type'],
      ...perks.map((perk: any) => [
        perk.name,
        perk.description || '',
        perk.type || '',
      ]),
    ];
    const wsPerks = XLSX.utils.aoa_to_sheet(perkData);
    XLSX.utils.book_append_sheet(wb, wsPerks, 'Perks');
  }

  // Sheet 5: Requests
  if (requests.length > 0) {
    const requestData = [
      ['Guest Name', 'Request Type', 'Status', 'Notes', 'Submitted Date'],
      ...requests.map((req: any) => [
        req.guest?.name || 'Unknown',
        req.type || 'General',
        req.status || 'pending',
        req.notes || '',
        req.createdAt ? format(new Date(req.createdAt), 'PPP') : '',
      ]),
    ];
    const wsRequests = XLSX.utils.aoa_to_sheet(requestData);
    XLSX.utils.book_append_sheet(wb, wsRequests, 'Requests');
  }

  // Sheet 6: Guest Details (Extended)
  const detailedGuestData = [
    [
      'Name', 'Email', 'Phone', 'Category', 'Status', 
      'RSVP Status', 'Arrival Date', 'Departure Date',
      'Seat Preference', 'Meal Preference', 'Dietary Restrictions',
      'Accessibility Needs', 'Special Requests', 'Emergency Contact'
    ],
    ...guests.map((guest: any) => [
      guest.name,
      guest.email,
      guest.phone || '',
      guest.category || '',
      guest.status || 'pending',
      guest.rsvpStatus || 'pending',
      guest.arrivalDate ? format(new Date(guest.arrivalDate), 'PPP') : '',
      guest.departureDate ? format(new Date(guest.departureDate), 'PPP') : '',
      guest.seatPreference || '',
      guest.mealPreference || '',
      guest.dietaryRestrictions || '',
      guest.accessibilityNeeds || '',
      guest.specialRequests || '',
      guest.emergencyContact || '',
    ]),
  ];
  const wsDetailedGuests = XLSX.utils.aoa_to_sheet(detailedGuestData);
  XLSX.utils.book_append_sheet(wb, wsDetailedGuests, 'Guest Details');

  // Generate filename
  const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

  // Write the file
  XLSX.writeFile(wb, filename);
}

export function downloadGuestListCSV(guests: any[], eventName: string) {
  const csvData = [
    ['Name', 'Email', 'Phone', 'Category', 'Status', 'Dietary Restrictions', 'Special Requests'],
    ...guests.map((guest: any) => [
      guest.name,
      guest.email,
      guest.phone || '',
      guest.category || '',
      guest.status || 'pending',
      guest.dietaryRestrictions || '',
      guest.specialRequests || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(csvData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guests');

  const filename = `${eventName.replace(/[^a-z0-9]/gi, '_')}_Guests_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  XLSX.writeFile(wb, filename, { bookType: 'csv' });
}
