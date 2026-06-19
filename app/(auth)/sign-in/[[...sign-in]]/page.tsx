import { SignIn } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

export default function SignInPage() {
  return (
    <SignIn
      appearance={clerkTheme}
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
    />
  );
}

