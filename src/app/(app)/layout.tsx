
"use client";
import type { ReactNode } from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react'; 
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
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
// Input removed as it's not used here directly
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
  // Search, // Search input removed from header
  Bell,
  LogOut,
  UserCircle,
  LifeBuoy,
  Loader2,
  PanelLeft,
  BookUser,
  FilePlus2,
  BarChart3,
  ArrowLeft // Keep ArrowLeft if used elsewhere, or it can be removed from here if not
} from 'lucide-react';
import { ClientOnly } from '@/components/shared/client-only';
import dynamic from 'next/dynamic'; // Import dynamic
import { ACCOUNT_DETAILS_BASE_STORAGE_KEY, getCompanySpecificKey } from '@/lib/constants';
import type { AccountDetailsFormValues } from '@/app/(app)/dashboard/settings/page';

const VirtualAssistant = dynamic(() => 
  import('@/components/dashboard/virtual-assistant').then(mod => mod.VirtualAssistant),
  { 
    ssr: false, 
    loading: () => <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" disabled><Loader2 className="h-5 w-5 animate-spin"/></Button> 
  }
);


const navItems = [
  { href: "/dashboard", icon: Home, label: "Painel Central", tooltip: "Painel" },
  { href: "/dashboard/notebook", icon: FileText, label: "Caderneta Digital", tooltip: "Caderneta" },
  { href: "/dashboard/customers", icon: Users, label: "Contas de Clientes", tooltip: "Clientes" },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Vendas", tooltip: "Vendas" },
  { href: "/dashboard/products", icon: Briefcase, label: "Produtos", tooltip: "Produtos" },
  { href: "/dashboard/credit-notebook", icon: BookUser, label: "Caderneta de Fiados", tooltip: "Fiados" },
  { href: "/dashboard/sales-record", icon: FilePlus2, label: "Registro de Vendas", tooltip: "Hist. Vendas" }, 
  { href: "/dashboard/monthly-report", icon: BarChart3, label: "Relatório Mensal", tooltip: "Relatório" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, currentCompany } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); 
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
    } else if (typeof window !== "undefined" && !currentCompany) { 
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
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === accountDetailsStorageKey || (event.key === null && !accountDetailsStorageKey)) { 
        loadProfileData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadProfileData, accountDetailsStorageKey]);


  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; 
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
                  <Link href={item.href}>
                    <SidebarMenuButton tooltip={item.tooltip} isActive={pathname === item.href}>
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
                  <Link href="/dashboard/settings">
                    <SidebarMenuButton tooltip="Configurações da Conta" isActive={pathname === "/dashboard/settings"}>
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
                  <Link href="/dashboard/settings">
                    <DropdownMenuItem>
                       <UserCircle className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/support">
                    <DropdownMenuItem>
                       <LifeBuoy className="mr-2 h-4 w-4" />
                        <span>Suporte</span>
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
