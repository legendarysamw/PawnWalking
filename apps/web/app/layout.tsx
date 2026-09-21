import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawnWalking",
  description: "Book a dog walk in one tap. Flat-rate pricing, no haggling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
