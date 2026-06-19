 import { forwardRef, type InputHTMLAttributes } from "react";
 
 import { cn } from "@/lib/utils";
 
 export type InputProps = InputHTMLAttributes<HTMLInputElement>;
 
 export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
   return (
     <input
       ref={ref}
       className={cn(
         "h-10 w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground",
         "placeholder:text-muted-foreground",
         "outline-none transition-shadow focus:border-border focus:bg-card/60 focus:ring-2 focus:ring-ring/40",
         "disabled:cursor-not-allowed disabled:opacity-50",
         className,
       )}
       {...props}
     />
   );
 });
 
 Input.displayName = "Input";
