import type { Metadata, Viewport } from 'next';
// import { GeistSans } from 'geist/font/sans'; // Removed
// import { GeistMono } from 'geist/font/mono'; // Removed
import './globals.css';
import { AuthProvider } from '@/contexts/auth-provider';
import { Toaster } from "@/components/ui/toaster";

// const geistSans = GeistSans; // Removed
// const geistMono = GeistMono; // Removed

export const metadata: Metadata = {
  title: 'MoneyWise',
  description: 'Manage your business finances wisely.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning> {/* Changed lang to pt-BR */}
      <body className={`antialiased`}> {/* Removed font variables */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
