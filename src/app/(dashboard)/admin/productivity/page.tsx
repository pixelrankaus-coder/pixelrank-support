import { redirect } from "next/navigation";

export default function ProductivityPage() {
  // The layout handles the root page display
  // This is just a fallback
  redirect("/admin/productivity/canned-responses");
}
