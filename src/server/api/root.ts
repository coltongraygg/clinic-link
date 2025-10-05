import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { supervisorRouter } from "@/server/api/routers/supervisor";
import { timeOffRequestRouter } from "@/server/api/routers/timeOffRequest";
import { clinicSessionRouter } from "@/server/api/routers/clinicSession";
import { notificationRouter } from "@/server/api/routers/notification";
import { dashboardRouter } from "@/server/api/routers/dashboard";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  supervisor: supervisorRouter,
  timeOffRequest: timeOffRequestRouter,
  clinicSession: clinicSessionRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
