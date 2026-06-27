"use client";

import { Button } from "@/components/ui";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";
import { ArrowLeft, BarChart3, KeyRound, Loader2, Lock, Mail, ShieldCheck, Store, User } from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "https://paytrack-t2tp.onrender.com/api" : "http://localhost:4000/api");
const AUTH_FETCH_RETRIES = 2;

type AuthMode = "signin" | "register" | "forgot" | "reset";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isLikelyNetworkError(error: unknown) {
  return error instanceof TypeError || (error instanceof Error && error.message === "Failed to fetch");
}

async function wakeBackend() {
  try {
    await fetch(`${API_URL}/health`, { cache: "no-store" });
  } catch {
    // The auth request below will report the final error if the backend is unavailable.
  }
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= AUTH_FETCH_RETRIES; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (!isLikelyNetworkError(error) || attempt >= AUTH_FETCH_RETRIES) break;
      if (attempt === 0) await wakeBackend();
      await wait(700 * (attempt + 1));
    }
  }
  throw lastError;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function passwordStrengthError(value: string) {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must include at least one special character.";
  return "";
}

function friendlyAuthError(message?: string) {
  const value = (message ?? "").toLowerCase();
  if (value.includes("invalid login") || value.includes("invalid credentials")) return "Incorrect email or password.";
  if (value.includes("email not confirmed") || value.includes("not confirmed")) return "Please verify your email before signing in.";
  if (value.includes("already registered") || value.includes("already exists")) return "Email already exists.";
  if (value.includes("password")) return message ?? "Weak password.";
  if (value.includes("email")) return message ?? "Invalid email address.";
  return message || "Authentication failed. Please try again.";
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishSignIn = (token: string, user: { name?: string; role?: string; companyName?: string; store?: { storeName?: string } }) => {
    localStorage.setItem("paytrack_token", token);
    localStorage.setItem("paytrack_role", user.role ?? "OWNER");
    localStorage.setItem("paytrack_name", user.name ?? "PayTrack User");
    localStorage.setItem("paytrack_company", user.companyName ?? user.store?.storeName ?? user.name ?? "PayTrack");
    const secureCookie = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `paytrack_session=${encodeURIComponent(token)}; path=/; max-age=28800; SameSite=Strict${secureCookie}`;
    window.location.href = "/dashboard";
  };

  const exchangeSupabaseSession = async (accessToken: string) => {
    const response = await authFetch(`${API_URL}/auth/supabase-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message ?? "Unable to start your PayTrack session.");
    }
    finishSignIn(data.token, data.user ?? {});
  };

  const finishLegacySignIn = async () => {
    const response = await authFetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: email.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message ?? "Incorrect email or password.");
    }
    finishSignIn(data.token, data.user ?? {});
  };

  useEffect(() => {
    if (!supabase) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("reset") === "1") {
      setMode("reset");
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setMessage("");
        setError("");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (url.searchParams.get("reset") === "1") return;
      const session = data.session;
      if (!session?.access_token || !session.user.email_confirmed_at) return;
      setLoading(true);
      exchangeSupabaseSession(session.access_token).catch(() => setLoading(false));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const validateRegistration = () => {
    if (!businessName.trim() || !fullName.trim() || !email.trim() || !password || !confirmPassword) {
      return "Please fill in all required fields.";
    }
    if (!isValidEmail(email)) return "Invalid email address.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return passwordStrengthError(password);
  };

  const submitSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email address.");
      return;
    }
    setLoading(true);
    try {
      await finishLegacySignIn();
      return;
    } catch {
      // Existing PayTrack accounts can sign in locally. New Supabase-only accounts continue below.
    }

    try {
      if (!supabase) {
        setError("Supabase is not configured yet. Add your Supabase environment keys first.");
        setLoading(false);
        return;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (signInError) throw signInError;
      if (!data.session?.access_token) throw new Error("Unable to start your session.");
      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please verify your email before signing in.");
      }
      await exchangeSupabaseSession(data.session.access_token);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : undefined;
      try {
        if (message && /invalid login|invalid credentials|incorrect/i.test(message)) {
          await finishLegacySignIn();
          return;
        }
      } catch {
        // Keep the Supabase-facing error below if the legacy migration login also fails.
      }
      setError(friendlyAuthError(message));
      setLoading(false);
    }
  };

  const submitRegistration = async () => {
    const validationError = validateRegistration();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const response = await authFetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          storeName: businessName.trim(),
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? "Unable to create account.");
      }
      finishSignIn(data.token, data.user ?? {});
    } catch (authError) {
      setError(friendlyAuthError(authError instanceof Error ? authError.message : undefined));
      setLoading(false);
    }
  };

  const submitForgotPassword = async () => {
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email address.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured yet. Add your Supabase environment keys first.");
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login?reset=1`
      });
      setMessage("If an account exists with this email, a password reset link has been sent.");
    } catch {
      setMessage("If an account exists with this email, a password reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  const submitResetPassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const validationError = passwordStrengthError(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!supabase) {
      setError("Supabase is not configured yet. Add your Supabase environment keys first.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setPassword("");
      setConfirmPassword("");
      setMode("signin");
      setMessage("Password updated successfully.");
      window.history.replaceState({}, "", "/login");
    } catch (authError) {
      setError(friendlyAuthError(authError instanceof Error ? authError.message : undefined));
    } finally {
      setLoading(false);
    }
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    if (mode === "signin") await submitSignIn();
    if (mode === "register") await submitRegistration();
    if (mode === "forgot") await submitForgotPassword();
    if (mode === "reset") await submitResetPassword();
  };

  const title = {
    signin: "Login",
    register: "Create Account",
    forgot: "Forgot Password",
    reset: "Reset Password"
  }[mode];

  const subtitle = {
    signin: "Welcome back please login to your account",
    register: "Create your workspace instantly—no email verification required",
    forgot: "Enter your email and we will send a reset link",
    reset: "Choose a new secure password"
  }[mode];

  return (
    <main className="login-scene relative h-screen overflow-hidden px-4 py-6 text-slate-950 sm:py-8">
      <div className="login-motion-bg" />
      <div className="login-store-overlay" />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <section className="paytrack-auth-card login-glass-card w-full max-w-[500px]">
          <div className="mb-10 flex items-center gap-2 text-xs font-black text-white/82">
            <span className="grid size-8 place-items-center rounded-md border border-white/35 bg-white/18 text-white shadow-sm">
              <BarChart3 size={17} />
            </span>
            PayTrack
          </div>

          <h1 className="text-4xl font-black tracking-normal text-white">{title}</h1>
          <p className="mt-4 text-base font-semibold text-white/82">{subtitle}</p>

          {mode !== "forgot" && mode !== "reset" && (
            <>
              <div className="mt-8 flex gap-3">
                {["f", "G+", "in"].map((item) => (
                  <button key={item} type="button" className="grid size-10 place-items-center rounded-full border border-white/28 bg-white/12 text-sm font-black text-white shadow-sm transition hover:bg-white hover:text-[#1f9d66]">
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-7 text-sm font-semibold text-white/72">
                {mode === "signin" ? "or use your email account:" : "or use your email for registration:"}
              </p>
            </>
          )}

          <form className="mt-5 space-y-3" onSubmit={submitAuth}>
            {mode === "register" && (
              <>
                <label className="block text-sm font-semibold">
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/48 bg-white/8 px-5 text-white shadow-inner shadow-white/5">
                    <Store size={18} className="text-white/76" />
                    <input
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/72"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Business / Store Name"
                      autoComplete="organization"
                    />
                  </span>
                </label>

                <label className="block text-sm font-semibold">
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/48 bg-white/8 px-5 text-white shadow-inner shadow-white/5">
                    <User size={18} className="text-white/76" />
                    <input
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/72"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Full Name"
                      autoComplete="name"
                    />
                  </span>
                </label>
              </>
            )}

            {(mode === "signin" || mode === "register" || mode === "forgot") && (
              <label className="block text-sm font-semibold">
                <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/48 bg-white/8 px-5 text-white shadow-inner shadow-white/5">
                  <Mail size={18} className="text-white/76" />
                  <input
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/72"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email Address"
                    type="email"
                    autoComplete="email"
                  />
                </span>
              </label>
            )}

            {(mode === "signin" || mode === "register" || mode === "reset") && (
              <label className="block text-sm font-semibold">
                <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/48 bg-white/8 px-5 text-white shadow-inner shadow-white/5">
                  <Lock size={18} className="text-white/76" />
                  <input
                    type="password"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/72"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === "reset" ? "New Password" : "Password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </span>
              </label>
            )}

            {(mode === "register" || mode === "reset") && (
              <label className="block text-sm font-semibold">
                <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/48 bg-white/8 px-5 text-white shadow-inner shadow-white/5">
                  <ShieldCheck size={18} className="text-white/76" />
                  <input
                    type="password"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/72"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                  />
                </span>
              </label>
            )}

            {mode === "signin" && (
              <button
                type="button"
                onClick={() => {
                  resetFeedback();
                  setMode("forgot");
                }}
                className="block border-b border-white/50 pt-1 text-sm font-semibold text-white/86"
              >
                Forgot your password?
              </button>
            )}

            {message && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-7 flex h-14 w-full rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-500 text-base tracking-normal shadow-xl shadow-emerald-950/20 hover:from-lime-300 hover:to-emerald-400" disabled={loading}>
              {loading && <Loader2 className="mr-2 animate-spin" size={18} />}
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : mode === "register" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Update Password"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              resetFeedback();
              if (mode === "signin") setMode("register");
              else setMode("signin");
            }}
            className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-white"
          >
            {mode === "signin" ? "Don't have an account? Sign up" : (
              <>
                <ArrowLeft size={15} /> Back to Login
              </>
            )}
          </button>

          {!isSupabaseConfigured && (mode === "forgot" || mode === "reset") && (
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Supabase keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.
            </p>
          )}

          <p className="mt-12 flex items-center justify-center gap-2 text-center text-xs font-semibold text-white/74">
            <KeyRound size={14} /> Secure authentication by PayTrack
          </p>
        </section>
      </div>
    </main>
  );
}
