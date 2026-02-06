import { useState } from "react";
import { useLocation } from "wouter";
import { useGuestPortal, useRegisterForEvent, useUnregisterFromEvent } from "@/hooks/use-guest-portal";
import { GuestLayout } from "@/components/GuestLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle, Star, Wine, Car, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, isWithinInterval, isBefore, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Helper to get icon for event type
const getEventIcon = (type?: string) => {
  switch (type) {
    case 'meal': return Wine;
    case 'transport': return Car;
    case 'activity': return Sparkles;
    default: return Calendar;
  }
};

export default function GuestItinerary({ token }: { token: string }) {
  const { data: guestData, isLoading } = useGuestPortal(token);
  const registerForEvent = useRegisterForEvent(token);
  const unregisterFromEvent = useUnregisterFromEvent(token);
  const [, navigate] = useLocation();
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!guestData) {
    return <div className="p-10 text-center">Invalid access link</div>;
  }

  // Check for time conflicts and return conflicting events
  const getConflicts = (eventToCheck: any) => {
    if (!guestData.itinerary) return [];
    
    const eventStart = new Date(eventToCheck.startTime);
    const eventEnd = new Date(eventToCheck.endTime);
    
    return guestData.itinerary.filter((item: any) => {
      if (!item.registered || item.id === eventToCheck.id) return false;
      
      const itemStart = new Date(item.startTime);
      const itemEnd = new Date(item.endTime);
      
      // Check if times overlap
      return (
        (eventStart >= itemStart && eventStart < itemEnd) ||
        (eventEnd > itemStart && eventEnd <= itemEnd) ||
        (eventStart <= itemStart && eventEnd >= itemEnd)
      );
    });
  };
  
  const hasConflict = (eventToCheck: any) => {
    return getConflicts(eventToCheck).length > 0;
  };

  const handleToggleEvent = async (event: any) => {
    // Check if already registered
    const isRegistered = event.registered;
    
    if (isRegistered) {
      try {
        await unregisterFromEvent.mutateAsync(event.id);
        toast({
          title: "Removed from itinerary",
          description: `You've been removed from "${event.title}"`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove from event",
          variant: "destructive"
        });
      }
    } else {
      // Check for conflicts before registering
      if (hasConflict(event)) {
        toast({
          title: "Schedule Conflict",
          description: "This event overlaps with another event in your schedule",
          variant: "destructive"
        });
        return;
      }
      
      // Check capacity
      if (event.capacity && event.currentAttendees >= event.capacity) {
        toast({
          title: "Event Full",
          description: "This event has reached maximum capacity",
          variant: "destructive"
        });
        return;
      }
      
      try {
        const result = await registerForEvent.mutateAsync(event.id);
        
        if (result.conflicts && result.conflicts.length > 0) {
          toast({
            title: "Conflict Detected",
            description: result.conflicts.join(", "),
            variant: "destructive"
          });
        } else {
          toast({
            title: "Added to itinerary!",
            description: `You're registered for "${event.title}"`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to register for event",
          variant: "destructive"
        });
      }
    }
  };

  // Group events by day
  const eventsByDay = guestData.itinerary?.reduce((acc: any, event: any) => {
    const day = format(new Date(event.startTime), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {}) || {};
  
  // Sort days
  const sortedDays = Object.keys(eventsByDay).sort();

  return (
    <GuestLayout step={3} bookingRef={guestData.bookingRef}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-serif text-primary mb-3">Your Itinerary</h1>
          <p className="text-lg text-muted-foreground">
            Core events and optional experiences — plan your perfect stay
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 text-sm">
            <Badge className="bg-primary">Mandatory</Badge>
            <span className="text-muted-foreground">Core Event</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="border-accent text-accent">Optional</Badge>
            <span className="text-muted-foreground">Add-on Activity</span>
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="space-y-6">
          {sortedDays.map((day) => {
            const events = eventsByDay[day].sort((a: any, b: any) => 
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
            
            return (
              <div key={day}>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-serif text-primary">
                    {format(new Date(day), 'EEEE, MMMM dd')}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {events.map((event: any) => {
                    const EventIcon = getEventIcon(event.type);
                    const conflicts = getConflicts(event);
                    const isConflict = conflicts.length > 0;
                    const isFull = event.capacity && event.currentAttendees >= event.capacity;
                    const isRegistered = event.registered;
                    const canInteract = !event.isMandatory;
                    
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card 
                          className={`
                            transition-all cursor-pointer
                            ${isRegistered ? 'border-primary/50 bg-primary/5' : 'hover:border-accent/50'}
                            ${!canInteract ? 'bg-secondary/10 border-primary' : ''}
                            ${isConflict && !isRegistered ? 'border-red-200 bg-red-50/50' : ''}
                          `}
                          onClick={() => canInteract && setSelectedEventId(event.id === selectedEventId ? null : event.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`
                                  w-12 h-12 rounded-full flex items-center justify-center
                                  ${isRegistered ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                                `}>
                                  <EventIcon className="w-6 h-6" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <CardTitle className="text-lg">{event.title}</CardTitle>
                                    {event.isMandatory ? (
                                      <Badge className="bg-primary">Mandatory</Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-accent text-accent">
                                        Optional
                                      </Badge>
                                    )}
                                    {isConflict && !isRegistered && (
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Conflict
                                      </Badge>
                                    )}
                                    {isRegistered && (
                                      <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                                    )}
                                  </div>
                                  
                                  <CardDescription>{event.description}</CardDescription>
                                  
                                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                      </div>
                                    )}
                                    {event.capacity && (
                                      <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {event.currentAttendees}/{event.capacity}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {canInteract && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant={isRegistered ? "secondary" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleEvent(event)}
                                    disabled={(!isRegistered && (isConflict || isFull)) || registerForEvent.isPending || unregisterFromEvent.isPending}
                                    className={isRegistered ? '' : 'btn-primary'}
                                  >
                                    {isRegistered ? "Remove" : isFull ? "Full" : "Add to Schedule"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          
                          {/* Warnings for conflicts */}
                          <AnimatePresence>
                            {canInteract && isConflict && !isRegistered && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <CardContent className="pt-0">
                                  <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <div className="font-semibold mb-2">Schedule Conflict Detected</div>
                                      <div className="text-sm space-y-1">
                                        {conflicts.map((conflictEvent: any) => (
                                          <div key={conflictEvent.id} className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                              Overlaps with "{conflictEvent.title}" ({format(new Date(conflictEvent.startTime), 'h:mm a')} - {format(new Date(conflictEvent.endTime), 'h:mm a')})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="mt-2 text-xs opacity-90">
                                        Remove the conflicting event(s) from your schedule to add this one.
                                      </div>
                                    </AlertDescription>
                                  </Alert>
                                </CardContent>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {sortedDays.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events scheduled yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Footer */}
        <motion.div
          className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Your Schedule</h3>
              <p className="text-sm text-muted-foreground">
                {guestData.itinerary?.filter((e: any) => e.registered).length || 0} events registered
              </p>
            </div>
            <Star className="w-8 h-8 text-accent" />
          </div>
        </motion.div>

        {/* Continue to Next Step */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-8"
        >
          <Button 
            size="lg"
            className="px-12"
            onClick={() => navigate(`/guest/${token}/concierge`)}
          >
            Continue to Concierge Services
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </GuestLayout>
  );
}
