 "use client";
 
 import { useMemo } from "react";
 import { z } from "zod";
 import { zodResolver } from "@hookform/resolvers/zod";
 import { Controller, useForm } from "react-hook-form";
 
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Textarea } from "@/components/ui/textarea";
 import { cn } from "@/lib/utils";
 import type { KanbanAssignee, KanbanPriority } from "@/types";
 
 const priorityOptions = [
   { value: "low", label: "Low" },
   { value: "medium", label: "Medium" },
   { value: "high", label: "High" },
   { value: "urgent", label: "Urgent" },
 ] as const satisfies ReadonlyArray<{ value: KanbanPriority; label: string }>;
 
 export const createTaskSchema = z.object({
   title: z.string().trim().min(2, "Title must be at least 2 characters."),
   description: z
     .string()
     .trim()
     .max(800, "Description must be 800 characters or less.")
     .optional()
     .or(z.literal("")),
   priority: z.enum(["low", "medium", "high", "urgent"]),
   dueDate: z
     .string()
     .min(1, "Due date is required.")
     .refine((value) => !Number.isNaN(Date.parse(value)), "Due date is invalid."),
   assigneeId: z.string().min(1, "Assignee is required."),
 });
 
 export type CreateTaskValues = z.infer<typeof createTaskSchema>;
 
 type CreateTaskModalProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   assignees: KanbanAssignee[];
   onCreate: (values: CreateTaskValues) => void | Promise<void>;
 };
 
 export function CreateTaskModal({
   open,
   onOpenChange,
   assignees,
   onCreate,
 }: CreateTaskModalProps) {
   const defaultValues = useMemo<CreateTaskValues>(
     () => ({
       title: "",
       description: "",
       priority: "medium",
       dueDate: "",
       assigneeId: assignees[0]?.id ?? "",
     }),
     [assignees],
   );
 
   const {
     register,
     handleSubmit,
     control,
     formState: { errors, isSubmitting },
     reset,
   } = useForm<CreateTaskValues>({
     resolver: zodResolver(createTaskSchema),
     defaultValues,
     mode: "onSubmit",
   });
 
   async function submit(values: CreateTaskValues) {
     await onCreate({
       ...values,
       description: values.description?.trim() ? values.description.trim() : "",
     });
     reset(defaultValues);
     onOpenChange(false);
   }
 
   function onClose(nextOpen: boolean) {
     onOpenChange(nextOpen);
     if (!nextOpen) {
       reset(defaultValues);
     }
   }
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="p-0">
         <div className="border-b border-border/60 p-6">
           <DialogHeader>
             <DialogTitle>Create task</DialogTitle>
             <DialogDescription>
               Add a task with the right priority, owner, and timeline.
             </DialogDescription>
           </DialogHeader>
         </div>
 
         <form onSubmit={handleSubmit(submit)} className="space-y-5 p-6">
           <Field
             id="title"
             label="Title"
             error={errors.title?.message}
             hint="Keep it short and actionable."
           >
             <Input
               id="title"
               placeholder="e.g. Ship Kanban task creation"
               autoComplete="off"
               {...register("title")}
             />
           </Field>
 
           <Field
             id="description"
             label="Description"
             error={errors.description?.message}
             hint="Optional. Add context, links, or acceptance criteria."
           >
             <Textarea
               id="description"
               placeholder="What should be done, and what does success look like?"
               {...register("description")}
             />
           </Field>
 
           <div className="grid gap-4 sm:grid-cols-2">
             <Field id="priority" label="Priority" error={errors.priority?.message}>
               <Controller
                 control={control}
                 name="priority"
                 render={({ field }) => (
                   <Select value={field.value} onValueChange={field.onChange}>
                     <SelectTrigger id="priority">
                       <SelectValue placeholder="Select priority" />
                     </SelectTrigger>
                     <SelectContent>
                       {priorityOptions.map((opt) => (
                         <SelectItem key={opt.value} value={opt.value}>
                           {opt.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 )}
               />
             </Field>
 
             <Field id="dueDate" label="Due date" error={errors.dueDate?.message}>
               <Input id="dueDate" type="date" {...register("dueDate")} />
             </Field>
           </div>
 
           <Field id="assigneeId" label="Assignee" error={errors.assigneeId?.message}>
             <Controller
               control={control}
               name="assigneeId"
               render={({ field }) => (
                 <Select value={field.value} onValueChange={field.onChange}>
                   <SelectTrigger id="assigneeId">
                     <SelectValue placeholder="Select assignee" />
                   </SelectTrigger>
                   <SelectContent>
                     {assignees.map((assignee) => (
                       <SelectItem key={assignee.id} value={assignee.id}>
                         {assignee.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               )}
             />
           </Field>
 
           <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
             <Button
               type="button"
               variant="outline"
               className="border-border/80 bg-background/40 hover:bg-accent"
               onClick={() => onClose(false)}
               disabled={isSubmitting}
             >
               Cancel
             </Button>
             <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? "Creating…" : "Create task"}
             </Button>
           </div>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
 
 function Field({
   id,
   label,
   error,
   hint,
   children,
 }: {
   id: string;
   label: string;
   error?: string;
   hint?: string;
   children: React.ReactNode;
 }) {
   return (
     <div className="space-y-2">
       <div className="flex items-baseline justify-between gap-3">
         <Label htmlFor={id}>{label}</Label>
         {error ? (
           <p className="text-xs font-medium text-red-300">{error}</p>
         ) : null}
       </div>
       {children}
       {hint ? (
         <p className={cn("text-xs text-muted-foreground", error && "text-red-300/80")}>
           {hint}
         </p>
       ) : null}
     </div>
   );
 }
