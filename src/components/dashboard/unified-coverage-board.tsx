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
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";

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

interface Activity {
  id: string;
  type: string;
  timestamp: Date;
  supervisor: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  session: {
    id: string;
    clinicName: string;
    date: Date;
    requestingSupervisor: {
      name: string | null;
    };
  };
}

export default function UnifiedCoverageBoard() {
  const [claimDialog, setClaimDialog] = useState<{ open: boolean; sessionId?: string }>({
    open: false,
  });

  const utils = api.useUtils();

  // Get current user session
  const { data: currentUser } = api.supervisor.getCurrentUser.useQuery();

  // Get uncovered sessions only
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = api.clinicSession.getUncovered.useQuery({
    limit: 50,
  });

  const claimMutation = api.clinicSession.claim.useMutation({
    onSuccess: () => {
      toast.success("Session claimed");
      void refetchSessions();
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

  const SessionItem = ({ session, variant = "default" }: { session: Session; variant?: "mine" | "urgent" | "default" }) => {
    const isUrgent = variant === "urgent";
    const isMine = variant === "mine";

    return (
      <Item
        variant="outline"
        size="sm"
        className="transition-all duration-200 hover:shadow-md"
      >
        <ItemMedia variant="icon">
          <Calendar className="h-4 w-4" />
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
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </ItemTitle>

          <ItemDescription>
            {format(new Date(session.date), "MMM d, yyyy")} • {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
            {!isMine && ` • ${session.request.supervisor.name || session.request.supervisor.email}`}
            {session.notes && ` • ${session.notes}`}
          </ItemDescription>
        </ItemContent>

        {!isMine && (
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
    );
  };

  if (sessionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Sort all sessions by date
  const allSessions = [...(sessions || [])].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  return (
    <>
      <div className="pb-24">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          {allSessions.length > 0 ? (
            <ItemGroup>
              {allSessions.map((session, index) => {
                const isMine = session.request.supervisorId === currentUser?.id;
                const isUrgent = new Date(session.date).getTime() - new Date().getTime() <= 48 * 60 * 60 * 1000;

                return (
                  <Fragment key={session.id}>
                    <SessionItem
                      session={session}
                      variant={isMine ? "mine" : isUrgent ? "urgent" : "default"}
                    />
                    {index < allSessions.length - 1 && <ItemSeparator />}
                  </Fragment>
                );
              })}
            </ItemGroup>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircle2 />
                </EmptyMedia>
                <EmptyTitle>All sessions covered</EmptyTitle>
                <EmptyDescription>
                  No coverage requests at this time
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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
    </>
  );
}