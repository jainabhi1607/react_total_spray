"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function InviteTokenPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [invalidMessage, setInvalidMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Invitation";
  }, []);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/auth/invite-details?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (json.success) {
          setEmail(json.data.email);
          setCompanyName(json.data.companyName);
        } else {
          setInvalidMessage(json.error || "Invalid invitation link");
        }
      } catch {
        setInvalidMessage("Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    }
    if (token) fetchDetails();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptedTerms) {
      setError("You must accept the Terms of Service");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: firstName.trim(),
          lastName: lastName.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/login?invited=true");
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1c2b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (invalidMessage) {
    return (
      <div className="min-h-screen bg-[#1c2b3a] flex flex-col">
        <header className="flex items-center justify-between px-10 py-6">
          <Image src="/logo.svg" alt="Total Spray Care" width={140} height={50} />
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            Return to login
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-lg">{invalidMessage}</p>
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm mt-4 inline-block">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c2b3a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 shrink-0">
        <Image src="/logo.svg" alt="Total Spray Care" width={140} height={50} />
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
          Return to login
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 px-10 pb-10">
        <div className="max-w-[820px] mx-auto">
          {/* Introduction */}
          <p className="text-white text-[15px] leading-relaxed mb-2">
            You have been invited to create an account for Total Spray Care&apos;s Maintenance Management platform.
          </p>
          <p className="text-white/80 text-[14px] leading-relaxed mb-8">
            To get started, please fill in your details below. This account will allow you to access your company&apos;s service history, equipment records, and support portal.
          </p>

          {error && (
            <div className="rounded-[10px] bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-300 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Details Section */}
            <h3 className="text-white font-bold text-[15px] mb-4">Details</h3>
            <div className="space-y-3 mb-8">
              <div className="flex items-baseline gap-6">
                <span className="text-cyan-400 text-sm w-[130px] shrink-0">Company Name</span>
                <span className="text-white text-sm">{companyName || "-"}</span>
              </div>
              <div className="flex items-baseline gap-6">
                <span className="text-cyan-400 text-sm w-[130px] shrink-0">Your Email</span>
                <span className="text-white text-sm">{email}</span>
              </div>
            </div>

            {/* Your Details Section */}
            <h3 className="text-white font-bold text-[15px] mb-4">Your Details</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name *"
                  className="w-full bg-transparent border-b border-[#3a5060] text-white text-sm pb-3 pt-1 placeholder:text-cyan-400 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name *"
                  className="w-full bg-transparent border-b border-[#3a5060] text-white text-sm pb-3 pt-1 placeholder:text-cyan-400 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Section */}
            <h3 className="text-white font-bold text-[15px] mb-4">Password</h3>
            <div className="grid grid-cols-2 gap-6 mb-2">
              <div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password *"
                  className="w-full bg-transparent border-b border-[#3a5060] text-white text-sm pb-3 pt-1 placeholder:text-cyan-400 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password *"
                  className="w-full bg-transparent border-b border-[#3a5060] text-white text-sm pb-3 pt-1 placeholder:text-cyan-400 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end mb-8">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-cyan-400 text-sm hover:text-cyan-300 cursor-pointer"
              >
                {showPassword ? "Hide Password" : "Show Password"}
              </button>
            </div>

            {/* Terms of Service */}
            <h3 className="text-white font-bold text-[15px] mb-4">Terms of Service</h3>
            <p className="text-white/80 text-[13px] leading-relaxed mb-5">
              By creating this account, you agree to Total Spraybooth Care&apos;s{" "}
              <a href="#" className="text-cyan-400 underline hover:text-cyan-300">Terms of Service</a>
              {" "}and confirm that you&apos;re authorised to act on behalf of the business. You&apos;re responsible for using the system appropriately, keeping login details secure, and managing your company&apos;s users and their access.
            </p>
            <label className="flex items-start gap-3 mb-8 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-[#3a5060] bg-transparent text-cyan-500 focus:ring-cyan-500 shrink-0"
              />
              <span className="text-white text-sm">
                I accept the Terms of Service on behalf of {companyName || "the company"} *
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[10px] bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
