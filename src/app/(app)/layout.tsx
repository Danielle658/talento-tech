
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
// Sheet components are not directly used here anymore for sidebar, but Sidebar component might use them internally if needed.
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; 
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger, // Keep this for controlling the sidebar
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // SidebarMenuSub,
  // SidebarMenuSubItem,
  // SidebarMenuSubButton,
  SidebarInset,
  // SidebarGroup,
  // SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Logo } from '@/components/shared/logo';
import Link from 'next/link';
import {
  Home,
  FileText,
  Users,
  ShoppingCart,
  Briefcase,
  Settings,
  Search,
  Bell,
  LogOut,
  UserCircle,
  LifeBuoy,
  Loader2,
  // Bot, // Not used here
  PanelLeft // Icon for SidebarTrigger
} from 'lucide-react';
import { ClientOnly } from '@/components/shared/client-only';

const navItems = [
  { href: "/dashboard", icon: Home, label: "Painel Central", tooltip: "Painel" },
  { href: "/dashboard/notebook", icon: FileText, label: "Caderneta Digital", tooltip: "Caderneta" },
  { href: "/dashboard/customers", icon: Users, label: "Contas de Clientes", tooltip: "Clientes" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Vendas", tooltip: "Vendas" },
  { href: "/dashboard/products", icon: Briefcase, label: "Produtos", tooltip: "Produtos" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a redirect component, though useEffect handles it
  }
  
  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  return (
    <ClientOnly>
      <SidebarProvider defaultOpen>
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton tooltip={item.tooltip} isActive={router.pathname === item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                  <Link href="/dashboard/settings" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="Configurações">
                      <Settings />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            {/* SidebarTrigger now visible on all screen sizes */}
            <SidebarTrigger>
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Alternar menu</span>
            </SidebarTrigger>
            
            {/* Search, Bell, User Menu - adjusted for flex layout */}
            <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
              <form className="relative flex-1 sm:flex-initial max-w-xs md:max-w-sm lg:max-w-md">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar..."
                  className="pl-8 w-full"
                />
              </form>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notificações</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="@shadcn" data-ai-hint="user profile" />
                      <AvatarFallback>MW</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Menu do usuário</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Suporte</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ClientOnly>
  );
}
