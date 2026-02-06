import { useAuth } from "@/hooks/use-auth";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { DashboardLayout } from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { Plus, MapPin, Calendar, ArrowRight, Loader2, Trash2, MoreVertical, Settings, Tag, Gift } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}).extend({
  clientName: z.string().min(1, "Client name is required"),
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

const eventCodeSchema = z.object({
  eventCode: z.string().min(1, "Event code is required"),
});

type EventCodeFormValues = z.infer<typeof eventCodeSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventCodeDialogOpen, setIsEventCodeDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

  const isAgent = user?.role === "agent";
  const isClient = user?.role === "client";

  // Show event code dialog for clients without event code
  useEffect(() => {
    if (isClient && !user?.eventCode && !isLoading) {
      setIsEventCodeDialogOpen(true);
    }
  }, [isClient, user, isLoading]);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      eventCode: "",
      // Date handling usually needs string for input type="date"
    },
  });

  const eventCodeForm = useForm<EventCodeFormValues>({
    resolver: zodResolver(eventCodeSchema),
    defaultValues: {
      eventCode: "",
    },
  });

  const onSubmit = async (data: CreateEventFormValues) => {
    try {
      console.log("Submitting event data:", data);
      const result = await createEvent.mutateAsync(data);
      console.log("Event created:", result);
      setIsDialogOpen(false);
      form.reset();
      // Navigate to event setup page
      navigate(`/events/${result.id}/setup`);
    } catch (error: any) {
      console.error("Failed to create event", error);
      alert(`Error: ${error.message || "Failed to create event"}`);
    }
  };

  const onEventCodeSubmit = async (data: EventCodeFormValues) => {
    try {
      const response = await fetch("/api/user/event-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Invalid event code");
      }

      setIsEventCodeDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to set event code", error);
      eventCodeForm.setError("eventCode", { message: "Invalid event code" });
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;
    try {
      await deleteEvent.mutateAsync(deleteEventId);
      setDeleteEventId(null);
    } catch (error: any) {
      console.error("Failed to delete event", error);
      alert(`Error: ${error.message || "Failed to delete event"}`);
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
      {/* Event Code Dialog for Clients */}
      <Dialog open={isEventCodeDialogOpen} onOpenChange={setIsEventCodeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Enter Event Code</DialogTitle>
            <DialogDescription>
              Please enter the event code provided by your agent to access your event.
            </DialogDescription>
          </DialogHeader>

          <Form {...eventCodeForm}>
            <form onSubmit={eventCodeForm.handleSubmit(onEventCodeSubmit)} className="space-y-4 py-4">
              <FormField
                control={eventCodeForm.control}
                name="eventCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. EVT-2025-ABC123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-primary text-white">
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary mb-2">Welcome back, {user?.firstName}</h1>
          <p className="text-muted-foreground">
            {isAgent ? "Manage your events and logistics." : "View your event details."}
          </p>
          {isClient && user?.eventCode && (
            <p className="text-sm text-muted-foreground mt-1">
              Event Code: <span className="font-mono font-semibold text-primary">{user.eventCode}</span>
            </p>
          )}
        </div>
        
        {isClient && (
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => setIsEventCodeDialogOpen(true)}
          >
            Enter Code
          </Button>
        )}
        
        {isAgent && (
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
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">Host or primary contact for this event</p>
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
        )}
      </div>

      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and will remove all associated data including guests, labels, and perks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Event"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {events?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No events yet</h3>
          <p className="text-muted-foreground mt-2">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => (
            <div key={event.id} className="group bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary/30 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                    Active
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteEventId(event.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <Link href={`/events/${event.id}`}>
                <div className="cursor-pointer">
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

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 text-xs h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/events/${event.id}?tab=labels`);
                        }}
                      >
                        <Tag className="w-3 h-3" />
                        Labels
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 text-xs h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/events/${event.id}?tab=perks`);
                        }}
                      >
                        <Gift className="w-3 h-3" />
                        Perks
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 text-xs h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/events/${event.id}/setup`);
                        }}
                      >
                        <Settings className="w-3 h-3" />
                        Setup
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Manage Event <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and will remove all associated data including guests, labels, and perks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Event"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
