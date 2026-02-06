import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type GuestInput } from "@shared/routes";

export function useGuests(eventId: number) {
  return useQuery({
    queryKey: [api.guests.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.guests.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guests");
      return api.guests.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useGuest(id: number) {
  return useQuery({
    queryKey: [api.guests.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.guests.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guest");
      return api.guests.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ...data }: GuestInput & { eventId: number }) => {
      const url = buildUrl(api.guests.create.path, { eventId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create guest");
      return api.guests.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.guests.list.path, variables.eventId] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: number; eventId: number }) => {
      const url = buildUrl(api.guests.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete guest");
      return api.guests.delete.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.guests.list.path, variables.eventId] });
    },
  });
}

export function useGuestLookup(ref: string) {
  return useQuery({
    queryKey: [api.guests.lookup.path, ref],
    queryFn: async () => {
      if (!ref) return null;
      const url = `${api.guests.lookup.path}?ref=${encodeURIComponent(ref)}`;
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to lookup guest");
      return api.guests.lookup.responses[200].parse(await res.json());
    },
    enabled: ref.length > 2,
    retry: false,
  });
}

export function useGuestFamily(guestId: number) {
  return useQuery({
    queryKey: [api.guestFamily.list.path, guestId],
    queryFn: async () => {
      const url = buildUrl(api.guestFamily.list.path, { guestId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch family");
      return api.guestFamily.list.responses[200].parse(await res.json());
    },
    enabled: !!guestId,
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guestId, ...data }: any) => {
      const url = buildUrl(api.guestFamily.create.path, { guestId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add family member");
      return api.guestFamily.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.guestFamily.list.path, variables.guestId] });
    },
  });
}
