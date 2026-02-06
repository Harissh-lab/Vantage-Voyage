import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { DashboardLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CheckCircle, Calendar, MapPin, Hotel, Plane, Train, Users, Phone, MapPinned, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EventPreview() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [travelOptions, setTravelOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [eventRes, clientRes, hotelRes, travelRes] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/events/${id}/client-details`),
        fetch(`/api/events/${id}/hotel-bookings`),
        fetch(`/api/events/${id}/travel-options`),
      ]);

      if (eventRes.ok) setEvent(await eventRes.json());
      if (clientRes.ok) setClientDetails(await clientRes.json());
      if (hotelRes.ok) setHotelBookings(await hotelRes.json());
      if (travelRes.ok) setTravelOptions(await travelRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/events/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await fetchAllData();
        alert("Event published successfully! Clients can now access it with the event code.");
      } else {
        throw new Error("Failed to publish event");
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert("Failed to publish event. Please try again.");
    } finally {
      setIsPublishing(false);
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif text-primary mb-2">Event Preview</h1>
              <p className="text-muted-foreground">Review all details before publishing</p>
            </div>
            <div className="flex gap-2">
              {event?.isPublished ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" /> Published
                </Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Event Basic Info */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">Event Details</CardTitle>
              <CardDescription>Basic event information</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/setup`)}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Event Name</label>
              <p className="text-lg font-semibold">{event?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </label>
                <p className="font-medium">{event?.date && format(new Date(event.date), "PPP")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </label>
                <p className="font-medium">{event?.location}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Event Code</label>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-mono font-bold bg-primary/10 text-primary px-4 py-3 rounded-lg inline-block border-2 border-primary/20">
                  {event?.eventCode}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(event?.eventCode);
                    alert("Event code copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with your client. They'll use it to access the event details.
              </p>
            </div>
            {event?.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground">{event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Details */}
        {clientDetails && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif">Client Details</CardTitle>
                <CardDescription>Contact information and guest categories</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/setup`)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Client Name
                  </label>
                  <p className="font-medium">{clientDetails.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </label>
                  <p className="font-medium">{clientDetails.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPinned className="w-4 h-4" /> Address
                </label>
                <p className="font-medium">{clientDetails.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Guest Categories</label>
                <div className="flex gap-2 mt-2">
                  {clientDetails.hasVipGuests && <Badge>VIP Guests</Badge>}
                  {clientDetails.hasFriends && <Badge>Friends</Badge>}
                  {clientDetails.hasFamily && <Badge>Family</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hotel Bookings */}
        {hotelBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif">Hotel Booking</CardTitle>
                <CardDescription>Accommodation details</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/setup`)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {hotelBookings.map((booking, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hotel className="w-5 h-5 text-primary" />
                    <p className="text-lg font-semibold">{booking.hotelName}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Check-in</label>
                      <p className="font-medium">{format(new Date(booking.checkInDate), "PP")}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Check-out</label>
                      <p className="font-medium">{format(new Date(booking.checkOutDate), "PP")}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Rooms</label>
                      <p className="font-medium">{booking.numberOfRooms} rooms</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Travel Options */}
        {travelOptions.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif">Travel Options</CardTitle>
                <CardDescription>Transportation details</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/setup`)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {travelOptions.map((option, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    {option.travelMode === "flight" ? (
                      <Plane className="w-5 h-5 text-primary" />
                    ) : (
                      <Train className="w-5 h-5 text-primary" />
                    )}
                    <p className="text-lg font-semibold capitalize">{option.travelMode}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Route</label>
                      <p className="font-medium">{option.fromLocation} → {option.toLocation}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Dates</label>
                      <p className="font-medium">
                        {option.departureDate && format(new Date(option.departureDate), "PP")} - {option.returnDate && format(new Date(option.returnDate), "PP")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Publish Button */}
        <div className="flex justify-end gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate(`/events/${id}/setup`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Event
          </Button>
          
          {!event?.isPublished && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-primary text-white">
                  <CheckCircle className="w-4 h-4 mr-2" /> Publish Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to publish this event? Once published, clients will be able to access it using the event code: <strong className="font-mono">{event?.eventCode}</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePublish} disabled={isPublishing}>
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Event"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
