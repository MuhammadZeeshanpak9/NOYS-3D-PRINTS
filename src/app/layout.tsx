import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Noys 3D Prints | A World Made in Plastic",
  description: "High-detail 3D printed miniatures, custom designs, and hobby-ready models — made to order.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full relative z-0">
        <AnimatedBackground />
        <Navbar />
        <main className="min-h-screen pt-16 md:pt-0 md:pl-64 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
