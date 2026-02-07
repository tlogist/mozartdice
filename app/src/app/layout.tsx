import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dice & Discipline",
  description: "From Mozart's Order to Beethoven's Agitation — a systems-based piano training environment",
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
