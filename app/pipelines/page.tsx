import type { Metadata } from "next";
import { DeliveryView } from "@/components/relay/delivery";
export const metadata: Metadata = { title: "빌드·배포" };
export default function PipelinesPage() {
  return <DeliveryView />;
}
