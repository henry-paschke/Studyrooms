"use client";

import { ReactNode } from "react";

interface HomeBgProps {
  children: ReactNode;
}

export default function HomeBg({ children }: HomeBgProps) {
  return (
    <div className="relative min-h-screen text-white bg-gradient-to-b from-blue-600 to-blue-400">
      <div>{children}</div>
    </div>
  );
}
