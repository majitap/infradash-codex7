import type { Metadata } from "next";
import { DeliveryView } from "@/components/relay/delivery";
export const metadata: Metadata = { title: "Delivery" };
export default function PipelinesPage() {
  return <DeliveryView />;
}
