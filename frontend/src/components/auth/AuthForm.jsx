import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/use-auth";
import FormField from "@/components/shared/FormField";
import Brand from "@/components/shared/Brand";
import ThemeToggle from "@/components/landing/ThemeToggle";
import {
  tactileButtonBase,
  tactilePrimaryButton,
  tactileSecondaryButton,
} from "@/components/landing/buttonStyles";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const destination = location.state?.from;
      navigate(
        destination
          ? `${destination.pathname || "/dashboard"}${destination.search || ""}${destination.hash || ""}`
          : "/dashboard",
        { replace: true },
      );
    } catch {
      setError(
        provider === "google"
          ? "Google sign-in didn’t finish. Try again."
          : isSignup
            ? "We couldn’t create your account. Check your details and try again."
            : "We couldn’t sign you in. Check your email and password and try again.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex min-h-20 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Brand />
        <ThemeToggle />
      </header>

      <main className="grid min-h-[calc(100svh-5rem)] place-items-center px-5 pb-12 pt-6 sm:px-8 sm:pb-16">
        <section
          aria-labelledby="auth-title"
          className="w-full max-w-[420px] rounded-2xl border border-[#d6d3ca] bg-[#fbfaf7] p-5 shadow-[0_2px_12px_rgb(28_27_25_/_5%)] sm:p-8 dark:border-[#343330] dark:bg-[#1d1c1a] dark:shadow-[0_2px_16px_rgb(0_0_0_/_18%)]"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <h1
                id="auth-title"
                className="font-serif text-[32px] font-normal leading-tight tracking-[-0.025em] text-[#24231f] dark:text-[#f4f1e9]"
              >
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-[14px] leading-relaxed text-[#5e5b54] dark:text-[#c6c2b9]">
                {isSignup
                  ? "Sign up to bring your customer feedback together."
                  : "Sign in to continue to your workspace."}
              </p>
            </div>

            {error && (
              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="rounded-lg border border-destructive/30 bg-destructive-light p-3 text-sm leading-relaxed text-destructive"
              >
                {error}
              </p>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                authenticate("email");
              }}
              className="space-y-5"
            >
              <FormField
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!!pending}
                required
              />

              <div className="relative min-w-0">
                <FormField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? 6 : undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!!pending}
                  required
                  className="pr-14"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 inline-flex size-10 items-center justify-center rounded-md text-[#65625b] outline-none transition-colors hover:text-[#24231f] focus-visible:ring-2 focus-visible:ring-[#405783] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] disabled:pointer-events-none disabled:opacity-50 dark:text-[#aaa69e] dark:hover:text-[#f4f1e9] dark:focus-visible:ring-[#9bb3e3] dark:focus-visible:ring-offset-[#1d1c1a]"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={!!pending}
                >
                  <HugeiconsIcon
                    icon={showPassword ? EyeOffIcon : EyeIcon}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {isSignup && (
                <p className="-mt-2 text-sm leading-relaxed text-[#65625b] dark:text-[#aaa69e]">
                  Use at least 6 characters for your password.
                </p>
              )}

              <button
                type="submit"
                className={`${tactileButtonBase} ${tactilePrimaryButton} min-h-[46px] w-full px-5 text-[14px] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] dark:focus-visible:ring-offset-[#1d1c1a]`}
                disabled={!!pending}
              >
                {pending === "email"
                  ? isSignup
                    ? "Creating account…"
                    : "Signing in…"
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <div
              className="flex items-center gap-4 text-[#716e67] dark:text-[#aaa69e]"
              aria-hidden="true"
            >
              <span className="h-px flex-1 bg-[#d6d3ca] dark:bg-[#45433e]" />
              <span className="text-xs">or</span>
              <span className="h-px flex-1 bg-[#d6d3ca] dark:bg-[#45433e]" />
            </div>

            <button
              type="button"
              className={`${tactileButtonBase} ${tactileSecondaryButton} min-h-[46px] w-full px-5 text-[14px] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] dark:focus-visible:ring-offset-[#1d1c1a]`}
              onClick={() => authenticate("google")}
              disabled={!!pending}
            >
              <img
                className="size-5"
                src="/google.svg"
                alt=""
                aria-hidden="true"
              />
              {pending === "google"
                ? "Connecting to Google…"
                : "Continue with Google"}
            </button>

            <p className="text-center text-sm leading-relaxed text-[#65625b] dark:text-[#aaa69e]">
              {isSignup ? "Already have an account? " : "New to Unified? "}
              <Link
                className="font-medium text-[#354972] underline decoration-[#9bb3e3] underline-offset-4 outline-none transition-colors hover:text-[#24231f] focus-visible:ring-2 focus-visible:ring-[#405783] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] dark:text-[#b9c9e8] dark:hover:text-white dark:focus-visible:ring-offset-[#1d1c1a]"
                to={isSignup ? "/login" : "/signup"}
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
