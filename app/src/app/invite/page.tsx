"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function InviteRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (token) {
      router.replace(`/invite/${token}`);
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1c2b3a]">
        <p className="text-white">Invalid invitation link.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c2b3a]">
      <p className="text-white">Redirecting...</p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1c2b3a]"><p className="text-white">Loading...</p></div>}>
      <InviteRedirect />
    </Suspense>
  );
}
