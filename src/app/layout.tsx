import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintMailBids - Industrial Equipment Marketplace",
  description: "Buy and sell printing, mailing, and industrial equipment. List today, sell tomorrow. No waiting for auctions.",
  keywords: ["printing equipment", "mailing equipment", "industrial equipment", "auction", "used equipment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
