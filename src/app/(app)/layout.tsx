import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MainNavbar } from "./_components/main-navbar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return redirect("/auth/login");

  return (
    <div className="h-full">
      <MainNavbar />
      <div className="flex h-[calc(100%-3.5rem)] flex-col">{children}</div>
    </div>
  );
}
