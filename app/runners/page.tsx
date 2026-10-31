import type { Metadata } from "next";

import { RunnersView } from "@/components/relay/runners";

export const metadata: Metadata = { title: "러너" };

export default function RunnersPage() {
  return <RunnersView />;
}
