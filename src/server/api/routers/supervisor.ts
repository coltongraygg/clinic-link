import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

export const supervisorRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const supervisors = await ctx.db.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return supervisors;
  }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        _count: {
          select: {
            timeOffRequests: true,
            coveredSessions: true,
            notifications: {
              where: {
                read: false,
              },
            },
          },
        },
      },
    });
    return user;
  }),

  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        newRequestNotifications: z.boolean().optional(),
        claimNotifications: z.boolean().optional(),
        reminderNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would update user preferences if we had a preferences table
      // For now, we'll return success
      return { success: true, preferences: input };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
        },
      });
      return updatedUser;
    }),
});