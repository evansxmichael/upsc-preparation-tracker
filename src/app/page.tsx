"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RootPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [session, status, router]);

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0f172a] border-t-transparent" />
    </div>
  );
}