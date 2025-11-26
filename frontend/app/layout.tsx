import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "../components/Navigation";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Encrypted Study Schedule",
  description: "Track your daily study progress with fully encrypted data",
  icons: {
    icon: "/favicon.ico",
    apple: "/study-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`study-bg text-foreground antialiased min-h-screen`}>
        <div className="fixed inset-0 w-full h-full study-bg z-[-20]"></div>
        <main className="flex flex-col w-full mx-auto pb-20">
          <Providers>
            <Navigation />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}

