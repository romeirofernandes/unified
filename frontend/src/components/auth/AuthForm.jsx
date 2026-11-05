import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, EyeOffIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FormField from "@/components/shared/FormField";
import Brand from "@/components/shared/Brand";
import ThemeToggle from "@/components/landing/ThemeToggle";

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

      <main className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(380px,448px)] lg:gap-16 lg:px-12 lg:pb-20 lg:pt-8">
        <section className="mx-auto w-full max-w-xl space-y-7 lg:mx-0 lg:py-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#d6d3ca] bg-white/70 px-3.5 py-2 text-sm font-medium text-[#56534d] shadow-[0_2px_8px_rgb(28_27_25_/_4%)] dark:border-[#45433e] dark:bg-white/5 dark:text-[#d0ccc3]">
            <span
              className="size-2 rounded-full bg-[#7c99d7]"
              aria-hidden="true"
            />
            Customer feedback, brought together
          </p>
          <div className="space-y-5">
            <h1 className="max-w-[12ch] font-serif text-[clamp(2.7rem,5.5vw,4.6rem)] leading-[1.04] tracking-[-0.035em] text-balance text-[#24231f] dark:text-[#f4f1e9]">
              {isSignup
                ? "Make space for better feedback."
                : "Good to have you back."}
            </h1>
            <p className="max-w-[38rem] text-base leading-[1.7] text-[#5e5b54] sm:text-lg dark:text-[#c6c2b9]">
              {isSignup
                ? "Bring every customer conversation into one place, then use it to shape what you build next."
                : "Pick up where the conversation left off. Your projects and customer feedback are right here."}
            </p>
          </div>
          <p className="border-l-2 border-[#9bb3e3] py-1 pl-4 text-sm leading-relaxed text-[#65625b] dark:text-[#aaa69e]">
            Made for teams who want to listen closely and build with purpose.
          </p>
        </section>

        <section
          aria-labelledby="auth-title"
          className="mx-auto w-full max-w-md lg:max-w-none"
        >
          <Card className="overflow-hidden rounded-2xl border border-[#d6d3ca] bg-[#fbfaf7] p-0 shadow-[0_3px_0_rgb(28_27_25_/_4%),0_24px_60px_rgb(28_27_25_/_8%)] dark:border-[#343330] dark:bg-[#1d1c1a] dark:shadow-[0_24px_64px_rgb(0_0_0_/_22%)]">
            <div className="space-y-6 p-5 sm:p-8">
              <div className="space-y-2">
                <h2
                  id="auth-title"
                  className="font-serif text-3xl leading-tight tracking-[-0.02em] text-[#24231f] dark:text-[#f4f1e9]"
                >
                  {isSignup ? "Create your account" : "Sign in to Unified"}
                </h2>
                <p className="text-sm leading-relaxed text-[#65625b] dark:text-[#aaa69e]">
                  {isSignup
                    ? "Start collecting feedback in a few steps."
                    : "Enter your details to open your workspace."}
                </p>
              </div>

              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="min-h-5"
              >
                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive-light p-3 text-sm leading-relaxed text-destructive">
                    {error}
                  </p>
                )}
              </div>

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
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                  <p className="text-sm leading-relaxed text-[#65625b] dark:text-[#aaa69e]">
                    Use at least 6 characters for your password.
                  </p>
                )}

                <Button
                  type="submit"
                  className="min-h-11 w-full [--foreground:#405783] text-white hover:[--foreground:#354972] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] dark:[--foreground:#6e8dc9] dark:text-[#141413] dark:hover:[--foreground:#9bb3e3] dark:focus-visible:ring-offset-[#1d1c1a]"
                  loading={pending === "email"}
                  disabled={!!pending}
                >
                  {isSignup ? "Create account" : "Sign in"}
                </Button>
              </form>

              <div
                className="flex items-center gap-4 text-[#716e67] dark:text-[#aaa69e]"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-[#d6d3ca] dark:bg-[#45433e]" />
                <span className="text-xs">or</span>
                <span className="h-px flex-1 bg-[#d6d3ca] dark:bg-[#45433e]" />
              </div>

              <Button
                variant="tertiary"
                className="min-h-11 w-full border border-[#d6d3ca] bg-transparent text-[#24231f] hover:bg-[#f4f3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] dark:border-[#45433e] dark:text-[#f4f1e9] dark:hover:bg-white/5 dark:focus-visible:ring-offset-[#1d1c1a]"
                onClick={() => authenticate("google")}
                loading={pending === "google"}
                disabled={!!pending}
              >
                <img
                  className="size-5"
                  src="/google.svg"
                  alt=""
                  aria-hidden="true"
                />
                Continue with Google
              </Button>
            </div>

            <div className="border-t border-[#e5e2da] bg-[#f4f3ee]/70 px-5 py-4 text-center dark:border-[#343330] dark:bg-[#171716] sm:px-8">
              <p className="text-sm leading-relaxed text-[#65625b] dark:text-[#aaa69e]">
                {isSignup ? "Already have an account? " : "New to Unified? "}
                <Link
                  className="font-medium text-[#354972] underline decoration-[#9bb3e3] underline-offset-4 outline-none transition-colors hover:text-[#24231f] focus-visible:ring-2 focus-visible:ring-[#405783] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] dark:text-[#b9c9e8] dark:hover:text-white dark:focus-visible:ring-offset-[#171716]"
                  to={isSignup ? "/login" : "/signup"}
                >
                  {isSignup ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
