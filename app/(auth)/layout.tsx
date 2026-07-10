import React, { type ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="relative min-h-screen w-full bg-[#04020b] overflow-hidden flex items-center justify-center px-4 py-12 selection:bg-[#6e6aed]/30">
      {/* Neon Glow Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-125 h-125 rounded-full bg-[#6e6aed]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 rounded-full bg-[#d946ef]/10 blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main container */}
      <div className="relative z-10 mx-auto w-full max-w-md flex justify-center">
        {children}
      </div>
    </div>
  );
}
