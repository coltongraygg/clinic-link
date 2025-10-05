"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/trpc/react";
import { signOut } from "next-auth/react";
import Image from "next/image";

export function TopBar() {
  const { data: currentUser } = api.supervisor.getCurrentUser.useQuery();

  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <header className="bg-card/95 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/clinic-link-logo.png"
            alt="Clinic Link"
            width={120}
            height={120}
            className="h-10 w-auto"
            priority
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Profile Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={currentUser?.image ?? undefined}
                    alt={currentUser?.name ?? "User"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{currentUser?.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {currentUser?.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  Sign Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
