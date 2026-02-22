import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  text?: string;
}

export function Loading({ className, size = "default", text }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}

export function InlineLoading({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}
