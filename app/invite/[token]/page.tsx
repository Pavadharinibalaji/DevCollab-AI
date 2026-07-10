"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs";
import { Building2, Loader2, Sparkles, CheckCircle2, LogIn, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InviteAcceptancePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  const [invitationInfo, setInvitationInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState("");

  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  // 1. Fetch invitation info using token
  useEffect(() => {
    if (!token) return;

    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Failed to fetch invitation details.");
        }
        setInvitationInfo(payload.data?.invitation);
      } catch (err: any) {
        console.error("Fetch invite error:", err);
        setInfoError(err.message || "Invalid or expired invitation link.");
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [token]);

  // 2. Accept invitation handler
  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setAcceptError("");

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join workspace.");
      }
      setAcceptSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Accept invite error:", err);
      setAcceptError(err.message || "Something went wrong while accepting the invitation.");
      setIsAccepting(false);
    }
  };

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const signInUrl = `/sign-in?fallbackRedirectUrl=${encodeURIComponent(currentPath)}`;
  const signUpUrl = `/sign-up?fallbackRedirectUrl=${encodeURIComponent(currentPath)}`;

  const isLoaded = isAuthLoaded && isUserLoaded && !isLoadingInfo;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Validating invitation...</p>
      </div>
    );
  }

  if (infoError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-background text-foreground">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-rose-500/20 bg-card/40 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Invitation Error</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{infoError}</p>
          <Button onClick={() => router.push("/")} className="w-full justify-center mt-2 cursor-pointer">
            Go to Home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-background text-foreground selection:bg-primary/30">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/50 bg-gradient-to-br from-card/60 to-card/10 p-8 shadow-2xl backdrop-blur-xl">
        {acceptSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 animate-bounce">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Successfully Joined!</h2>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the workspace dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Workspace Invitation
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have been invited to join <span className="text-foreground font-bold">{invitationInfo?.workspaceName || "a workspace"}</span> as an <span className="font-semibold text-primary">{invitationInfo?.role}</span>.
              </p>
            </div>

            {isSignedIn ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {user?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.imageUrl} alt={user.fullName || "User"} className="h-10 w-10 rounded-full border border-border/30 object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {user?.firstName?.[0] || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{user?.fullName || "Teammate"}</h4>
                      <p className="text-xs text-muted-foreground truncate font-mono">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground flex justify-between items-center">
                    <span>Not you?</span>
                    <SignOutButton>
                      <button className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                        Sign Out
                      </button>
                    </SignOutButton>
                  </div>
                </div>

                {acceptError && (
                  <p className="text-xs font-semibold text-rose-400 text-center">{acceptError}</p>
                )}

                <Button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 font-semibold"
                >
                  {isAccepting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Accept Invitation & Join
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/30 bg-muted/20 p-4 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This workspace requires a registered user account to join. Sign in or create an account to accept the invitation.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => router.push(signInUrl)}
                    variant="outline"
                    className="justify-center border-border hover:bg-muted text-foreground cursor-pointer flex items-center gap-1.5"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push(signUpUrl)}
                    className="justify-center bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
