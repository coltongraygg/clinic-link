"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Plus
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import Link from "next/link";

interface Session {
  id: string;
  clinicName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  coveredBySupervisorId?: string | null;
  coveredBy?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

interface TimeOffRequest {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  clinicSessions: Session[];
  coverageProgress: {
    total: number;
    covered: number;
  };
}

interface MyRequestsListProps {
  initialRequests: TimeOffRequest[];
}

export default function MyRequestsList({ initialRequests }: MyRequestsListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; requestId?: string }>({
    open: false,
  });

  const utils = api.useUtils();

  const { data: requests } = api.timeOffRequest.getMyRequests.useQuery(
    undefined,
    {
      initialData: initialRequests,
    }
  );

  const deleteRequestMutation = api.timeOffRequest.delete.useMutation({
    onSuccess: () => {
      toast.success("Request deleted successfully");
      utils.timeOffRequest.getMyRequests.invalidate();
      setDeleteDialog({ open: false });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "destructive";
      case "PARTIAL_COVERED":
        return "secondary";
      case "FULLY_COVERED":
        return "success";
      case "COMPLETE":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Needs Coverage";
      case "PARTIAL_COVERED":
        return "Partially Covered";
      case "FULLY_COVERED":
        return "Fully Covered";
      case "COMPLETE":
        return "Complete";
      default:
        return status;
    }
  };

  const canDelete = (request: TimeOffRequest) => {
    return request.coverageProgress.covered === 0;
  };

  const handleDelete = (requestId: string) => {
    setDeleteDialog({ open: true, requestId });
  };

  const confirmDelete = () => {
    if (deleteDialog.requestId) {
      deleteRequestMutation.mutate(deleteDialog.requestId);
    }
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No coverage requests</h3>
        <p className="text-gray-600 mb-6">
          You haven't submitted any coverage requests yet.
        </p>
        <Link href="/request">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Request
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(request.startDate), "MMM d")} - {format(new Date(request.endDate), "MMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>
                    Submitted {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(request.status) as any}>
                    {getStatusText(request.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coverage Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Coverage Progress</span>
                  <span className="text-sm text-gray-600">
                    {request.coverageProgress.covered} of {request.coverageProgress.total} sessions covered
                  </span>
                </div>
                <Progress
                  value={(request.coverageProgress.covered / request.coverageProgress.total) * 100}
                  className="h-2"
                />
              </div>

              {/* Sessions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Sessions ({request.clinicSessions.length})
                </h4>
                <div className="grid gap-3">
                  {request.clinicSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border ${
                        session.coveredBySupervisorId
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{session.clinicName}</div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(session.date), "MMM d, yyyy")} •
                            {format(new Date(session.startTime), "h:mm a")} -
                            {format(new Date(session.endTime), "h:mm a")}
                          </div>
                          {session.notes && (
                            <div className="text-sm text-gray-500 mt-1 italic">
                              Note: {session.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {session.coveredBySupervisorId ? (
                            <div className="flex items-center text-green-700">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                Covered by {session.coveredBy?.name || session.coveredBy?.email}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-700">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Needs coverage</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {request.coverageProgress.covered === request.coverageProgress.total ? (
                    <span className="text-green-600 font-medium">All sessions covered!</span>
                  ) : (
                    <span>
                      {request.coverageProgress.total - request.coverageProgress.covered} session(s) still need coverage
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {canDelete(request) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(request.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {request.coverageProgress.covered > 0 && canDelete(request) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some sessions have been covered. You can only delete requests with no covered sessions.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
        title="Delete Coverage Request"
        description="Are you sure you want to delete this coverage request? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deleteRequestMutation.isPending}
      />
    </>
  );
}