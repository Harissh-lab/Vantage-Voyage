import { useRoute, useLocation } from "wouter";
import { useGuestLookup } from "@/hooks/use-guests";
import { GuestLayout } from "@/components/GuestLayout";
import { Loader2, Plane, Calendar, MapPin, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function GuestTravel() {
  const [match, params] = useRoute("/guest/travel"); // wouter params might not capture query well
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const ref = searchParams.get("ref") || "";
  const { data: guestInfo, isLoading } = useGuestLookup(ref);
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!guestInfo) return <div className="p-10 text-center">Invalid Reference</div>;

  const { event, ...guest } = guestInfo;

  return (
    <GuestLayout step={2} bookingRef={ref}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 bg-secondary/30 rounded-full text-sm font-medium text-primary mb-4">
            {event.name}
          </div>
          <h1 className="text-4xl font-serif text-primary mb-2">Hello, {guest.name}</h1>
          <p className="text-muted-foreground">Here are your confirmed travel details.</p>
        </div>

        {/* Travel Card */}
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground flex justify-between items-center">
            <h2 className="font-serif text-xl flex items-center gap-2">
              <Plane className="w-5 h-5 text-secondary" /> Itinerary
            </h2>
            <div className="text-sm opacity-80 font-mono">{guest.bookingRef}</div>
          </div>
          
          <div className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Destination</div>
                <div className="flex items-center gap-2 text-xl font-medium text-primary">
                  <MapPin className="w-5 h-5 text-accent" /> {event.location}
                </div>
              </div>
              
              <div className="flex gap-8">
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Arrival</div>
                  <div className="text-lg font-medium">{guest.arrivalDate ? format(new Date(guest.arrivalDate), "MMM d, yyyy") : "TBD"}</div>
                  <div className="text-sm text-muted-foreground">{guest.arrivalDate ? format(new Date(guest.arrivalDate), "h:mm a") : ""}</div>
                </div>
                <div className="w-[1px] bg-border/60" />
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Departure</div>
                  <div className="text-lg font-medium">{guest.departureDate ? format(new Date(guest.departureDate), "MMM d, yyyy") : "TBD"}</div>
                  <div className="text-sm text-muted-foreground">{guest.departureDate ? format(new Date(guest.departureDate), "h:mm a") : ""}</div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 rounded-xl p-6 border border-border/50">
              <h3 className="font-medium text-primary mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Rooming List
              </h3>
              <ul className="space-y-3">
                <li className="flex justify-between text-sm">
                  <span>{guest.name}</span>
                  <span className="text-muted-foreground">Primary Guest</span>
                </li>
                {/* Family members would be mapped here */}
                <li className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  Need to add a +1 or child? Please contact your agent.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            className="btn-primary px-8 h-12 text-lg rounded-full"
            onClick={() => setLocation(`/guest/concierge?ref=${ref}`)}
          >
            Continue to Concierge <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </GuestLayout>
  );
}
