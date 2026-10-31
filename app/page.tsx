import type { Metadata } from "next";
import { OverviewView } from "@/components/relay/overview";
export const metadata: Metadata = {
  title: { absolute: "relay — Infrastructure, in perspective." },
};
export default function OverviewPage() {
  return <OverviewView />;
}
