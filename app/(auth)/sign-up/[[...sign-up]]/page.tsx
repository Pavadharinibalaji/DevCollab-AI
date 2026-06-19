import { SignUp } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={clerkTheme}
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
    />
  );
}

