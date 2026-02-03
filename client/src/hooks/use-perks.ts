import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PerkInput } from "@shared/routes";

export function usePerks(eventId: number) {
  return useQuery({
    queryKey: [api.perks.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.perks.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch perks");
      return api.perks.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useCreatePerk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ...data }: PerkInput & { eventId: number }) => {
      const url = buildUrl(api.perks.create.path, { eventId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create perk");
      return api.perks.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.perks.list.path, variables.eventId] });
    },
  });
}
