"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Search,
  Clock,
  User,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { ListSkeleton } from "@/components/common/loading-skeleton";

interface Session {
  id: string;
  clinicName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  coveredBySupervisorId?: string | null;
  request: {
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

export default function CoverageBoard() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filters, setFilters] = useState({
    status: "all", // all, uncovered, covered
    clinicName: "",
    supervisor: "all",
  });
  const [claimDialog, setClaimDialog] = useState<{ open: boolean; sessionId?: string }>({
    open: false,
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const utils = api.useUtils();

  const { data: sessions, isLoading } = api.clinicSession.getByDateRange.useQuery({
    startDate: weekStart,
    endDate: weekEnd,
    ...(filters.status === "covered" && { includeOnlyCovered: true }),
    ...(filters.status === "uncovered" && { includeOnlyUncovered: true }),
  });

  const { data: supervisors } = api.supervisor.getAll.useQuery();

  const claimMutation = api.clinicSession.claim.useMutation({
    onSuccess: () => {
      toast.success("Session claimed successfully!");
      utils.clinicSession.getByDateRange.invalidate();
      utils.dashboard.getUrgentSessions.invalidate();
      setClaimDialog({ open: false });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const thisWeek = () => setCurrentWeek(new Date());

  const filteredSessions = sessions?.filter((session) => {
    if (filters.clinicName && !session.clinicName.toLowerCase().includes(filters.clinicName.toLowerCase())) {
      return false;
    }
    if (filters.supervisor !== "all" && session.request.supervisor.id !== filters.supervisor) {
      return false;
    }
    return true;
  }) || [];

  const handleClaim = (sessionId: string) => {
    setClaimDialog({ open: true, sessionId });
  };

  const confirmClaim = () => {
    if (claimDialog.sessionId) {
      claimMutation.mutate({ sessionId: claimDialog.sessionId });
    }
  };

  const exportToCSV = () => {
    if (!filteredSessions.length) {
      toast.error("No data to export");
      return;
    }

    const csvData = filteredSessions.map(session => ({
      "Clinic Name": session.clinicName,
      "Date": format(new Date(session.date), "yyyy-MM-dd"),
      "Start Time": format(new Date(session.startTime), "HH:mm"),
      "End Time": format(new Date(session.endTime), "HH:mm"),
      "Requesting Supervisor": session.request.supervisor.name || session.request.supervisor.email,
      "Covered By": session.coveredBy?.name || session.coveredBy?.email || "Uncovered",
      "Status": session.coveredBySupervisorId ? "Covered" : "Uncovered",
      "Notes": session.notes || "",
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverage-report-${format(weekStart, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const SessionCard = ({ session }: { session: Session }) => (
    <Card className={`${session.coveredBySupervisorId ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-gray-900">{session.clinicName}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={session.coveredBySupervisorId ? "success" : "destructive"} className="text-xs">
                {session.coveredBySupervisorId ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Covered
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Uncovered
                  </>
                )}
              </Badge>
              <span className="text-xs text-gray-600">
                {format(new Date(session.date), "MMM d")}
              </span>
            </div>
          </div>
          {!session.coveredBySupervisorId && (
            <Button
              size="sm"
              onClick={() => handleClaim(session.id)}
              disabled={claimMutation.isPending}
            >
              Claim
            </Button>
          )}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-3 w-3" />
            {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-3 w-3" />
            Requested by {session.request.supervisor.name || session.request.supervisor.email}
          </div>
          {session.coveredBy && (
            <div className="text-green-700 text-xs font-medium">
              Covered by {session.coveredBy.name || session.coveredBy.email}
            </div>
          )}
          {session.notes && (
            <div className="text-xs text-gray-500 italic mt-2">
              Note: {session.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const CalendarView = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const daySessions = filteredSessions.filter(
            session => format(new Date(session.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
          );

          return (
            <div key={index} className="space-y-2">
              <div className="text-center">
                <div className="font-medium text-gray-900">{days[index]}</div>
                <div className="text-sm text-gray-600">{format(day, "MMM d")}</div>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {daySessions.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
                {daySessions.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-8">
                    No sessions
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ListView = () => (
    <div className="space-y-3">
      {filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No sessions found for the selected week and filters.</p>
        </div>
      ) : (
        filteredSessions.map(session => (
          <SessionCard key={session.id} session={session} />
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Coverage for Week of {format(weekStart, "MMM d, yyyy")}</CardTitle>
                <CardDescription>
                  {filteredSessions.length} session(s) • {filteredSessions.filter(s => !s.coveredBySupervisorId).length} uncovered
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
                  <TabsList>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4 mr-2" />
                      List
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendar
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
                Previous Week
              </Button>
              <Button variant="outline" onClick={thisWeek}>
                This Week
              </Button>
              <Button variant="outline" onClick={nextWeek}>
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    <SelectItem value="uncovered">Uncovered Only</SelectItem>
                    <SelectItem value="covered">Covered Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supervisor">Supervisor</Label>
                <Select value={filters.supervisor} onValueChange={(value) => setFilters({ ...filters, supervisor: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Supervisors</SelectItem>
                    {supervisors?.map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name || supervisor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">Search Clinics</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search clinic names..."
                    value={filters.clinicName}
                    onChange={(e) => setFilters({ ...filters, clinicName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ status: "all", clinicName: "", supervisor: "all" })}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <ListSkeleton count={6} />
        ) : view === "calendar" ? (
          <CalendarView />
        ) : (
          <ListView />
        )}
      </div>

      <ConfirmationDialog
        open={claimDialog.open}
        onOpenChange={(open) => setClaimDialog({ open })}
        title="Claim Coverage Session"
        description="Are you sure you want to claim this session? This will assign you as the covering supervisor."
        confirmText="Claim Session"
        onConfirm={confirmClaim}
        loading={claimMutation.isPending}
      />
    </>
  );
}