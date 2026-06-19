 import { forwardRef, type TextareaHTMLAttributes } from "react";
 
 import { cn } from "@/lib/utils";
 
 export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
 
 export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
   ({ className, ...props }, ref) => {
     return (
       <textarea
         ref={ref}
         className={cn(
           "min-h-24 w-full resize-none rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground",
           "placeholder:text-muted-foreground",
           "outline-none transition-shadow focus:border-border focus:bg-card/60 focus:ring-2 focus:ring-ring/40",
           "disabled:cursor-not-allowed disabled:opacity-50",
           className,
         )}
         {...props}
       />
     );
   },
 );
 
 Textarea.displayName = "Textarea";
