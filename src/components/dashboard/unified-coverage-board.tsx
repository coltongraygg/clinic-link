"use client";

import { Fragment, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  HandRaisedIcon,
} from "@heroicons/react/24/solid";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface Session {
  id: string;
  clinicName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  coveredBySupervisorId?: string | null;
  request: {
    id: string;
    supervisorId: string;
    supervisor: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
  coveredBy?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export default function UnifiedCoverageBoard() {
  const [claimDialog, setClaimDialog] = useState<{
    open: boolean;
    sessionId?: string;
  }>({
    open: false,
  });

  const [unclaimDialog, setUnclaimDialog] = useState<{
    open: boolean;
    sessionId?: string;
  }>({
    open: false,
  });

  // Get current user session
  const { data: currentUser } = api.supervisor.getCurrentUser.useQuery();

  // Get uncovered sessions only
  const {
    data: sessions,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = api.clinicSession.getUncovered.useQuery({
    limit: 50,
  });

  const claimMutation = api.clinicSession.claim.useMutation({
    onSuccess: () => {
      toast.success("Session claimed");
      void refetchSessions();
      void refetchCoverage();
      setClaimDialog({ open: false });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const releaseMutation = api.clinicSession.release.useMutation({
    onSuccess: () => {
      toast.success("Session released");
      void refetchSessions();
      void refetchCoverage();
      setUnclaimDialog({ open: false });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Get user's own requests
  const { data: myRequests } = api.timeOffRequest.getMyRequests.useQuery();

  // Get sessions user is covering
  const { data: myCoverage, refetch: refetchCoverage } =
    api.clinicSession.getMyCoverage.useQuery();

  const handleClaim = (sessionId: string) => {
    setClaimDialog({ open: true, sessionId });
  };

  const confirmClaim = () => {
    if (claimDialog.sessionId) {
      claimMutation.mutate({ sessionId: claimDialog.sessionId });
    }
  };

  const handleUnclaim = (sessionId: string) => {
    setUnclaimDialog({ open: true, sessionId });
  };

  const confirmUnclaim = () => {
    if (unclaimDialog.sessionId) {
      releaseMutation.mutate({ sessionId: unclaimDialog.sessionId });
    }
  };

  const SessionItem = ({
    session,
    variant = "default",
  }: {
    session: Session;
    variant?: "mine" | "urgent" | "default" | "covering";
  }) => {
    const isUrgent = variant === "urgent";
    const isMine = variant === "mine";
    const isCovering = variant === "covering";

    return (
      <Item
        variant="outline"
        size="sm"
        className="transition-all duration-200 hover:shadow-md"
      >
        <ItemMedia variant="icon">
          <CalendarIcon className="h-4 w-4" />
        </ItemMedia>

        <ItemContent>
          <ItemTitle>
            {session.clinicName}
            {isMine && (
              <Badge variant="secondary" className="ml-2">
                Your time off
              </Badge>
            )}
            {isUrgent && (
              <Badge variant="destructive" className="ml-2">
                <ExclamationTriangleIcon className="mr-1 h-3 w-3" />
                Urgent
              </Badge>
            )}
            {isCovering && (
              <Badge variant="outline" className="ml-2">
                <CheckCircleIcon className="mr-1 h-3 w-3" />
                Covering
              </Badge>
            )}
          </ItemTitle>

          <ItemDescription>
            {format(new Date(session.date), "MMM d, yyyy")} •{" "}
            {format(new Date(session.startTime), "h:mm a")} -{" "}
            {format(new Date(session.endTime), "h:mm a")}
            {!isMine &&
              ` • ${session.request.supervisor.name ?? session.request.supervisor.email}`}
            {session.notes && ` • ${session.notes}`}
          </ItemDescription>
        </ItemContent>

        {isCovering ? (
          <ItemActions>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUnclaim(session.id)}
              disabled={releaseMutation.isPending}
            >
              Unclaim
            </Button>
          </ItemActions>
        ) : !isMine ? (
          <ItemActions>
            <Button
              size="sm"
              onClick={() => handleClaim(session.id)}
              disabled={claimMutation.isPending}
            >
              Claim
            </Button>
          </ItemActions>
        ) : null}
      </Item>
    );
  };

  if (sessionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Extract uncovered sessions from user's requests
  const myUncoveredSessions =
    myRequests
      ?.flatMap((request) =>
        request.clinicSessions
          .filter((session) => !session.coveredBySupervisorId)
          .map((session) => ({
            ...session,
            request: {
              id: request.id,
              supervisorId: request.supervisorId,
              supervisor: {
                id: currentUser?.id ?? "",
                name: currentUser?.name ?? null,
                email: currentUser?.email ?? null,
                image: currentUser?.image ?? null,
              },
            },
          })),
      )
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) ?? [];

  // Filter sessions to exclude user's own
  const availableToClaimSessions = [...(sessions ?? [])]
    .filter((session) => session.request.supervisorId !== currentUser?.id)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

  return (
    <>
      <div className="pb-24">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
          {/* My Time Off Section */}
          {myUncoveredSessions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                  <ClockIcon className="text-primary h-3.5 w-3.5" />
                </div>
                <span className="text-muted-foreground text-sm font-medium">
                  My Time Off
                </span>
              </div>
              <ItemGroup>
                {myUncoveredSessions.map((session, index) => (
                  <Fragment key={session.id}>
                    <SessionItem session={session as Session} variant="mine" />
                    {index < myUncoveredSessions.length - 1 && (
                      <ItemSeparator />
                    )}
                  </Fragment>
                ))}
              </ItemGroup>
            </div>
          )}

          {/* Sessions I'm Covering */}
          {myCoverage && myCoverage.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-muted-foreground text-sm font-medium">
                  Sessions I&apos;m Covering
                </span>
              </div>
              <ItemGroup>
                {myCoverage.map((session, index) => (
                  <Fragment key={session.id}>
                    <SessionItem
                      session={session as Session}
                      variant="covering"
                    />
                    {index < myCoverage.length - 1 && <ItemSeparator />}
                  </Fragment>
                ))}
              </ItemGroup>
            </div>
          )}

          {/* Available to Cover Section */}
          {availableToClaimSessions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="bg-accent/50 flex h-6 w-6 items-center justify-center rounded-full">
                  <HandRaisedIcon className="text-accent-foreground h-3.5 w-3.5" />
                </div>
                <span className="text-muted-foreground text-sm font-medium">
                  Available to Cover
                </span>
              </div>
              <ItemGroup>
                {availableToClaimSessions.map((session, index) => {
                  const isUrgent =
                    new Date(session.date).getTime() - new Date().getTime() <=
                    48 * 60 * 60 * 1000;

                  return (
                    <Fragment key={session.id}>
                      <SessionItem
                        session={session}
                        variant={isUrgent ? "urgent" : "default"}
                      />
                      {index < availableToClaimSessions.length - 1 && (
                        <ItemSeparator />
                      )}
                    </Fragment>
                  );
                })}
              </ItemGroup>
            </div>
          ) : (
            !myUncoveredSessions.length && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckCircleIcon />
                  </EmptyMedia>
                  <EmptyTitle>All sessions covered</EmptyTitle>
                  <EmptyDescription>
                    No coverage requests at this time
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={claimDialog.open}
        onOpenChange={(open) => setClaimDialog({ open })}
        title="Claim session"
        description="This will assign you as the covering supervisor for this session."
        confirmText="Claim"
        onConfirm={confirmClaim}
        loading={claimMutation.isPending}
      />

      <ConfirmationDialog
        open={unclaimDialog.open}
        onOpenChange={(open) => setUnclaimDialog({ open })}
        title="Release session"
        description="This will remove you as the covering supervisor and make the session available again."
        confirmText="Release"
        onConfirm={confirmUnclaim}
        loading={releaseMutation.isPending}
      />
    </>
  );
}
