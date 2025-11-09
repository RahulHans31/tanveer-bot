import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <-- 1. ADD THIS

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Stock Tracker Admin",
};

export default function RootLayout({ children }) {
  return (
    // Just remove the comment from this line
    <html lang="en" className="dark"> 
      <body className={inter.className}>
        {children}
        <Toaster /> {/* <-- This comment is fine */}
      </body>
    </html>
  );
}