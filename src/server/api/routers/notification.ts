import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const notificationRouter = createTRPCRouter({
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.notification.findMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return notifications;
  }),

  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: notifications,
        nextCursor,
      };
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()).optional(),
        markAll: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const where: Prisma.NotificationWhereInput = {
        userId: ctx.session.user.id,
      };

      if (input?.markAll) {
        // Mark all notifications as read
        where.read = false;
      } else if (input?.notificationIds && input.notificationIds.length > 0) {
        // Mark specific notifications as read
        where.id = {
          in: input.notificationIds,
        };
      } else {
        return { success: false, message: "No notifications specified" };
      }

      const result = await ctx.db.notification.updateMany({
        where,
        data: {
          read: true,
        },
      });

      return {
        success: true,
        count: result.count,
      };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });

    return count;
  }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.delete({
        where: {
          id: input,
          userId: ctx.session.user.id, // Ensure user can only delete their own notifications
        },
      });

      return { success: true };
    }),

  deleteAll: protectedProcedure
    .input(
      z
        .object({
          onlyRead: z.boolean().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const where: Prisma.NotificationWhereInput = {
        userId: ctx.session.user.id,
      };

      if (input?.onlyRead) {
        where.read = true;
      }

      const result = await ctx.db.notification.deleteMany({
        where,
      });

      return {
        success: true,
        count: result.count,
      };
    }),
});
