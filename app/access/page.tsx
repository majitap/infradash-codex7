import type { Metadata } from "next"

import { AccessView } from "@/components/views/access-view"

export const metadata: Metadata = { title: "인가 관리" }

export default function AccessPage() {
  return <AccessView />
}
