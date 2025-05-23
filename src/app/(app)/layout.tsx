
"use client";
import { useEffect, useState, useMemo } from 'react'; 
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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
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
  PanelLeft,
  BookUser,
  FilePlus2,
  BarChart3
} from 'lucide-react';
import { ClientOnly } from '@/components/shared/client-only';
import { VirtualAssistant } from '@/components/dashboard/virtual-assistant';
import { ACCOUNT_DETAILS_BASE_STORAGE_KEY, getCompanySpecificKey } from '@/lib/constants';
import type { AccountDetailsFormValues } from '@/app/(app)/dashboard/settings/page';

const navItems = [
  { href: "/dashboard", icon: Home, label: "Painel Central", tooltip: "Painel" },
  { href: "/dashboard/notebook", icon: FileText, label: "Caderneta Digital", tooltip: "Caderneta" },
  { href: "/dashboard/customers", icon: Users, label: "Contas de Clientes", tooltip: "Clientes" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Vendas", tooltip: "Vendas" },
  { href: "/dashboard/products", icon: Briefcase, label: "Produtos", tooltip: "Produtos" },
  { href: "/dashboard/credit-notebook", icon: BookUser, label: "Caderneta de Fiados", tooltip: "Fiados" },
  { href: "/dashboard/sales-record", icon: FilePlus2, label: "Registro de Vendas", tooltip: "Registrar Venda" },
  { href: "/dashboard/monthly-report", icon: BarChart3, label: "Relatório Mensal", tooltip: "Relatório" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, currentCompany } = useAuth();
  const router = useRouter();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>(undefined);
  const [ownerInitials, setOwnerInitials] = useState<string>("MW");

  const accountDetailsStorageKey = useMemo(() => getCompanySpecificKey(ACCOUNT_DETAILS_BASE_STORAGE_KEY, currentCompany), [currentCompany]);

  const loadProfileData = useCallback(() => {
    if (typeof window !== "undefined" && accountDetailsStorageKey) {
      const storedDetailsRaw = localStorage.getItem(accountDetailsStorageKey);
      if (storedDetailsRaw) {
        try {
          const storedDetails: AccountDetailsFormValues = JSON.parse(storedDetailsRaw);
          setProfilePictureUrl(storedDetails.profilePictureDataUri);
          if (storedDetails.ownerName) {
            const initials = storedDetails.ownerName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
            setOwnerInitials(initials || (currentCompany ? currentCompany.substring(0,2).toUpperCase() : "MW"));
          } else {
            setOwnerInitials(currentCompany ? currentCompany.substring(0,2).toUpperCase() : "MW");
          }
        } catch (error) {
          console.error("Error loading account details for avatar for", currentCompany, error);
          setProfilePictureUrl(undefined);
          setOwnerInitials(currentCompany ? currentCompany.substring(0,2).toUpperCase() : "MW");
        }
      } else {
          setProfilePictureUrl(undefined);
          setOwnerInitials(currentCompany ? currentCompany.substring(0,2).toUpperCase() : "MW");
      }
    } else if (typeof window !== "undefined" && !currentCompany) { // Clear if no company
        setProfilePictureUrl(undefined);
        setOwnerInitials("MW");
    }
  }, [accountDetailsStorageKey, currentCompany]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);
  
  useEffect(() => {
    loadProfileData();
    window.addEventListener('storage', loadProfileData);
    return () => {
      window.removeEventListener('storage', loadProfileData);
    };
  }, [loadProfileData]); // Depend on loadProfileData as it now depends on accountDetailsStorageKey


  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a redirect component if preferred
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
                    <SidebarMenuButton tooltip="Configurações da Conta">
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
            <SidebarTrigger>
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Alternar menu</span>
            </SidebarTrigger>
            
            <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
              {/* Search form can be re-added later if needed */}
              {/* <form className="relative flex-1 sm:flex-initial max-w-xs md:max-w-sm lg:max-w-md">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar..."
                  className="pl-8 w-full"
                />
              </form> */}
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notificações</span>
              </Button>
              <VirtualAssistant />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profilePictureUrl} alt="Foto de perfil do usuário" data-ai-hint="user profile" />
                      <AvatarFallback>{ownerInitials}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Menu do usuário</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{currentCompany || "Minha Conta"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/settings" passHref legacyBehavior>
                    <DropdownMenuItem asChild>
                       <a><UserCircle className="mr-2 h-4 w-4" />
                        <span>Perfil</span></a>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/support" passHref legacyBehavior>
                    <DropdownMenuItem asChild>
                       <a><LifeBuoy className="mr-2 h-4 w-4" />
                        <span>Suporte</span></a>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ClientOnly>
  );
}
