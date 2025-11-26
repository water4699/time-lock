import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "muted";
}

export function Card({ children, className = "", variant = "default" }: CardProps) {
  const variantClasses = {
    default: "bg-white/10 backdrop-blur-sm border-2 border-white/20",
    highlight: "bg-gray-700/40 backdrop-blur-sm border-2 border-gray-400/30",
    muted: "bg-white/5 backdrop-blur-sm border border-white/10",
  };
  
  return (
    <div className={`rounded-xl p-6 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

