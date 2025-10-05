import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    // Get various statistics
    const [
      totalRequests,
      myRequests,
      myCoveredSessions,
      uncoveredSessionsNextWeek,
      uncoveredSessionsNextMonth,
      allSessionsNextWeek,
    ] = await Promise.all([
      // Total requests
      ctx.db.timeOffRequest.count(),

      // My requests
      ctx.db.timeOffRequest.count({
        where: { supervisorId: ctx.session.user.id },
      }),

      // Sessions I'm covering
      ctx.db.clinicSession.count({
        where: {
          coveredBySupervisorId: ctx.session.user.id,
          date: { gte: today },
        },
      }),

      // Uncovered sessions next 7 days
      ctx.db.clinicSession.count({
        where: {
          coveredBySupervisorId: null,
          date: {
            gte: today,
            lte: nextWeek,
          },
        },
      }),

      // Uncovered sessions next 30 days
      ctx.db.clinicSession.count({
        where: {
          coveredBySupervisorId: null,
          date: {
            gte: today,
            lte: nextMonth,
          },
        },
      }),

      // All sessions next 7 days
      ctx.db.clinicSession.count({
        where: {
          date: {
            gte: today,
            lte: nextWeek,
          },
        },
      }),
    ]);

    const coverageRate =
      allSessionsNextWeek > 0
        ? ((allSessionsNextWeek - uncoveredSessionsNextWeek) /
            allSessionsNextWeek) *
          100
        : 100;

    return {
      totalRequests,
      myRequests,
      myCoveredSessions,
      uncoveredSessions: {
        nextWeek: uncoveredSessionsNextWeek,
        nextMonth: uncoveredSessionsNextMonth,
      },
      coverageRate: Math.round(coverageRate),
    };
  }),

  getUrgentSessions: protectedProcedure.query(async ({ ctx }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const urgentSessions = await ctx.db.clinicSession.findMany({
      where: {
        coveredBySupervisorId: null,
        date: {
          gte: new Date(),
          lte: nextWeek,
        },
      },
      include: {
        request: {
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
    });

    // Categorize by urgency
    const critical = urgentSessions.filter((s) => s.date <= tomorrow);
    const urgent = urgentSessions.filter((s) => s.date > tomorrow);

    return {
      critical,
      urgent,
      total: urgentSessions.length,
    };
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const activities = await ctx.db.sessionCoverage.findMany({
      include: {
        session: {
          include: {
            request: {
              include: {
                supervisor: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        supervisor: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    });

    return activities.map((activity) => ({
      id: activity.id,
      type: activity.action,
      timestamp: activity.timestamp,
      supervisor: activity.supervisor,
      session: {
        id: activity.session.id,
        clinicName: activity.session.clinicName,
        date: activity.session.date,
        requestingSupervisor: activity.session.request.supervisor,
      },
    }));
  }),

  getUpcomingDeadlines: protectedProcedure.query(async ({ ctx }) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingRequests = await ctx.db.timeOffRequest.findMany({
      where: {
        startDate: {
          gte: new Date(),
          lte: nextWeek,
        },
      },
      include: {
        supervisor: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        clinicSessions: {
          select: {
            id: true,
            coveredBySupervisorId: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
      take: 10,
    });

    return upcomingRequests.map((request) => {
      const totalSessions = request.clinicSessions.length;
      const coveredSessions = request.clinicSessions.filter(
        (s) => s.coveredBySupervisorId,
      ).length;

      return {
        ...request,
        coverage: {
          total: totalSessions,
          covered: coveredSessions,
          percentage:
            totalSessions > 0
              ? Math.round((coveredSessions / totalSessions) * 100)
              : 0,
        },
      };
    });
  }),
});
