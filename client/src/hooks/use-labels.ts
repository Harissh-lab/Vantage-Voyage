import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type LabelInput, type LabelPerkUpdateInput } from "@shared/routes";

export function useLabels(eventId: number) {
  return useQuery({
    queryKey: [api.labels.list.path, eventId],
    queryFn: async () => {
      const url = buildUrl(api.labels.list.path, { eventId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch labels");
      return api.labels.list.responses[200].parse(await res.json());
    },
    enabled: !!eventId,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ...data }: LabelInput & { eventId: number }) => {
      const url = buildUrl(api.labels.create.path, { eventId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create label");
      return api.labels.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.labels.list.path, variables.eventId] });
    },
  });
}

export function useLabelPerks(labelId: number) {
  return useQuery({
    queryKey: [api.labelPerks.list.path, labelId],
    queryFn: async () => {
      const url = buildUrl(api.labelPerks.list.path, { labelId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch label perks");
      return api.labelPerks.list.responses[200].parse(await res.json());
    },
    enabled: !!labelId,
  });
}

export function useUpdateLabelPerk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ labelId, perkId, ...data }: LabelPerkUpdateInput & { labelId: number, perkId: number }) => {
      const url = buildUrl(api.labelPerks.update.path, { labelId, perkId });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update label perk");
      return api.labelPerks.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.labelPerks.list.path, variables.labelId] });
    },
  });
}
