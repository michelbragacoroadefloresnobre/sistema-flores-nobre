"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardNavbar } from "@/components/ui/navbar"; // Updated Import
import { Switch } from "@/components/ui/switch";
import {
  useToggleViewOnlyMyOrders,
  useViewOnlyMyOrders,
} from "@/hooks/use-app-storage";
import { authClient } from "@/lib/auth/client";
// import { pusherClient } from "@/lib/pusher/client";
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Settings,
  ShoppingCart,
  Sun,
  UserCog,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// export type iNotification = {
//   id: string;
//   type: "notification" | "refund_request";
//   status: "delivered" | "resolved";
//   title: string;
//   content?: string;
//   roles: Permissoes[];
//   metadata?: Record<string, any>;
//   createdAt: string;
//   isRead: boolean;
// };

// type MainNavbarProps = {
//   notifications: iNotification[];
// };

type MainLink = "/admin" | "/dashboard" | null;

export function MainNavbar() {
  const pathname = usePathname();
  const { data, isPending } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const user = data?.user;
  const [selectedMainLink, setSelectedMainLink] = useState<MainLink>(null);
  const router = useRouter();
  // const [notifications, setNotifications] =
  //   useState<iNotification[]>(notificationsData);

  const viewOnlyMyOrders = useViewOnlyMyOrders();
  const toggleViewOnlyMyOrders = useToggleViewOnlyMyOrders();

  const adminLinks = [
    { name: "Produtos", href: "/admin/produtos" },
    { name: "Fornecedores", href: "/admin/fornecedores" },
    { name: "Clientes", href: "#" },
  ];

  const pedidosLinks = [
    { name: "Início", href: "/dashboard" },
    { name: "Finalizados", href: "/dashboard/finalizados" },
    { name: "Formulários", href: "/dashboard/formularios" },
  ];

  const additionalLinks = {
    "/admin": adminLinks,
    "/dashboard": pedidosLinks,
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  // useEffect(() => {
  //   const notificationChannel = pusherClient.subscribe("app-notifications");
  //   const addNotificationBind = notificationChannel.bind(
  //     "add-notification",
  //     (data: Notificacao) => {
  //       const notification: iNotification = {
  //         id: data.Id!,
  //         status: data.Status,
  //         roles: data.Setores,
  //         title: data.Titulo,
  //         content: data.Conteudo,
  //         type: data.Tipo,
  //         createdAt: data.CriadoEm!,
  //         isRead: false,
  //         metadata: data.Metadata,
  //       };

  //       setNotifications([
  //         notification,
  //         ...notifications.filter((n) => n.id !== n.id),
  //       ]);
  //     },
  //   );

  //   const removeNotificationBind = notificationChannel.bind(
  //     "remove-notification",
  //     (notificationId: string) =>
  //       setNotifications(notifications.filter((n) => n.id !== notificationId)),
  //   );

  //   return () => {
  //     addNotificationBind.unbind("add-notification");
  //     removeNotificationBind.unbind("remove-notification");
  //     notificationChannel.unsubscribe();
  //   };
  // });

  useEffect(() => {
    const mainLink = Object.keys(additionalLinks).find((link) =>
      pathname.startsWith(link),
    );
    setSelectedMainLink(mainLink ? (mainLink as MainLink) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleMainLinkClick = (link: MainLink) => {
    setSelectedMainLink(link);
  };

  // const onClickedAction = (
  //   notificationId: string,
  //   actionId: "refund_approved" | "refund_disapproved",
  // ) => {
  //   handleRefundRequest(notificationId, actionId).then((res) => {
  //     if (res.error) return toast.error(res.error);
  //     setNotifications(notifications.filter((n) => n.id !== notificationId));
  //     toast.success(res.success);
  //   });
  // };

  // const markAllAsRead = () => {
  //   markAllNotificationsAsRead().then((res) => {
  //     if (res.error) console.error(res.error);
  //     setNotifications(
  //       notifications.map((n) => {
  //         if (n.type === "notification") return { ...n, isRead: true };
  //         else return n;
  //       }),
  //     );
  //   });
  // };

  // const orderedNotification = useMemo(
  //   () =>
  //     notifications.toSorted((a, b) => {
  //       const aTime = new Date(a.createdAt).getTime();
  //       const bTime = new Date(b.createdAt).getTime();
  //       return bTime - aTime;
  //     }),
  //   [notifications],
  // );

  return (
    <DashboardNavbar>
      <DashboardNavbar.Main>
        <DashboardNavbar.Nav>
          <div className="mr-4 flex h-9 w-auto select-none items-center justify-center">
            <Image
              width={120}
              height={40}
              src="/logo.png"
              alt="Logo"
              className="h-full w-auto object-contain"
              priority
            />
          </div>

          <DashboardNavbar.Link
            href="/admin/produtos"
            active={isActive("/admin")}
            onClick={() => handleMainLinkClick("/admin")}
          >
            <UserCog className="h-4 w-4" />
            Admin
          </DashboardNavbar.Link>

          <DashboardNavbar.Link
            href="/dashboard"
            active={isActive("/dashboard")}
            onClick={() => handleMainLinkClick("/dashboard")}
          >
            <ShoppingCart className="h-4 w-4" />
            Principal
          </DashboardNavbar.Link>

          {selectedMainLink && (
            <>
              <div className="mx-2 h-5 w-px self-center bg-border" />
              <div className="flex items-center gap-1">
                {additionalLinks[selectedMainLink].map((link) => (
                  <DashboardNavbar.Link
                    key={link.name}
                    href={link.href}
                    active={link.href === pathname}
                  >
                    {link.name}
                  </DashboardNavbar.Link>
                ))}
              </div>
            </>
          )}
        </DashboardNavbar.Nav>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="h-8 gap-2 px-3 text-xs font-medium shadow-sm"
            asChild
          >
            <Link href={"/pedidos/novo"}>
              <Plus className="h-3.5 w-3.5" />
              Criar Pedido
            </Link>
          </Button>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            {isPending ? (
              <div className="flex h-8 items-center gap-2 rounded-full border border-border bg-background pl-1 pr-4">
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                <div className="hidden h-3 w-16 animate-pulse rounded bg-muted sm:block" />
              </div>
            ) : (
              <DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="flex h-8 items-center gap-2 rounded-full border border-transparent pl-1 pr-2 transition-all hover:border-border hover:bg-accent"
                >
                  <DropdownMenuTrigger>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-amber-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-background">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden max-w-25 truncate text-xs font-medium text-foreground sm:inline-block">
                      {user?.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </DropdownMenuTrigger>
                </Button>

                <DropdownMenuContent align="end" className="w-60 p-1">
                  <div className="mb-1 flex items-center gap-3 rounded-md border border-border bg-muted/50 px-2 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-yellow-400 to-amber-600 text-xs font-bold text-white shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {user?.name}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <DropdownMenuItem
                    className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-2 text-xs focus:bg-accent"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleViewOnlyMyOrders();
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {viewOnlyMyOrders ? (
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span>Meus pedidos</span>
                    </div>

                    <Switch checked={viewOnlyMyOrders} />
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-xs focus:bg-accent">
                      {theme === "dark" ? (
                        <Moon className="h-3.5 w-3.5" />
                      ) : theme === "light" ? (
                        <Sun className="h-3.5 w-3.5" />
                      ) : (
                        <Monitor className="h-3.5 w-3.5" />
                      )}
                      <span>Alterar tema</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-40">
                        <DropdownMenuItem
                          onClick={() => setTheme("light")}
                          className="flex cursor-pointer items-center gap-2 text-xs"
                        >
                          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Claro</span>
                          {theme === "light" && (
                            <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("dark")}
                          className="flex cursor-pointer items-center gap-2 text-xs"
                        >
                          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Escuro</span>
                          {theme === "dark" && (
                            <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("system")}
                          className="flex cursor-pointer items-center gap-2 text-xs"
                        >
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Sistema</span>
                          {theme === "system" && (
                            <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator className="my-1 bg-border" />

                  <DropdownMenuItem
                    asChild
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-xs focus:bg-accent"
                  >
                    <Link href="/configuracoes/usuarios">
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess() {
                            router.push("/auth/login");
                          },
                        },
                      })
                    }
                    className="mt-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="font-medium">Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </DashboardNavbar.Main>
    </DashboardNavbar>
  );
}
