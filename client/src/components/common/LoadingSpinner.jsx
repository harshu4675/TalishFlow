import { cn } from "@/utils/cn";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-3",
  xl: "w-14 h-14 border-4",
};

export default function LoadingSpinner({ size = "md", className }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "rounded-full border-solid border-[#2874F0]/20 border-t-primary animate-spin",
        sizes[size],
        className,
      )}
    />
  );
}
