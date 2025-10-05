"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Clock,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface UrgentSession {
  id: string;
  clinicName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  request: {
    supervisor: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
}

interface UrgentCoverageSectionProps {
  urgentSessions: {
    critical: UrgentSession[];
    urgent: UrgentSession[];
    total: number;
  };
}

export default function UrgentCoverageSection({ urgentSessions }: UrgentCoverageSectionProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const claimMutation = api.clinicSession.claim.useMutation({
    onSuccess: () => {
      toast.success("Session claimed successfully!");
      utils.dashboard.getUrgentSessions.invalidate();
      utils.dashboard.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClaim = async (sessionId: string) => {
    claimMutation.mutate({ sessionId });
  };

  const SessionCard = ({ session, isCritical }: { session: UrgentSession; isCritical: boolean }) => (
    <div className={`p-4 rounded-lg border ${isCritical ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-900">{session.clinicName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isCritical ? "destructive" : "secondary"} className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {isCritical ? "Critical" : "Urgent"}
            </Badge>
            <span className="text-xs text-gray-600">
              {format(new Date(session.date), "MMM d")}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => handleClaim(session.id)}
          disabled={claimMutation.isPending}
        >
          Claim
        </Button>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-3 w-3" />
          {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <User className="h-3 w-3" />
          {session.request.supervisor.name || session.request.supervisor.email}
        </div>
        {session.notes && (
          <div className="text-xs text-gray-500 italic mt-2">
            Note: {session.notes}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Urgent Coverage Needs
        </CardTitle>
        <CardDescription>
          Sessions requiring immediate coverage attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {urgentSessions.total === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>All sessions are covered for the next week!</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {urgentSessions.critical.map((session) => (
                  <SessionCard key={session.id} session={session} isCritical={true} />
                ))}
                {urgentSessions.urgent.map((session) => (
                  <SessionCard key={session.id} session={session} isCritical={false} />
                ))}
              </div>
            </ScrollArea>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => router.push('/coverage')}
            >
              View All Uncovered Sessions
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}