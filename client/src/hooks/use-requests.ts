import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type RequestInput } from "@shared/routes";

export function useRequests(eventId: number) {
  return useQuery({
    queryKey: [api.requests.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.requests.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.requests.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ guestId, ...data }: RequestInput & { guestId: number }) => {
      const url = buildUrl(api.requests.create.path, { guestId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create request");
      return api.requests.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries if needed, mainly for agent view
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: number, status: string, notes?: string }) => {
      const url = buildUrl(api.requests.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update request");
      return api.requests.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
    },
  });
}
