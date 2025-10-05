"use client";

import { Fragment, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import { Calendar, CheckCircle2, User } from "lucide-react";
import { api } from "@/trpc/react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { toast } from "sonner";

export default function SimpleCoverageList() {
  const [claimDialog, setClaimDialog] = useState<{ open: boolean; sessionId?: string }>({
    open: false,
  });

  const utils = api.useUtils();
  const { data: currentUser } = api.supervisor.getCurrentUser.useQuery();

  const { data: allSessions, isLoading } = api.clinicSession.getUpcoming.useQuery({
    days: 30,
  });

  const claimMutation = api.clinicSession.claim.useMutation({
    onSuccess: () => {
      toast.success("Session claimed");
      void utils.clinicSession.getUpcoming.invalidate();
      setClaimDialog({ open: false });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClaim = (sessionId: string) => {
    setClaimDialog({ open: true, sessionId });
  };

  const confirmClaim = () => {
    if (claimDialog.sessionId) {
      claimMutation.mutate({ sessionId: claimDialog.sessionId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Sort by date
  const sortedSessions = [...(allSessions || [])].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (sortedSessions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2 />
          </EmptyMedia>
          <EmptyTitle>No upcoming sessions</EmptyTitle>
          <EmptyDescription>
            No sessions scheduled in the next 30 days
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <ItemGroup>
        {sortedSessions.map((session, index) => {
          const isMine = session.request.supervisorId === currentUser?.id;
          const isCovered = !!session.coveredBySupervisorId;

          return (
            <Fragment key={session.id}>
              <Item variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Calendar className="h-4 w-4" />
                </ItemMedia>

                <ItemContent>
                  <ItemTitle>
                    {session.clinicName}
                    {isCovered && (
                      <Badge variant="outline" className="ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Covered
                      </Badge>
                    )}
                    {!isCovered && isMine && (
                      <Badge variant="secondary" className="ml-2">
                        Your time off
                      </Badge>
                    )}
                  </ItemTitle>

                  <ItemDescription>
                    {format(new Date(session.date), "MMM d, yyyy")} •{" "}
                    {format(new Date(session.startTime), "h:mm a")} -{" "}
                    {format(new Date(session.endTime), "h:mm a")} •{" "}
                    {session.request.supervisor.name || session.request.supervisor.email}
                    {isCovered && session.coveredBy && (
                      <> • Covered by {session.coveredBy.name || session.coveredBy.email}</>
                    )}
                    {session.notes && ` • ${session.notes}`}
                  </ItemDescription>
                </ItemContent>

                {!isMine && !isCovered && (
                  <ItemActions>
                    <Button
                      size="sm"
                      onClick={() => handleClaim(session.id)}
                      disabled={claimMutation.isPending}
                    >
                      Claim
                    </Button>
                  </ItemActions>
                )}
              </Item>
              {index < sortedSessions.length - 1 && <ItemSeparator />}
            </Fragment>
          );
        })}
      </ItemGroup>

      <ConfirmationDialog
        open={claimDialog.open}
        onOpenChange={(open) => setClaimDialog({ open })}
        title="Claim session"
        description="This will assign you as the covering supervisor for this session."
        confirmText="Claim"
        onConfirm={confirmClaim}
        loading={claimMutation.isPending}
      />
    </>
  );
}
