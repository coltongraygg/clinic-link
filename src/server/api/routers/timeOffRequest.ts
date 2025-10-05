import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { RequestStatus, NotificationType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const createNotification = async (
  db: any,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) => {
  return await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
    },
  });
};

export const timeOffRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        sessions: z.array(
          z.object({
            clinicName: z.string().min(1),
            date: z.date(),
            startTime: z.date(),
            endTime: z.date(),
            notes: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate dates
      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Create the time off request with sessions
      const request = await ctx.db.timeOffRequest.create({
        data: {
          supervisorId: ctx.session.user.id,
          startDate: input.startDate,
          endDate: input.endDate,
          status: RequestStatus.PENDING,
          clinicSessions: {
            create: input.sessions.map(session => ({
              clinicName: session.clinicName,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              notes: session.notes,
            })),
          },
        },
        include: {
          clinicSessions: true,
        },
      });

      // Notify all other supervisors
      const otherSupervisors = await ctx.db.user.findMany({
        where: {
          id: { not: ctx.session.user.id },
          isActive: true,
        },
      });

      await Promise.all(
        otherSupervisors.map(supervisor =>
          createNotification(
            ctx.db,
            supervisor.id,
            NotificationType.NEW_REQUEST,
            "New Coverage Request",
            `${ctx.session.user.name} has requested coverage for ${input.sessions.length} session(s)`,
            { requestId: request.id }
          )
        )
      );

      return request;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(RequestStatus).optional(),
        supervisorId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input?.status) {
        where.status = input.status;
      }
      if (input?.supervisorId) {
        where.supervisorId = input.supervisorId;
      }
      if (input?.startDate || input?.endDate) {
        where.startDate = {};
        if (input?.startDate) {
          where.startDate.gte = input.startDate;
        }
        if (input?.endDate) {
          where.endDate = { lte: input.endDate };
        }
      }

      const requests = await ctx.db.timeOffRequest.findMany({
        where,
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          clinicSessions: {
            include: {
              coveredBy: {
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
        orderBy: {
          startDate: "asc",
        },
      });

      // Update status based on coverage
      return requests.map(request => {
        const totalSessions = request.clinicSessions.length;
        const coveredSessions = request.clinicSessions.filter(s => s.coveredBySupervisorId).length;

        let status = request.status;
        if (coveredSessions === 0) {
          status = RequestStatus.PENDING;
        } else if (coveredSessions < totalSessions) {
          status = RequestStatus.PARTIAL_COVERED;
        } else if (coveredSessions === totalSessions) {
          status = RequestStatus.FULLY_COVERED;
        }

        return { ...request, status, coverageProgress: { total: totalSessions, covered: coveredSessions } };
      });
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.timeOffRequest.findUnique({
        where: { id: input },
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          clinicSessions: {
            include: {
              coveredBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              coverageHistory: {
                include: {
                  supervisor: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  timestamp: "desc",
                },
              },
            },
            orderBy: [
              { date: "asc" },
              { startTime: "asc" },
            ],
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      // Calculate coverage status
      const totalSessions = request.clinicSessions.length;
      const coveredSessions = request.clinicSessions.filter(s => s.coveredBySupervisorId).length;

      let status = request.status;
      if (coveredSessions === 0) {
        status = RequestStatus.PENDING;
      } else if (coveredSessions < totalSessions) {
        status = RequestStatus.PARTIAL_COVERED;
      } else if (coveredSessions === totalSessions) {
        status = RequestStatus.FULLY_COVERED;
      }

      return { ...request, status, coverageProgress: { total: totalSessions, covered: coveredSessions } };
    }),

  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const requests = await ctx.db.timeOffRequest.findMany({
      where: {
        supervisorId: ctx.session.user.id,
      },
      include: {
        clinicSessions: {
          include: {
            coveredBy: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests.map(request => {
      const totalSessions = request.clinicSessions.length;
      const coveredSessions = request.clinicSessions.filter(s => s.coveredBySupervisorId).length;

      let status = request.status;
      if (coveredSessions === 0) {
        status = RequestStatus.PENDING;
      } else if (coveredSessions < totalSessions) {
        status = RequestStatus.PARTIAL_COVERED;
      } else if (coveredSessions === totalSessions) {
        status = RequestStatus.FULLY_COVERED;
      }

      return { ...request, status, coverageProgress: { total: totalSessions, covered: coveredSessions } };
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if request belongs to current user
      const request = await ctx.db.timeOffRequest.findUnique({
        where: { id: input.id },
        include: {
          clinicSessions: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.supervisorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You can only update your own requests",
        });
      }

      // Check if any sessions are already covered
      const hasCoveredSessions = request.clinicSessions.some(s => s.coveredBySupervisorId);
      if (hasCoveredSessions) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update request with covered sessions",
        });
      }

      const updatedRequest = await ctx.db.timeOffRequest.update({
        where: { id: input.id },
        data: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });

      return updatedRequest;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check if request belongs to current user
      const request = await ctx.db.timeOffRequest.findUnique({
        where: { id: input },
        include: {
          clinicSessions: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.supervisorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You can only delete your own requests",
        });
      }

      // Check if any sessions are already covered
      const hasCoveredSessions = request.clinicSessions.some(s => s.coveredBySupervisorId);
      if (hasCoveredSessions) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete request with covered sessions",
        });
      }

      await ctx.db.timeOffRequest.delete({
        where: { id: input },
      });

      return { success: true };
    }),
});