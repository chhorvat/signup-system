import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Basketball League Signup",
  description: "Sign up for pickup basketball games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900 antialiased">
        <header className="bg-blue-700 text-white shadow-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <a href="/" className="text-xl font-bold tracking-tight hover:text-blue-100">
              Basketball League
            </a>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
