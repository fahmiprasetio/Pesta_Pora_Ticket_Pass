import { redirect } from "next/navigation";

// Profile/login removed. Tickets now live under /tickets (no account needed).
export default function ProfilePage() {
  redirect("/tickets");
}
