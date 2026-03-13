import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";

import {
  AppLayout,
  AppLayoutMain,
  AppLayoutContent,
} from "@workspace/ui/components/layout";

import "../lib/orpc/orpc.server";
import { AppSidebar } from "@/components/app-layout/app-sidebar";
import { AppHeader } from "@/components/app-layout/app-header";
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <NextIntlClientProvider>
            <AppLayout>
              <AppSidebar />
              <AppLayoutMain>
                <AppHeader />
                <AppLayoutContent>{children}</AppLayoutContent>
              </AppLayoutMain>
            </AppLayout>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
