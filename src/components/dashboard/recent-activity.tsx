"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { api } from "@/trpc/react";

export default function RecentActivitySection() {
  const { data: activities, isLoading } =
    api.dashboard.getRecentActivity.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest coverage actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest coverage actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 border-b pb-3 last:border-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.supervisor.image ?? undefined} />
                    <AvatarFallback>
                      {activity.supervisor.name?.charAt(0) ??
                        activity.supervisor.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {activity.supervisor.name ?? activity.supervisor.email}
                      </span>
                      <Badge
                        variant={
                          activity.type === "CLAIMED" ? "success" : "secondary"
                        }
                        className="text-xs"
                      >
                        {activity.type === "CLAIMED" ? (
                          <>
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Claimed
                          </>
                        ) : (
                          <>
                            <ArrowLeft className="mr-1 h-3 w-3" />
                            Released
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {activity.session.clinicName} on{" "}
                      {format(new Date(activity.session.date), "MMM d")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested by {activity.session.requestingSupervisor.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
