import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintMailBids - Industrial Equipment Marketplace",
  description: "Buy and sell printing, mailing, and industrial equipment. List today, sell tomorrow. No waiting for auctions.",
  keywords: ["printing equipment", "mailing equipment", "industrial equipment", "auction", "used equipment"],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
