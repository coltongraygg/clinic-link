import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "USER";
    isActive: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
// Whitelist of allowed supervisor emails
const ALLOWED_EMAILS: string[] = [
  "coltongraygg@gmail.com",
  // Add the other 4 supervisor emails here
  // Example: "supervisor1@clinic.com",
  // These should be configured via environment variables in production
];

export const authConfig = {
  providers: [GoogleProvider],
  // @ts-expect-error - NextAuth adapter type mismatch between dependencies
  adapter: PrismaAdapter(db),
  callbacks: {
    signIn: async ({ user }) => {
      // Only allow sign-in for whitelisted emails
      if (!user.email) return false;

      // In development, allow any email for testing
      if (process.env.NODE_ENV === "development") {
        return true;
      }

      // In production, check whitelist
      return ALLOWED_EMAILS.includes(user.email);
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role ?? "USER",
        isActive: user.isActive ?? true,
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
