import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import SidebarWrapper from "@/components/SidebarWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduTools AI",
  description: "Trợ lý ảo cho giáo viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-slate-50 text-slate-800`}>
        <AppProvider>
           <SidebarWrapper>
              {children}
           </SidebarWrapper>
        </AppProvider>
      </body>
    </html>
  );
}