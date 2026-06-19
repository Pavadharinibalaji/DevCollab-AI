import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-transparent hover:bg-accent",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3 text-sm",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

const baseButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export function buttonClassName({
  variant = "default",
  size = "default",
  className,
}: Pick<ButtonProps, "variant" | "size" | "className">) {
  return cn(baseButtonClass, variantStyles[variant], sizeStyles[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button ref={ref} className={buttonClassName({ variant, size, className })} {...props} />
  ),
);

Button.displayName = "Button";
