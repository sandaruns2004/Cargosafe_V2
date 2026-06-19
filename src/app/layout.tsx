import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "CargoSafe | Fleet Intelligence Platform",
  description: "Premium enterprise-grade cargo monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        {/* Prevent flash of wrong theme — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("cargosafe-theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased font-body relative bg-base text-txt-primary overflow-x-hidden min-h-screen">
        {/* Background atmosphere */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "52px 52px" }} />
          {/* Blue orb */}
          <div className="absolute -top-44 -left-32 w-[600px] h-[600px] rounded-full
            bg-[radial-gradient(circle,#1a6fff_0%,#0a3a8a_60%,transparent_100%)]
            blur-[110px] opacity-[0.18] animate-orb-drift" />
          {/* Teal orb */}
          <div className="absolute -bottom-24 -right-20 w-[400px] h-[400px] rounded-full
            bg-[radial-gradient(circle,#00c9a7_0%,#006e5c_60%,transparent_100%)]
            blur-[110px] opacity-[0.18] animate-orb-drift" style={{ animationDelay: '-8s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <AuthGuard>
            {children}
          </AuthGuard>
        </div>
      </body>
    </html>
  );
}
