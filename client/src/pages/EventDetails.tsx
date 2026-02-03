import { DashboardLayout } from "@/components/Layout";
import { useEvent } from "@/hooks/use-events";
import { useRoute, useLocation } from "wouter";
import { Loader2, Users, Tag, Gift, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGuests } from "@/hooks/use-guests";
import { useLabels } from "@/hooks/use-labels";
import { usePerks } from "@/hooks/use-perks";
import { useRequests } from "@/hooks/use-requests";
import { format } from "date-fns";

export default function EventDetails() {
  const [match, params] = useRoute("/events/:id");
  const id = Number(params?.id);
  const { data: event, isLoading: isEventLoading } = useEvent(id);
  
  // Fetch related data
  const { data: guests } = useGuests(id);
  const { data: labels } = useLabels(id);
  const { data: perks } = usePerks(id);
  const { data: requests } = useRequests(id);

  if (isEventLoading || !event) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <div className="text-sm text-accent-foreground/80 font-medium mb-1 uppercase tracking-wider">Event Dashboard</div>
            <h1 className="text-4xl font-serif text-primary mb-2">{event.name}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{format(new Date(event.date), "PPP p")}</span>
              <span>•</span>
              <span>{event.location}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="text-right hidden md:block">
              <div className="text-2xl font-serif font-bold text-primary">{guests?.length || 0}</div>
              <div className="text-xs text-muted-foreground uppercase">Guests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="text-muted-foreground text-xs uppercase mb-1">Total Guests</div>
          <div className="text-2xl font-serif text-primary">{guests?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="text-muted-foreground text-xs uppercase mb-1">Pending Requests</div>
          <div className="text-2xl font-serif text-accent-foreground">{requests?.filter(r => r.status === 'pending').length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="text-muted-foreground text-xs uppercase mb-1">VIP Labels</div>
          <div className="text-2xl font-serif text-primary">{labels?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="text-muted-foreground text-xs uppercase mb-1">Active Perks</div>
          <div className="text-2xl font-serif text-primary">{perks?.length || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="guests" className="w-full">
        <TabsList className="bg-white border border-border/50 p-1 mb-6 rounded-xl">
          <TabsTrigger value="guests" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Guests</TabsTrigger>
          <TabsTrigger value="labels" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Labels & Permissions</TabsTrigger>
          <TabsTrigger value="perks" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Perks & Add-ons</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-4">
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <h3 className="font-medium">Guest List</h3>
            </div>
            <div className="divide-y divide-border/50">
              {guests?.map(guest => (
                <div key={guest.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="font-medium text-primary">{guest.name}</div>
                    <div className="text-sm text-muted-foreground">{guest.email} • Ref: <span className="font-mono text-xs bg-muted px-1 rounded">{guest.bookingRef}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      guest.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      guest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {guest.status}
                    </span>
                  </div>
                </div>
              ))}
              {guests?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No guests added yet.</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="labels">
          <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
            <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Guest Labels</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Categorize your guests (VIP, Staff, Friend) to control which perks they can see and access.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="perks">
          <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
            <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Perks Configuration</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Define available add-ons like Airport Pickup, Spa Treatments, or Room Upgrades.</p>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Guest Requests</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Review and approve special requests from guests.</p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
