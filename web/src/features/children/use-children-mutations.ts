import { useMutation } from "@tanstack/react-query";
import { api } from "../../api";

export type ChildAddressPayload = {
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: string;
};

export type UpsertChildPayload = {
  firstName: string;
  lastName: string;
  ssn: string;
  birthDate: string;
  nivo?: number;
  communityId?: string;
  parentIds?: string[];
  address?: ChildAddressPayload | null;
};

export function useCreateChildMutation() {
  return useMutation({
    mutationFn: async (payload: UpsertChildPayload) => (await api.post("/children", payload)).data,
  });
}

export function useUpdateChildMutation(editingId: string | null) {
  return useMutation({
    mutationFn: async (payload: UpsertChildPayload) => (await api.patch(`/children/${editingId}`, payload)).data,
  });
}

export function useInactivateChildMutation() {
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/children/${id}`),
  });
}
