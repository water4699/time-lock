import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClass = "inline-flex items-center justify-center rounded-xl font-semibold text-white shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    primary: "bg-gray-700 hover:bg-gray-600 active:bg-gray-800 focus-visible:ring-gray-500 text-white",
    secondary: "bg-gray-600 hover:bg-gray-500 active:bg-gray-700 focus-visible:ring-gray-400 text-white",
    success: "bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500 text-white",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 text-white",
    ghost: "bg-white/10 hover:bg-white/20 active:bg-white/30 focus-visible:ring-white/50 text-white",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  );
}

