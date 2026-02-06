import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGuestPortal, useToggleSelfManagement, useUpdateRSVP, useRegisterForEvent, useUnregisterFromEvent } from "@/hooks/use-guest-portal";
import { GuestLayout } from "@/components/GuestLayout";
import { WaitlistBell } from "@/components/WaitlistBell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  Hotel, 
  Plane, 
  MapPin,
  Users,
  Shield,
  Settings,
  ChevronRight,
  AlertCircle,
  Clock,
  Star,
  ArrowRight,
  Plus,
  X,
  Check
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
}

export default function GuestDashboard() {
  const [match, params] = useRoute("/guest/:token");
  const [, navigate] = useLocation();
  const token = params?.token || "";
  
  const { data: guestData, isLoading } = useGuestPortal(token);
  const toggleSelfManagement = useToggleSelfManagement(token);
  const updateRSVP = useUpdateRSVP(token);
  const registerForEvent = useRegisterForEvent(token);
  const unregisterFromEvent = useUnregisterFromEvent(token);
  
  // State for travel details
  const [selfManageFlights, setSelfManageFlights] = useState(false);
  const [selfManageHotel, setSelfManageHotel] = useState(false);
  
  // State for RSVP dialog
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'confirmed' | 'declined' | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: "", relationship: "", age: undefined });
  
  // State for itinerary dialog
  const [showItineraryDialog, setShowItineraryDialog] = useState(false);

  // Initialize toggle states from guest data when it loads
  useEffect(() => {
    if (guestData) {
      setSelfManageFlights(guestData.selfManageFlights || false);
      setSelfManageHotel(guestData.selfManageHotel || false);
    }
  }, [guestData]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (!guestData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-serif">Invalid Access Link</h2>
          <p className="text-muted-foreground">
            Please check your invitation email for the correct link
          </p>
        </div>
      </div>
    );
  }

  const handleToggleSelfManage = async (type: 'flights' | 'hotel', value: boolean) => {
    const updates = type === 'flights' 
      ? { selfManageFlights: value }
      : { selfManageHotel: value };

    try {
      await toggleSelfManagement.mutateAsync(updates);
      
      if (type === 'flights') {
        setSelfManageFlights(value);
      } else {
        setSelfManageHotel(value);
      }
      
      toast({
        title: "Preferences Updated",
        description: value 
          ? `You'll manage your own ${type}. Removed from logistics counts.`
          : `Agent will manage your ${type}. Added back to logistics.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      });
    }
  };

  const handleSubmitTravelDetails = async () => {
    try {
      toast({
        title: "Travel Preferences Saved",
        description: "Your travel management preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save travel preferences",
        variant: "destructive"
      });
    }
  };

  const handleAddFamilyMember = () => {
    const maxSeats = guestData?.allocatedSeats || 1;
    const currentSeats = 1 + familyMembers.length;
    
    if (newMember.name && newMember.relationship && currentSeats < maxSeats) {
      setFamilyMembers([...familyMembers, newMember]);
      setNewMember({ name: "", relationship: "", age: undefined });
    }
  };

  const handleRSVPSubmit = async () => {
    if (!rsvpStatus) {
      toast({
        title: "Please select your response",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateRSVP.mutateAsync({
        status: rsvpStatus,
        confirmedSeats: rsvpStatus === 'confirmed' ? (1 + familyMembers.length) : 0,
        familyMembers: rsvpStatus === 'confirmed' ? familyMembers : undefined
      });
      
      if (rsvpStatus === 'declined') {
        toast({
          title: "Response Recorded",
          description: "We're sorry you can't make it. You have been removed from the guest list.",
        });
        // Redirect after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast({
          title: "RSVP Confirmed!",
          description: `${1 + familyMembers.length} seat(s) confirmed`,
        });
      }
      
      setShowRSVPDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit RSVP",
        variant: "destructive"
      });
    }
  };

  const handleToggleItineraryEvent = async (event: any) => {
    try {
      if (event.registered) {
        await unregisterFromEvent.mutateAsync(event.id);
        toast({
          title: "Event Removed",
          description: `Removed from "${event.title}"`,
        });
      } else {
        await registerForEvent.mutateAsync(event.id);
        toast({
          title: "Event Added",
          description: `Registered for "${event.title}"`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    }
  };

  const progress = {
    rsvp: guestData.status === 'confirmed',
    bleisure: !!(guestData.extendedCheckIn || guestData.extendedCheckOut),
    itinerary: (guestData.itinerary?.filter((e: any) => e.registered)?.length || 0) > 0,
    idVault: guestData.idVerificationStatus === 'verified'
  };

  const completionPercentage = (
    (progress.rsvp ? 25 : 0) +
    (progress.bleisure ? 25 : 0) +
    (progress.itinerary ? 25 : 0) +
    (progress.idVault ? 25 : 0)
  );

  return (
    <GuestLayout step={1} bookingRef={guestData.bookingRef}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 md:p-12 text-center"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            {guestData.label?.name || "Guest"}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-serif text-primary mb-3">
            Welcome, {guestData.name.split(' ')[0]}!
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {guestData.event.name}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{format(new Date(guestData.event.date), 'MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span>{guestData.event.location}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Main Content Sections */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* RSVP Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <CardTitle>RSVP</CardTitle>
                </div>
                {progress.rsvp && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
              <CardDescription>Respond to your invitation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {guestData.status === 'confirmed' ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Confirmed</span>
                  </div>
                  <p className="text-sm text-green-600">
                    You've confirmed {guestData.confirmedSeats || 1} seat(s)
                  </p>
                </div>
              ) : guestData.status === 'declined' ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    You've declined this invitation
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    Please respond to your invitation
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => setShowRSVPDialog(true)}
                className="w-full"
                variant={guestData.status === 'pending' ? 'default' : 'outline'}
              >
                {guestData.status === 'confirmed' ? 'Update RSVP' : 'Respond Now'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Itinerary Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <CardTitle>Event Schedule</CardTitle>
                </div>
                {progress.itinerary && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
              <CardDescription>Select events to attend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {guestData.itinerary && guestData.itinerary.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {guestData.itinerary.filter((e: any) => e.registered).length} of {guestData.itinerary.length} events selected
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {guestData.itinerary.slice(0, 3).map((event: any) => (
                        <div key={event.id} className="flex items-center gap-2 text-sm">
                          {event.registered ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                          )}
                          <span className={event.registered ? "text-foreground" : "text-muted-foreground"}>
                            {event.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowItineraryDialog(true)}
                    className="w-full"
                    variant="outline"
                  >
                    View Schedule
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No events available yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Travel Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Travel Details
            </CardTitle>
            <CardDescription>Manage your travel preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Arrival</Label>
                <div className="font-medium">
                  {guestData.arrivalDate 
                    ? format(new Date(guestData.arrivalDate), 'MMM dd, yyyy')
                    : "TBD"
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {guestData.arrivalDate 
                    ? format(new Date(guestData.arrivalDate), 'h:mm a')
                    : ""
                  }
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Departure</Label>
                <div className="font-medium">
                  {guestData.departureDate 
                    ? format(new Date(guestData.departureDate), 'MMM dd, yyyy')
                    : "TBD"
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {guestData.departureDate 
                    ? format(new Date(guestData.departureDate), 'h:mm a')
                    : ""
                  }
                </div>
              </div>
            </div>

            <Separator />

            {/* Self-Management Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-medium">Self-Manage Flights</Label>
                  <p className="text-sm text-muted-foreground">
                    Book your own flights (removes you from group logistics)
                  </p>
                </div>
                <Switch
                  checked={selfManageFlights}
                  onCheckedChange={(checked) => handleToggleSelfManage('flights', checked)}
                  disabled={toggleSelfManagement.isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-medium">Self-Manage Hotel</Label>
                  <p className="text-sm text-muted-foreground">
                    Book your own accommodation (removes you from room blocks)
                  </p>
                </div>
                <Switch
                  checked={selfManageHotel}
                  onCheckedChange={(checked) => handleToggleSelfManage('hotel', checked)}
                  disabled={toggleSelfManagement.isPending}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmitTravelDetails}
              className="w-full"
              disabled={toggleSelfManagement.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Travel Preferences
            </Button>

            {/* Room Upgrade Request Button */}
            <Button 
              onClick={() => navigate(`/guest/${token}/room-upgrade`)}
              variant="outline"
              className="w-full border-accent/30 hover:bg-accent/10"
            >
              <Hotel className="w-4 h-4 mr-2" />
              Request Room Upgrade
            </Button>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pb-8"
        >
          <Button 
            size="lg"
            className="px-12"
            onClick={() => navigate(`/guest/${token}/bleisure`)}
          >
            Continue to Additional Services
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
        {/* RSVP Dialog */}
        <Dialog open={showRSVPDialog} onOpenChange={setShowRSVPDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>RSVP to {guestData.event.name}</DialogTitle>
              <DialogDescription>
                Please let us know if you'll be attending
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Response Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={rsvpStatus === 'confirmed' ? 'default' : 'outline'}
                  className="h-auto flex-col gap-2 py-6"
                  onClick={() => setRsvpStatus('confirmed')}
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span className="text-lg">Accept</span>
                </Button>
                <Button
                  variant={rsvpStatus === 'declined' ? 'destructive' : 'outline'}
                  className="h-auto flex-col gap-2 py-6"
                  onClick={() => setRsvpStatus('declined')}
                >
                  <X className="w-8 h-8" />
                  <span className="text-lg">Decline</span>
                </Button>
              </div>

              {/* Family Members (only show if confirmed) */}
              {rsvpStatus === 'confirmed' && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Add Family Members</Label>
                    <p className="text-sm text-muted-foreground">
                      You have {guestData.allocatedSeats || 1} total seat(s). {(guestData.allocatedSeats || 1) - 1 - familyMembers.length} remaining.
                    </p>
                  </div>

                  {familyMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.relationship}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFamilyMembers(familyMembers.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {familyMembers.length < (guestData.allocatedSeats || 1) - 1 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Relationship</Label>
                          <Input
                            value={newMember.relationship}
                            onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                            placeholder="e.g., Spouse, Child"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleAddFamilyMember}
                        variant="outline"
                        className="w-full"
                        disabled={!newMember.name || !newMember.relationship}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Family Member
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRSVPDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRSVPSubmit} disabled={!rsvpStatus || updateRSVP.isPending}>
                {updateRSVP.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit RSVP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Itinerary Dialog */}
        <Dialog open={showItineraryDialog} onOpenChange={setShowItineraryDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Event Schedule</DialogTitle>
              <DialogDescription>
                Select the events you plan to attend
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {guestData.itinerary && guestData.itinerary.length > 0 ? (
                guestData.itinerary.map((event: any) => (
                  <Card key={event.id} className={event.registered ? 'border-primary/50 bg-primary/5' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            {event.registered && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Registered
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(event.startTime), 'MMM dd, h:mm a')}
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
                                {event.currentAttendees || 0}/{event.capacity}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant={event.registered ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => handleToggleItineraryEvent(event)}
                          disabled={registerForEvent.isPending || unregisterFromEvent.isPending}
                        >
                          {event.registered ? 'Remove' : 'Add'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No events available yet</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowItineraryDialog(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </GuestLayout>
  );
}

