"use client";

import { useEffect } from "react";

export default function CallbackClose() {
  useEffect(() => {
    // Close the popup window after successful authentication
    window.close();
  }, []);

  return (
    <div
      style={{ backgroundColor: "white", width: "100vw", height: "100vh" }}
    />
  );
}
