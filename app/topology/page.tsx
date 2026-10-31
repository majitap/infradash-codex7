import type { Metadata } from "next";
import { SystemsView } from "@/components/relay/systems";
export const metadata: Metadata = { title: "시스템" };
export default function TopologyPage() {
  return <SystemsView />;
}
