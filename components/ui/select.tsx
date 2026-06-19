 "use client";
 
 import * as SelectPrimitive from "@radix-ui/react-select";
 import { Check, ChevronDown } from "lucide-react";
 
 import { cn } from "@/lib/utils";
 
 export const Select = SelectPrimitive.Root;
 export const SelectGroup = SelectPrimitive.Group;
 export const SelectValue = SelectPrimitive.Value;
 
 export function SelectTrigger({
   className,
   children,
   ...props
 }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
   return (
     <SelectPrimitive.Trigger
       className={cn(
         "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-left text-sm text-foreground",
         "outline-none transition-shadow focus:border-border focus:bg-card/60 focus:ring-2 focus:ring-ring/40",
         "data-[placeholder]:text-muted-foreground",
         "disabled:cursor-not-allowed disabled:opacity-50",
         className,
       )}
       {...props}
     >
       {children}
       <SelectPrimitive.Icon asChild>
         <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
       </SelectPrimitive.Icon>
     </SelectPrimitive.Trigger>
   );
 }
 
 export function SelectContent({
   className,
   children,
   position = "popper",
   ...props
 }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
   return (
     <SelectPrimitive.Portal>
       <SelectPrimitive.Content
         position={position}
         className={cn(
           "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl shadow-black/40 backdrop-blur-xl",
           "data-[state=open]:animate-in data-[state=closed]:animate-out",
           "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
           "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
           className,
         )}
         {...props}
       >
         <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
       </SelectPrimitive.Content>
     </SelectPrimitive.Portal>
   );
 }
 
 export function SelectItem({
   className,
   children,
   ...props
 }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
   return (
     <SelectPrimitive.Item
       className={cn(
         "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm text-foreground outline-none",
         "focus:bg-accent/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
         className,
       )}
       {...props}
     >
       <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
         <SelectPrimitive.ItemIndicator>
           <Check className="h-4 w-4 text-primary" aria-hidden />
         </SelectPrimitive.ItemIndicator>
       </span>
       <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
     </SelectPrimitive.Item>
   );
 }
