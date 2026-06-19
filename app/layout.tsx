import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DevCollab",
    template: "%s | DevCollab",
  },
  description: "Collaborative SaaS dashboard for development teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans min-h-screen antialiased">
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={clerkTheme}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
