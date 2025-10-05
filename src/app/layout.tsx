import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { TopBar } from "@/components/common/top-bar";
import { BottomNav } from "@/components/common/bottom-nav";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Clinic Link",
  description: "Medical supervisor coverage coordination system",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-card">
        <ErrorBoundary>
          <TRPCReactProvider>
            {isAuthenticated && <TopBar />}
            {children}
            {isAuthenticated && <BottomNav />}
            <Toaster />
          </TRPCReactProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
