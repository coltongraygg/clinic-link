import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/solid";

interface StatsCardsProps {
  stats: {
    totalRequests: number;
    myRequests: number;
    myCoveredSessions: number;
    uncoveredSessions: {
      nextWeek: number;
      nextMonth: number;
    };
    coverageRate: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Coverage Rate</CardTitle>
          <ArrowTrendingUpIcon className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.coverageRate}%</div>
          <p className="text-muted-foreground text-xs">Next 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Uncovered Sessions
          </CardTitle>
          <ExclamationCircleIcon className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uncoveredSessions.nextWeek}
          </div>
          <p className="text-muted-foreground text-xs">Next 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Coverage</CardTitle>
          <CheckCircleIcon className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.myCoveredSessions}</div>
          <p className="text-muted-foreground text-xs">Upcoming sessions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Requests</CardTitle>
          <DocumentTextIcon className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.myRequests}</div>
          <p className="text-muted-foreground text-xs">Total requests</p>
        </CardContent>
      </Card>
    </div>
  );
}
