import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import RequestForm from "@/components/forms/request-form";

export default async function RequestPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <RequestForm />;
}
