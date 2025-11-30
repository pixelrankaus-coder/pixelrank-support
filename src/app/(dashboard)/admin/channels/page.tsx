import { redirect } from "next/navigation";

export default function ChannelsPage() {
  // The layout handles the root page display
  redirect("/admin/channels");
}
