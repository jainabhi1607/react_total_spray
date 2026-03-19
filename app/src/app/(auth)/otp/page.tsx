"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const userId = searchParams.get("uid") || (session?.user as any)?.id || "";
  const rawCallback = searchParams.get("cb") || "/dashboard";
  // Prevent open redirect — only allow relative paths starting with a single /
  const callbackUrl = /^\/[^/]/.test(rawCallback) || rawCallback === "/" ? rawCallback : "/dashboard";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load

    // Already verified — go to dashboard
    if ((session?.user as any)?.otpVerified) {
      router.replace(callbackUrl);
      return;
    }

    // No uid param AND no session — not coming from login flow, go to login
    if (!searchParams.get("uid") && !(session?.user as any)?.id) {
      router.replace("/login");
    }
  }, [status, session, searchParams, callbackUrl, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        // Update the session JWT to mark OTP as verified
        await update({ otpVerified: true });
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                />
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Verify"}
            </Button>
            <div className="text-center">
              {resendSuccess ? (
                <span className="text-sm text-green-600 font-medium">Code sent!</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend code"}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center p-8">Loading...</div>}>
      <OtpForm />
    </Suspense>
  );
}
