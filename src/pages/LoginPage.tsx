import { useActionState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithGoogle, signOut, resolveUserRole } from "@/lib/authService";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "@/hooks/useAuthState";
import { Spinner, PageSpinner } from "@/components/Spinner";

export function LoginPage() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuthState();

  const [error, signInAction, signingIn] = useActionState(
    async (_prev: string | null) => {
      try {
        await signInWithGoogle(auth);
        const user = auth.currentUser;
        if (!user) throw new Error("No user after sign-in");
        const doc = await resolveUserRole(db, user.uid);
        if (!doc) {
          await signOut(auth);
          return "Access denied. Contact your camp administrator.";
        }
        navigate("/editor", { replace: true });
        return null;
      } catch {
        return "Sign-in failed. Please try again.";
      }
    },
    null
  );

  useEffect(() => {
    if (!authLoading && userDoc) {
      navigate("/editor", { replace: true });
    }
  }, [authLoading, userDoc, navigate]);

  if (authLoading) {
    return <PageSpinner />;
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
            onClick={() => signInAction()}
            disabled={signingIn}
          >
            {signingIn ? (
              <span className="flex items-center gap-2">
                <Spinner />
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
