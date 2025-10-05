"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function GoogleSignInPopup() {
  useEffect(() => {
    void signIn("google", { callbackUrl: "/auth/callback-close" });
  }, []);

  return null;
}
