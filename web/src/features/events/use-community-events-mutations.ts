import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { COMMUNITY_EVENTS_QUERY_KEY } from "./constants";
import { CommunityEventRecord, CreateEventPayload, UpdateEventPayload } from "./types";

type EventMutationArgs = {
  communityId: string;
};

export function useCommunityEventsMutations({ communityId }: EventMutationArgs) {
  const queryClient = useQueryClient();

  const invalidateEvents = async () => {
    await queryClient.invalidateQueries({ queryKey: [COMMUNITY_EVENTS_QUERY_KEY] });
  };

  const createEvent = useMutation({
    mutationFn: async (payload: CreateEventPayload) =>
      (await api.post(`/communities/${communityId}/events`, payload)).data as CommunityEventRecord,
    onSuccess: invalidateEvents,
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateEventPayload }) =>
      (await api.patch(`/communities/${communityId}/events/${id}`, payload)).data as CommunityEventRecord,
    onSuccess: invalidateEvents,
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => api.delete(`/communities/${communityId}/events/${id}`),
    onSuccess: invalidateEvents,
  });

  return {
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
