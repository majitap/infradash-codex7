import type { Metadata } from "next";
import { SystemsView } from "@/components/relay/systems";
export const metadata: Metadata = { title: "Systems" };
export default function TopologyPage() {
  return <SystemsView />;
}
