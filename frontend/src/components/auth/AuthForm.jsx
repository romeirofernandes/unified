import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup, InputField } from "@/components/ui/input-group";
import Brand from "@/components/shared/Brand";
import { ErrorMessage } from "@/components/shared/PageState";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { typeClass } from "@/lib/type-scale";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function authenticate(provider) {
    if (pending) return;
    setError("");
    setPending(provider);
    try {
      if (provider === "google") await loginWithGoogle();
      else await (isSignup ? signup(email, password) : login(email, password));
      navigate(location.state?.from?.pathname || "/dashboard", {
        replace: true,
      });
    } catch {
      setError(
        provider === "google"
          ? "Google sign-in didn’t finish. Please try again."
          : isSignup
            ? "Couldn’t create your account. Check your details and try again."
            : "Couldn’t sign in. Check your email and password.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between p-5 sm:p-8">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="grid flex-1 place-items-center px-5 pb-16 pt-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3 text-center">
            <h1 className={typeClass("display")}>
              {isSignup
                ? "A home for your customer feedback."
                : "Welcome back."}
            </h1>
            <p className={`${typeClass("body")} text-muted-foreground`}>
              {isSignup
                ? "Create your account and start listening."
                : "Your projects and customer conversations are waiting."}
            </p>
          </div>
          <Card className="p-5 sm:p-7">
            <div className="space-y-5">
              <ErrorMessage>{error}</ErrorMessage>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  authenticate("email");
                }}
                className="space-y-5"
              >
                <InputGroup className="w-full">
                  <InputField
                    index={0}
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    required
                    disabled={!!pending}
                  />
                  <InputField
                    index={1}
                    label="Password"
                    type="password"
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    minLength={isSignup ? 6 : undefined}
                    value={password}
                    onChange={setPassword}
                    required
                    disabled={!!pending}
                  />
                </InputGroup>
                {isSignup && (
                  <p
                    className={`${typeClass("caption")} text-muted-foreground`}
                  >
                    Use at least 6 characters for your password.
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  loading={pending === "email"}
                  disabled={!!pending}
                >
                  {isSignup ? "Create account" : "Sign in"}
                </Button>
              </form>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span className={typeClass("caption")}>or continue with</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                variant="tertiary"
                className="w-full"
                onClick={() => authenticate("google")}
                loading={pending === "google"}
                disabled={!!pending}
              >
                <HugeiconsIcon icon={GoogleIcon} size={18} aria-hidden="true" />
                Google
              </Button>
            </div>
          </Card>
          <p
            className={`${typeClass("body")} text-center text-muted-foreground`}
          >
            {isSignup ? "Already have an account? " : "New to unified? "}
            <Link
              className="text-foreground underline underline-offset-4"
              to={isSignup ? "/login" : "/signup"}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
