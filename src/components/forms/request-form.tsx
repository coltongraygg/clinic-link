"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import autoAnimate from "@formkit/auto-animate";

const sessionSchema = z.object({
  clinicName: z.string().min(1, "Clinic name is required"),
  date: z.date(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  notes: z.string().optional(),
});

const requestSchema = z.object({
  sessions: z.array(sessionSchema).min(1, "At least one session is required"),
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function RequestForm() {
  const router = useRouter();
  const sessionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionsRef.current) {
      autoAnimate(sessionsRef.current);
    }
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      sessions: [
        {
          clinicName: "",
          date: new Date(),
          startTime: "09:00",
          endTime: "17:00",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sessions",
  });

  const watchedValues = watch();

  const utils = api.useUtils();

  const createRequestMutation = api.timeOffRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Coverage request submitted");
      void utils.clinicSession.getUncovered.invalidate();
      void utils.dashboard.getStats.invalidate();
      void utils.timeOffRequest.getMyRequests.invalidate();
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addSession = () => {
    append({
      clinicName: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "17:00",
      notes: "",
    });
  };

  const onSubmit = async (data: RequestFormData) => {
    // Convert time strings to Date objects
    const formattedSessions = data.sessions.map((session) => {
      const [startHour, startMinute] = session.startTime.split(":");
      const [endHour, endMinute] = session.endTime.split(":");

      const startTime = new Date(session.date);
      startTime.setHours(
        parseInt(startHour ?? "0", 10),
        parseInt(startMinute ?? "0", 10),
        0,
        0,
      );

      const endTime = new Date(session.date);
      endTime.setHours(
        parseInt(endHour ?? "0", 10),
        parseInt(endMinute ?? "0", 10),
        0,
        0,
      );

      return {
        ...session,
        startTime,
        endTime,
      };
    });

    // Auto-calculate startDate and endDate from sessions
    const sessionDates = formattedSessions.map((s) => s.date);
    const startDate = new Date(
      Math.min(...sessionDates.map((d) => d.getTime())),
    );
    const endDate = new Date(Math.max(...sessionDates.map((d) => d.getTime())));

    createRequestMutation.mutate({
      startDate,
      endDate,
      sessions: formattedSessions,
    });
  };

  return (
    <div className="pb-24">
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sessions List */}
          <div ref={sessionsRef} className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border p-6 shadow-xs">
                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <Label htmlFor={`sessions.${index}.date`}>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "mt-2 w-full justify-start text-left font-normal",
                            !watchedValues.sessions?.[index]?.date &&
                              "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {watchedValues.sessions?.[index]?.date
                            ? format(watchedValues.sessions[index].date, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={watchedValues.sessions?.[index]?.date}
                          onSelect={(date) =>
                            date && setValue(`sessions.${index}.date`, date)
                          }
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clinic Name */}
                  <div>
                    <Label htmlFor={`sessions.${index}.clinicName`}>
                      Clinic Name
                    </Label>
                    <Input
                      {...register(`sessions.${index}.clinicName`)}
                      placeholder="e.g., Tuesday Trauma Clinic"
                      className="mt-2"
                    />
                    {errors.sessions?.[index]?.clinicName && (
                      <p className="text-destructive mt-1 text-sm">
                        {errors.sessions[index]?.clinicName?.message}
                      </p>
                    )}
                  </div>

                  {/* Times */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`sessions.${index}.startTime`}>
                        Start Time
                      </Label>
                      <Input
                        {...register(`sessions.${index}.startTime`)}
                        type="time"
                        className="mt-2"
                      />
                      {errors.sessions?.[index]?.startTime && (
                        <p className="text-destructive mt-1 text-sm">
                          {errors.sessions[index]?.startTime?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`sessions.${index}.endTime`}>
                        End Time
                      </Label>
                      <Input
                        {...register(`sessions.${index}.endTime`)}
                        type="time"
                        className="mt-2"
                      />
                      {errors.sessions?.[index]?.endTime && (
                        <p className="text-destructive mt-1 text-sm">
                          {errors.sessions[index]?.endTime?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor={`sessions.${index}.notes`}>
                      Notes (Optional)
                    </Label>
                    <Textarea
                      {...register(`sessions.${index}.notes`)}
                      placeholder="Any specific details..."
                      className="mt-2"
                      rows={2}
                    />
                  </div>

                  {/* Remove Button */}
                  {fields.length > 1 && (
                    <div className="flex justify-end border-t pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        type="button"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Session Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addSession}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Session
          </Button>

          {/* Form Errors */}
          {errors.sessions && (
            <p className="text-destructive text-sm">
              {errors.sessions.message}
            </p>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createRequestMutation.isPending}
              className="flex-1"
            >
              {isSubmitting || createRequestMutation.isPending
                ? "Submitting..."
                : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
