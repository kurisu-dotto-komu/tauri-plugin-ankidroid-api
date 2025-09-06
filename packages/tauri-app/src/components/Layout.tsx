import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "AnkiDroid API" }: LayoutProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </header>
      <div className="px-4 pb-4 max-w-md mx-auto">
        {children}
      </div>
    </main>
  );
}