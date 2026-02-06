import { supabase } from './supabase';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

// User methods
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase(data) : null;
}

export async function createUser(userData: any) {
  const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  const userToInsert = {
    id: userId,
    email: userData.email,
    password: userData.password, // Already hashed by the route
    first_name: userData.firstName,
    last_name: userData.lastName,
    role: userData.role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert([userToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function updateUserEventCode(userId: string, eventCode: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ event_code: eventCode, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

// Event methods
export async function createEvent(eventData: any) {
  const eventToInsert = {
    name: eventData.name,
    date: eventData.date,
    location: eventData.location,
    description: eventData.description || '',
    event_code: eventData.eventCode,
    agent_id: eventData.agentId,
    is_published: false,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('events')
    .insert([eventToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getEventById(id: number) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase(data) : null;
}

export async function getEventByCode(eventCode: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode)
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase(data) : null;
}

export async function getEventsByAgent(agentId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function getEventsByCode(eventCode: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function updateEvent(id: number, updates: any) {
  const { data, error } = await supabase
    .from('events')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function publishEvent(id: number) {
  return updateEvent(id, { isPublished: true });
}

// Client Details methods
export async function createClientDetails(details: any) {
  const detailsToInsert = toSnakeCase(details);

  const { data, error } = await supabase
    .from('client_details')
    .insert([detailsToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getClientDetails(eventId: number) {
  const { data, error } = await supabase
    .from('client_details')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? toCamelCase(data) : null;
}

// Hotel Booking methods
export async function createHotelBooking(booking: any) {
  const bookingToInsert = toSnakeCase(booking);

  const { data, error } = await supabase
    .from('hotel_bookings')
    .insert([bookingToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getHotelBookings(eventId: number) {
  const { data, error } = await supabase
    .from('hotel_bookings')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

// Travel Option methods
export async function createTravelOption(option: any) {
  const optionToInsert = toSnakeCase(option);

  const { data, error } = await supabase
    .from('travel_options')
    .insert([optionToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getTravelOptions(eventId: number) {
  const { data, error } = await supabase
    .from('travel_options')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

// Travel Schedule methods
export async function createTravelSchedule(schedule: any) {
  const scheduleToInsert = toSnakeCase(schedule);

  const { data, error } = await supabase
    .from('travel_schedules')
    .insert([scheduleToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getTravelSchedules(eventId: number) {
  const { data, error } = await supabase
    .from('travel_schedules')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

// Guest methods
export async function createGuest(guest: any) {
  const guestToInsert = toSnakeCase(guest);

  const { data, error } = await supabase
    .from('guests')
    .insert([guestToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getGuests(eventId: number) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function updateGuest(id: number, updates: any) {
  const { data, error } = await supabase
    .from('guests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deleteGuest(id: number) {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Label methods
export async function createLabel(label: any) {
  const labelToInsert = toSnakeCase(label);

  const { data, error } = await supabase
    .from('labels')
    .insert([labelToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getLabels(eventId: number) {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function deleteLabel(id: number) {
  const { error } = await supabase
    .from('labels')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Perk methods
export async function createPerk(perk: any) {
  const perkToInsert = toSnakeCase(perk);

  const { data, error } = await supabase
    .from('perks')
    .insert([perkToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getPerks(eventId: number) {
  const { data, error } = await supabase
    .from('perks')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function updatePerk(id: number, updates: any) {
  const { data, error } = await supabase
    .from('perks')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deletePerk(id: number) {
  const { error } = await supabase
    .from('perks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Request methods
export async function createRequest(request: any) {
  const requestToInsert = toSnakeCase(request);

  const { data, error } = await supabase
    .from('requests')
    .insert([requestToInsert])
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function getRequests(eventId: number) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return toCamelCase(data || []);
}

export async function updateRequest(id: number, updates: any) {
  const { data, error } = await supabase
    .from('requests')
    .update(toSnakeCase(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase(data);
}
