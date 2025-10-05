"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Grid3x3, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-card/95 supports-[backdrop-filter]:bg-card/60 fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur md:hidden">
      <div className="relative flex h-16 items-center justify-around">
        {/* Left nav items */}
        <Link
          href="/dashboard"
          className={cn(
            "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
            pathname === "/dashboard"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Home
            className={cn(
              "h-5 w-5",
              pathname === "/dashboard" && "fill-primary/20",
            )}
          />
          <span className="text-xs font-medium">Home</span>
        </Link>

        <Link
          href="/my-requests"
          className={cn(
            "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
            pathname === "/my-requests"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ListChecks
            className={cn(
              "h-5 w-5",
              pathname === "/my-requests" && "fill-primary/20",
            )}
          />
          <span className="text-xs font-medium">Requests</span>
        </Link>

        {/* Center FAB */}
        <div className="flex flex-1 items-center justify-center">
          <Link href="/request">
            <Button
              size="lg"
              className="-mt-8 h-14 w-14 rounded-full shadow-lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {/* Right nav item */}
        <Link
          href="/coverage"
          className={cn(
            "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors",
            pathname === "/coverage"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Grid3x3
            className={cn(
              "h-5 w-5",
              pathname === "/coverage" && "fill-primary/20",
            )}
          />
          <span className="text-xs font-medium">Coverage</span>
        </Link>
      </div>
    </nav>
  );
}
