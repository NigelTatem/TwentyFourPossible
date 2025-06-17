import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Make24Matter - Transform Your 24 Hours",
  description: "Take on powerful 24-hour challenges and transform your productivity. Complete goals, collect dancing pet bears, and track your progress with Make24Matter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
