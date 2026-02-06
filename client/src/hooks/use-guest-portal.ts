import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

/**
 * Hook to access guest portal with token
 */
export function useGuestPortal(token: string) {
  return useQuery({
    queryKey: ['guest-portal', token],
    queryFn: async () => {
      if (!token) return null;
      const url = buildUrl(api.guests.portal.path, { token });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to access guest portal");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });
}

/**
 * Hook to update guest RSVP
 */
export function useUpdateRSVP(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      status: 'confirmed' | 'declined';
      confirmedSeats?: number;
      familyMembers?: Array<{ name: string; relationship: string; age?: number }>;
    }) => {
      const url = buildUrl(api.guests.updateRSVP.path, { token });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update RSVP");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}

/**
 * Hook to update bleisure dates
 */
export function useUpdateBleisure(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      extendedCheckIn?: Date;
      extendedCheckOut?: Date;
    }) => {
      const url = buildUrl(api.guests.updateBleisure.path, { token });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update dates");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}

/**
 * Hook to upload ID document
 */
export function useUploadID(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      documentUrl: string;
      verifiedName: string;
    }) => {
      const url = buildUrl(api.guests.uploadID.path, { token });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to upload ID");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}

/**
 * Hook to toggle self-management options
 */
export function useToggleSelfManagement(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      selfManageFlights?: boolean;
      selfManageHotel?: boolean;
    }) => {
      const url = buildUrl(api.guests.toggleSelfManagement.path, { token });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}

/**
 * Hook to join waitlist
 */
export function useJoinWaitlist(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.guests.joinWaitlist.path, { token });
      const res = await fetch(url, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}

/**
 * Hook to register for itinerary event
 */
export function useRegisterForEvent(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      const url = buildUrl(api.itinerary.register.path, { token, eventId: eventId.toString() });
      const res = await fetch(url, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to register");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}

/**
 * Hook to unregister from itinerary event
 */
export function useUnregisterFromEvent(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      const url = buildUrl(api.itinerary.unregister.path, { token, eventId: eventId.toString() });
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unregister");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-portal', token] });
    },
  });
}
