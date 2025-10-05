"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Grid3x3, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/my-requests",
    label: "Requests",
    icon: ListChecks,
  },
  {
    href: "/coverage",
    label: "Coverage",
    icon: Grid3x3,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:hidden">
      <div className="relative flex items-center justify-around h-16">
        {/* Left nav items */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            pathname === "/dashboard"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className={cn("h-5 w-5", pathname === "/dashboard" && "fill-primary/20")} />
          <span className="text-xs font-medium">Home</span>
        </Link>

        <Link
          href="/my-requests"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            pathname === "/my-requests"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListChecks className={cn("h-5 w-5", pathname === "/my-requests" && "fill-primary/20")} />
          <span className="text-xs font-medium">Requests</span>
        </Link>

        {/* Center FAB */}
        <div className="flex-1 flex items-center justify-center">
          <Link href="/request">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg -mt-8"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {/* Right nav item */}
        <Link
          href="/coverage"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            pathname === "/coverage"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Grid3x3 className={cn("h-5 w-5", pathname === "/coverage" && "fill-primary/20")} />
          <span className="text-xs font-medium">Coverage</span>
        </Link>
      </div>
    </nav>
  );
}
