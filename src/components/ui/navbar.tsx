import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";

type DashboardNavbarGenericProps<T = unknown> = {
  children: React.ReactNode;
  className?: string;
} & T;

function DashboardNavbarRoot({
  className,
  children,
}: DashboardNavbarGenericProps) {
  return (
    <nav
      className={cn([
        "sticky top-0 z-50 w-full border-b backdrop-blur-md",
        "border-border bg-background/95 supports-backdrop-filter:bg-background/60",
        className,
      ])}
    >
      {children}
    </nav>
  );
}

function DashboardNavbarMain({
  className,
  children,
}: DashboardNavbarGenericProps) {
  return (
    <main
      className={cn([
        "flex h-14 w-full max-w-400 flex-row items-center justify-between px-6 mx-auto",
        className,
      ])}
    >
      {children}
    </main>
  );
}

function DashboardNavbarNav({
  className,
  children,
}: DashboardNavbarGenericProps) {
  return (
    <div className={cn(["flex flex-row items-center gap-1 h-full", className])}>
      {children}
    </div>
  );
}

type DashboardNavbarNavLinkProps = {
  href: string;
  active?: boolean;
  onClick?: () => void;
};

function DashboardNavbarNavLink({
  className,
  children,
  href,
  active,
  onClick,
}: DashboardNavbarGenericProps<DashboardNavbarNavLinkProps>) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn([
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200",
        // Base State (Inactive):
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        // Active State:
        active && "bg-accent text-accent-foreground shadow-sm",
        className,
      ])}
    >
      {children}
    </Link>
  );
}

export const DashboardNavbar = Object.assign(DashboardNavbarRoot, {
  Main: DashboardNavbarMain,
  Nav: DashboardNavbarNav,
  Link: DashboardNavbarNavLink,
});
