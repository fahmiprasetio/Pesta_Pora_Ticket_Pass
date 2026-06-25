import { redirect } from "next/navigation";

// Login was removed: buying never requires an account. Bounce any old links home.
export default function SignInPage() {
  redirect("/");
}
