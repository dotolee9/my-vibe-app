import type { Metadata } from "next";
import { UseCaseProvider } from "@/providers/use-case-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Vibe App",
  description: "My Vibe App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <UseCaseProvider>{children}</UseCaseProvider>
      </body>
    </html>
  );
}
