"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/services/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const isPublic = pathname.startsWith('/track') || pathname.startsWith('/login');
    if (!token && !isPublic) {
      router.push('/login');
    } else {
      // eslint-disable-next-line
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-base">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-neon animate-spin"></div>
      </div>
    );
  }
  return <>{children}</>;
}
