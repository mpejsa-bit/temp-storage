import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scope Platform — Platform Science",
  description: "Solution scoping and document management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0e17] text-[#e8edf5] antialiased">
        {children}
      </body>
    </html>
  );
}
