import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
export function Button({ className, variant = "primary", asChild = false, ...props }: React.ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost"; asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn("button", `button-${variant}`, className)} {...props} />;
}
