import type { Metadata } from "next";
import { OverviewView } from "@/components/relay/overview";
export const metadata: Metadata = {
  title: { absolute: "릴레이 · 인프라의 흐름을 한눈에" },
};
export default function OverviewPage() {
  return <OverviewView />;
}
