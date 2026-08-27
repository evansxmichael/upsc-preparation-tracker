import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/AuthProvider";
import { FooterInfoModal } from "@/components/FooterInfoModal";

export const metadata = {
  title: "UPSC Preparation Tracker",
  description: "Personal UPSC CSE Preparation Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fbfbf9] text-stone-900 flex flex-col">
        <AuthProvider>
          <div className="flex flex-1 min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <main className="flex-1 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">{children}</div>
              </main>
              <FooterInfoModal />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}