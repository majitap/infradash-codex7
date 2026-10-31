import type { Metadata } from "next";
import { SignalsView } from "@/components/relay/signals";
export const metadata: Metadata = { title: "Signals" };
export default function IncidentsPage() {
  return <SignalsView />;
}
