"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    // Check auth token before deciding where to redirect
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Show a minimal loading state while the redirect resolves
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neon/30 border-t-neon animate-spin" />
    </div>
  );
}
