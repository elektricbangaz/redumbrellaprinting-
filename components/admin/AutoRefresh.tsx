"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export function AutoRefresh({ every = 15000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => { const timer = window.setInterval(() => router.refresh(), every); return () => window.clearInterval(timer); }, [router, every]);
  return null;
}
