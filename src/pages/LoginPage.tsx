import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithGoogle, signOut, resolveUserRole } from "@/lib/authService";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "@/hooks/useAuthState";

export function LoginPage() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuthState();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!authLoading && userDoc) {
      navigate("/editor", { replace: true });
    }
  }, [authLoading, userDoc, navigate]);

  async function handleSignIn() {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle(auth);
      const user = auth.currentUser;
      if (!user) throw new Error("No user after sign-in");
      const doc = await resolveUserRole(db, user.uid);
      if (!doc) {
        await signOut(auth);
        setError("Access denied. Contact your camp administrator.");
        return;
      }
      navigate("/editor", { replace: true });
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message !== "Access denied. Contact your camp administrator."
      ) {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">BP Youth Summer Adventure</CardTitle>
          <p className="text-sm text-muted-foreground">
            Schedule Editor Sign In
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            className="w-full min-h-11"
            onClick={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing in…
              </span>
            ) : (
              "Sign in with Google"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
