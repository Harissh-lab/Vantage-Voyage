import { useQuery } from "@tanstack/react-query";

export function useHotelBookings(eventId: number) {
  return useQuery({
    queryKey: ["/api/events", eventId, "hotel-bookings"],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/hotel-bookings`, { 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch hotel bookings");
      return await res.json();
    },
    enabled: !!eventId,
  });
}
