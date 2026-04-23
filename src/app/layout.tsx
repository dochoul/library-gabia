import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { config } from "@/config";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
