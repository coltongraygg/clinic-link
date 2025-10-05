"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
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

export default function MyRequestsList() {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    requestId?: string;
  }>({
    open: false,
  });

  const utils = api.useUtils();

  const { data: requests } = api.timeOffRequest.getMyRequests.useQuery();

  const deleteRequestMutation = api.timeOffRequest.delete.useMutation({
    onSuccess: () => {
      toast.success("Request deleted successfully");
      void utils.timeOffRequest.getMyRequests.invalidate();
      setDeleteDialog({ open: false });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (
    status: string,
  ): "destructive" | "secondary" | "outline" | "default" => {
    switch (status) {
      case "PENDING":
        return "destructive";
      case "PARTIAL_COVERED":
        return "secondary";
      case "FULLY_COVERED":
        return "secondary";
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
      <div className="py-12 text-center">
        <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No coverage requests
        </h3>
        <p className="mb-6 text-gray-600">
          You haven&apos;t submitted any coverage requests yet.
        </p>
        <Link href="/request">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
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
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(request.startDate), "MMM d")} -{" "}
                    {format(new Date(request.endDate), "MMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>
                    Submitted{" "}
                    {format(
                      new Date(request.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coverage Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Coverage Progress</span>
                  <span className="text-sm text-gray-600">
                    {request.coverageProgress.covered} of{" "}
                    {request.coverageProgress.total} sessions covered
                  </span>
                </div>
                <Progress
                  value={
                    (request.coverageProgress.covered /
                      request.coverageProgress.total) *
                    100
                  }
                  className="h-2"
                />
              </div>

              {/* Sessions */}
              <div>
                <h4 className="mb-3 flex items-center font-medium">
                  <ClockIcon className="mr-2 h-4 w-4" />
                  Sessions ({request.clinicSessions.length})
                </h4>
                <div className="grid gap-3">
                  {request.clinicSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`rounded-lg border p-3 ${
                        session.coveredBySupervisorId
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {session.clinicName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(session.date), "MMM d, yyyy")} •
                            {format(new Date(session.startTime), "h:mm a")} -
                            {format(new Date(session.endTime), "h:mm a")}
                          </div>
                          {session.notes && (
                            <div className="mt-1 text-sm text-gray-500 italic">
                              Note: {session.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {session.coveredBySupervisorId ? (
                            <div className="flex items-center text-green-700">
                              <CheckCircleIcon className="mr-1 h-4 w-4" />
                              <span className="text-sm">
                                Covered by{" "}
                                {session.coveredBy?.name ??
                                  session.coveredBy?.email}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-700">
                              <ExclamationCircleIcon className="mr-1 h-4 w-4" />
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
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-500">
                  {request.coverageProgress.covered ===
                  request.coverageProgress.total ? (
                    <span className="font-medium text-green-600">
                      All sessions covered!
                    </span>
                  ) : (
                    <span>
                      {request.coverageProgress.total -
                        request.coverageProgress.covered}{" "}
                      session(s) still need coverage
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <EyeIcon className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {canDelete(request) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(request.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {request.coverageProgress.covered > 0 && canDelete(request) && (
                <Alert>
                  <ExclamationCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Some sessions have been covered. You can only delete
                    requests with no covered sessions.
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
