import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";

export function useAuthedQuery<T>(key: string, path: string, enabled: boolean) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => (await api.get(path)).data,
    enabled,
  });
}

type QueryParams = Record<string, string | number | boolean | undefined>;

export function useAuthedQueryWithParams<T>(
  key: string,
  path: string,
  params: QueryParams,
  enabled: boolean
) {
  return useQuery<T>({
    queryKey: [key, params],
    queryFn: async () => (await api.get(path, { params })).data,
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
