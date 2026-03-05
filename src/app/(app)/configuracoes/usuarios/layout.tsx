import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return redirect("/auth/login");
  const role = session?.user.role;

  if (role !== Role.ADMIN && role !== Role.SUPERVISOR && role !== Role.OWNER) {
    return redirect("/dashboard");
  }

  return <>{children}</>;
}
