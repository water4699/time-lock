"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Card } from "./ui/Card";

interface MessageDisplayProps {
  message: string;
}

export function MessageDisplay({ message }: MessageDisplayProps) {
  if (!message) return null;

  const isError = message.includes("Error") || message.includes("not") || message.includes("Missing") || message.includes("failed");
  const isSuccess = message.includes("successfully") || message.includes("Success");
  
  const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;
  
  return (
    <Card variant={isError ? "highlight" : "default"} className="border-2">
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
          isError ? "text-red-400" : isSuccess ? "text-green-400" : "text-gray-300"
        }`} />
        <p className={`text-sm ${
          isError ? "text-red-300" : isSuccess ? "text-green-300" : "text-gray-200"
        } whitespace-pre-wrap`}>
          {message}
        </p>
      </div>
    </Card>
  );
}

