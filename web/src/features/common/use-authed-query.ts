import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";

export function useAuthedQuery<T>(key: string, path: string, enabled: boolean) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => (await api.get(path)).data,
    enabled,
  });
}
