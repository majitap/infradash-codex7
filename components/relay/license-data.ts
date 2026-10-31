"use client";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { useOperations } from "@/components/admin/operations-provider";
export function useDisplayedLicense() {
  const { data } = useDashboard();
  const { configured, license } = useOperations();
  if (configured)
    return {
      counts:
        license?.state === "available" &&
        license.activeUsers !== null &&
        license.userLimit !== null
          ? { used: license.activeUsers, total: license.userLimit }
          : null,
      source: "live" as const,
    };
  return { counts: data?.license ?? null, source: data?.source ?? "live" };
}
