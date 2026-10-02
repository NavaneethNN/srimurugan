"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new dashboard
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400" />
        <p className="mt-4 text-gray-400">Loading admin panel...</p>
      </div>
    </div>
  );
}
