"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-card/95 supports-[backdrop-filter]:bg-card/60 fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        <Link
          href="/dashboard"
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all active:scale-95",
            pathname === "/dashboard"
              ? "text-primary"
              : "text-muted-foreground active:bg-accent/50",
          )}
        >
          {pathname === "/dashboard" && (
            <div className="bg-primary/10 absolute inset-0 rounded-xl" />
          )}
          <HomeIcon className="relative z-10 h-5 w-5" />
          <span className="relative z-10 text-xs font-medium">Home</span>
        </Link>

        <Link
          href="/coverage"
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all active:scale-95",
            pathname === "/coverage"
              ? "text-primary"
              : "text-muted-foreground active:bg-accent/50",
          )}
        >
          {pathname === "/coverage" && (
            <div className="bg-primary/10 absolute inset-0 rounded-xl" />
          )}
          <Squares2X2Icon className="relative z-10 h-5 w-5" />
          <span className="relative z-10 text-xs font-medium">Coverage</span>
        </Link>

        <Link
          href="/request"
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all active:scale-95",
            pathname === "/request"
              ? "text-primary"
              : "text-muted-foreground active:bg-accent/50",
          )}
        >
          {pathname === "/request" && (
            <div className="bg-primary/10 absolute inset-0 rounded-xl" />
          )}
          <PlusCircleIcon className="relative z-10 h-5 w-5" />
          <span className="relative z-10 text-xs font-medium">New Request</span>
        </Link>
      </div>
    </nav>
  );
}
