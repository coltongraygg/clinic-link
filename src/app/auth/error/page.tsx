"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You are not authorized to access this application. Only approved supervisors can sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      default:
        return "An authentication error occurred. Please try again.";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-red-700">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-center text-sm">
            If you believe you should have access, please contact your system
            administrator.
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/auth/signin">
              <Button className="w-full" variant="default">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full" variant="outline">
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
