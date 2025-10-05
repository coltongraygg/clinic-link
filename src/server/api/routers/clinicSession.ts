import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { NotificationType } from "@prisma/client";
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

export const clinicSessionRouter = createTRPCRouter({
  getUncovered: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        clinicName: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        coveredBySupervisorId: null,
      };

      if (input?.startDate || input?.endDate) {
        where.date = {};
        if (input?.startDate) {
          where.date.gte = input.startDate;
        }
        if (input?.endDate) {
          where.date.lte = input.endDate;
        }
      }

      if (input?.clinicName) {
        where.clinicName = {
          contains: input.clinicName,
        };
      }

      const sessions = await ctx.db.clinicSession.findMany({
        where,
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
        orderBy: [
          { date: "asc" },
          { startTime: "asc" },
        ],
        take: input?.limit || 50,
      });

      return sessions;
    }),

  claim: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Start a transaction to ensure atomicity
      const result = await ctx.db.$transaction(async (tx) => {
        // Get the session with lock
        const session = await tx.clinicSession.findUnique({
          where: { id: input.sessionId },
          include: {
            request: {
              include: {
                supervisor: true,
              },
            },
          },
        });

        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        // Check if already covered
        if (session.coveredBySupervisorId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Session is already covered",
          });
        }

        // Prevent self-coverage
        if (session.request.supervisorId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot cover your own sessions",
          });
        }

        // Claim the session
        const updatedSession = await tx.clinicSession.update({
          where: { id: input.sessionId },
          data: {
            coveredBySupervisorId: ctx.session.user.id,
          },
        });

        // Create coverage history record
        await tx.sessionCoverage.create({
          data: {
            sessionId: input.sessionId,
            supervisorId: ctx.session.user.id,
            action: "CLAIMED",
          },
        });

        // Notify the requesting supervisor
        await createNotification(
          tx,
          session.request.supervisorId,
          NotificationType.SESSION_CLAIMED,
          "Session Covered",
          `${ctx.session.user.name} has covered your ${session.clinicName} session on ${session.date.toLocaleDateString()}`,
          { sessionId: session.id, requestId: session.requestId }
        );

        // Check if all sessions for this request are now covered
        const allSessions = await tx.clinicSession.findMany({
          where: { requestId: session.requestId },
        });

        const allCovered = allSessions.every(s => s.coveredBySupervisorId !== null);

        if (allCovered) {
          await createNotification(
            tx,
            session.request.supervisorId,
            NotificationType.REQUEST_COVERED,
            "All Sessions Covered",
            "All sessions for your time off request have been covered!",
            { requestId: session.requestId }
          );
        }

        return updatedSession;
      });

      return result;
    }),

  release: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.clinicSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      // Only allow release by the covering supervisor or admin
      if (session.coveredBySupervisorId !== ctx.session.user.id &&
          ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You can only release sessions you are covering",
        });
      }

      const updatedSession = await ctx.db.clinicSession.update({
        where: { id: input.sessionId },
        data: {
          coveredBySupervisorId: null,
        },
      });

      // Create coverage history record
      await ctx.db.sessionCoverage.create({
        data: {
          sessionId: input.sessionId,
          supervisorId: ctx.session.user.id,
          action: "RELEASED",
        },
      });

      return updatedSession;
    }),

  getByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        includeOnlyCovered: z.boolean().optional(),
        includeOnlyUncovered: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        date: {
          gte: input.startDate,
          lte: input.endDate,
        },
      };

      if (input.includeOnlyCovered) {
        where.coveredBySupervisorId = { not: null };
      } else if (input.includeOnlyUncovered) {
        where.coveredBySupervisorId = null;
      }

      const sessions = await ctx.db.clinicSession.findMany({
        where,
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
          coveredBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [
          { date: "asc" },
          { startTime: "asc" },
        ],
      });

      return sessions;
    }),

  getUpcoming: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7),
        onlyMySessions: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (input?.days || 7));

      const where: any = {
        date: {
          gte: new Date(),
          lte: endDate,
        },
      };

      if (input?.onlyMySessions) {
        where.OR = [
          { request: { supervisorId: ctx.session.user.id } },
          { coveredBySupervisorId: ctx.session.user.id },
        ];
      }

      const sessions = await ctx.db.clinicSession.findMany({
        where,
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
          coveredBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [
          { date: "asc" },
          { startTime: "asc" },
        ],
      });

      return sessions;
    }),

  getClinicNameSuggestions: protectedProcedure
    .input(
      z.object({
        search: z.string().min(1).max(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const clinicNames = await ctx.db.clinicSession.findMany({
        where: {
          clinicName: {
            contains: input.search,
          },
        },
        select: {
          clinicName: true,
        },
        distinct: ["clinicName"],
        take: 10,
      });

      return clinicNames.map(c => c.clinicName);
    }),

  getMyCoverage: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.clinicSession.findMany({
      where: {
        coveredBySupervisorId: ctx.session.user.id,
        date: {
          gte: new Date(),
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
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return sessions;
  }),
});