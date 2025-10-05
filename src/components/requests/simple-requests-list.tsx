"use client";

import { Fragment } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { Calendar, CheckCircle2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

export default function SimpleRequestsList() {
  const { data: currentUser } = api.supervisor.getCurrentUser.useQuery();
  const { data: sessions, isLoading } = api.clinicSession.getUncovered.useQuery({
    limit: 100,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Filter to only show MY sessions that need coverage
  const mySessions = sessions?.filter(
    (s) => s.request.supervisorId === currentUser?.id
  ) || [];

  // Sort by date
  const sortedSessions = [...mySessions].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (sortedSessions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2 />
          </EmptyMedia>
          <EmptyTitle>No coverage needed</EmptyTitle>
          <EmptyDescription>
            You don't have any sessions needing coverage
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup>
      {sortedSessions.map((session, index) => (
        <Fragment key={session.id}>
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon">
              <Calendar className="h-4 w-4" />
            </ItemMedia>

            <ItemContent>
              <ItemTitle>
                {session.clinicName}
                <Badge variant="secondary" className="ml-2">
                  Needs coverage
                </Badge>
              </ItemTitle>

              <ItemDescription>
                {format(new Date(session.date), "MMM d, yyyy")} •{" "}
                {format(new Date(session.startTime), "h:mm a")} -{" "}
                {format(new Date(session.endTime), "h:mm a")}
                {session.notes && ` • ${session.notes}`}
              </ItemDescription>
            </ItemContent>
          </Item>
          {index < sortedSessions.length - 1 && <ItemSeparator />}
        </Fragment>
      ))}
    </ItemGroup>
  );
}
