import { useAuth } from "@/hooks/use-auth";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { DashboardLayout } from "@/components/Layout";
import { Link } from "wouter";
import { Plus, MapPin, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const createEventFormSchema = insertEventSchema.pick({
  name: true,
  date: true,
  location: true,
  description: true,
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      // Date handling usually needs string for input type="date"
    },
  });

  const onSubmit = async (data: CreateEventFormValues) => {
    try {
      await createEvent.mutateAsync(data);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create event", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary mb-2">Welcome back, {user?.firstName}</h1>
          <p className="text-muted-foreground">Manage your events and logistics.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Create New Event</DialogTitle>
              <DialogDescription>
                Set up the basics for your new event.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Summer Gala 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} 
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris, France" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Event details..." className="resize-none" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createEvent.isPending} className="bg-primary text-white">
                    {createEvent.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {events?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No events yet</h3>
          <p className="text-muted-foreground mt-2">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="group bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-secondary/30 rounded-xl text-primary group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                    Active
                  </span>
                </div>
                
                <h3 className="text-xl font-serif font-bold text-primary mb-2 line-clamp-1">{event.name}</h3>
                
                <div className="space-y-2 mt-auto text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(event.date), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Manage Event <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
