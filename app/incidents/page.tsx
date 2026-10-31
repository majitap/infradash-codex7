import type { Metadata } from "next";
import { SignalsView } from "@/components/relay/signals";
export const metadata: Metadata = { title: "운영 신호" };
export default function IncidentsPage() {
  return <SignalsView />;
}
