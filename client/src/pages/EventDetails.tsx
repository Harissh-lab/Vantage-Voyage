import { DashboardLayout } from "@/components/Layout";
import { useEvent } from "@/hooks/use-events";
import { useRoute, useLocation } from "wouter";
import { Loader2, Users, Tag, Gift, Inbox, Upload, FileSpreadsheet, Download, Eye, Edit, Plus, Trash2, Settings, FileDown, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGuests, useDeleteGuest } from "@/hooks/use-guests";
import { useLabels } from "@/hooks/use-labels";
import { usePerks } from "@/hooks/use-perks";
import { useRequests } from "@/hooks/use-requests";
import { useHotelBookings } from "@/hooks/use-hotel-bookings";
import { format } from "date-fns";
import { useState } from "react";
import { parseExcelFile, parseCSVFile, generateGuestListTemplate } from "@/lib/excelParser";
import { generateEventReport } from "@/lib/reportGenerator";
import { useToast } from "@/hooks/use-toast";
import { GuestLinkManager } from "@/components/GuestLinkManager";
import { CapacityAlert } from "@/components/CapacityAlert";

export default function EventDetails() {
  const [match, params] = useRoute("/events/:id");
  const id = Number(params?.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: event, isLoading: isEventLoading } = useEvent(id);
  
  // Get tab from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'guests';
  
  // Fetch related data
  const { data: guests, refetch: refetchGuests, isLoading: isLoadingGuests, error: guestsError } = useGuests(id);
  const { data: labels } = useLabels(id);
  const { data: perks } = usePerks(id);
  const { data: requests } = useRequests(id);
  const { data: hotelBookings } = useHotelBookings(id);
  const deleteGuest = useDeleteGuest();
  
  // Debug logging
  console.log('[DEBUG] Event ID:', id);
  console.log('[DEBUG] Guests data:', guests);
  console.log('[DEBUG] Guests loading:', isLoadingGuests);
  console.log('[DEBUG] Guests error:', guestsError);
  
  const [uploading, setUploading] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importedGuests, setImportedGuests] = useState<any[]>([]);
  
  // Label management state
  const [newLabelName, setNewLabelName] = useState("");
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  
  // Perk management state
  const [newPerkData, setNewPerkData] = useState({ name: "", description: "", type: "" });
  const [isAddingPerk, setIsAddingPerk] = useState(false);
  const [showPerkDialog, setShowPerkDialog] = useState(false);
  
  // Label-Perk assignment state
  const [selectedLabel, setSelectedLabel] = useState<any>(null);
  const [showAssignPerksDialog, setShowAssignPerksDialog] = useState(false);
  
  // Manual guest creation state
  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    dietaryRestrictions: "",
    specialRequests: "",
  });
  
  const [isSeedingItinerary, setIsSeedingItinerary] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let parsedGuests: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        parsedGuests = await parseCSVFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedGuests = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file type. Please upload .csv or .xlsx files.');
      }

      parsedGuests = parsedGuests.filter(g => g.name && g.name.trim() !== '');
      
      setImportedGuests(parsedGuests);
      setShowImportPreview(true);
      toast({ title: "File parsed!", description: `Found ${parsedGuests.length} guests` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleImportToDatabase = async () => {
    setUploading(true);
    try {
      for (const guest of importedGuests) {
        await fetch(`/api/events/${id}/guests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: id,
            name: guest.name,
            email: guest.email,
            phone: guest.phone ? String(guest.phone) : undefined,
            category: guest.category,
            dietaryRestrictions: guest.dietaryRestrictions,
            specialRequests: guest.specialRequests,
          }),
        });
      }

      toast({ title: "Import successful!", description: `${importedGuests.length} guests added` });
      setImportedGuests([]);
      setShowImportPreview(false);
      
      // Force refetch and wait for it
      await refetchGuests();
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Label handlers
  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    
    setIsAddingLabel(true);
    try {
      const response = await fetch(`/api/events/${id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, name: newLabelName }),
      });

      if (!response.ok) throw new Error('Failed to create label');
      
      toast({ title: "Label created", description: `${newLabelName} has been added` });
      setNewLabelName("");
      setShowLabelDialog(false);
      window.location.reload(); // Refresh to show new label
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingLabel(false);
    }
  };

  // Perk handlers
  const handleCreatePerk = async () => {
    if (!newPerkData.name.trim()) return;
    
    setIsAddingPerk(true);
    try {
      const response = await fetch(`/api/events/${id}/perks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, ...newPerkData }),
      });

      if (!response.ok) throw new Error('Failed to create perk');
      
      toast({ title: "Perk created", description: `${newPerkData.name} has been added` });
      setNewPerkData({ name: "", description: "", type: "" });
      setShowPerkDialog(false);
      window.location.reload(); // Refresh to show new perk
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsAddingPerk(false);
    }
  };

  const handleDeleteGuest = async (guestId: number, guestName: string) => {
    if (!confirm(`Are you sure you want to remove ${guestName} from the guest list?`)) {
      return;
    }

    try {
      await deleteGuest.mutateAsync({ id: guestId, eventId: id });
      toast({ 
        title: "Guest removed", 
        description: `${guestName} has been removed from the guest list` 
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to remove guest", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleAddGuest = async () => {
    if (!newGuestData.name.trim() || !newGuestData.email.trim()) {
      toast({ 
        title: "Missing required fields", 
        description: "Name and email are required", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsAddingGuest(true);
    try {
      const response = await fetch(`/api/events/${id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          name: newGuestData.name,
          email: newGuestData.email,
          phone: newGuestData.phone || undefined,
          category: newGuestData.category || undefined,
          dietaryRestrictions: newGuestData.dietaryRestrictions || undefined,
          specialRequests: newGuestData.specialRequests || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to add guest');
      
      toast({ 
        title: "Guest added", 
        description: `${newGuestData.name} has been added to the guest list` 
      });
      
      // Reset form
      setNewGuestData({
        name: "",
        email: "",
        phone: "",
        category: "",
        dietaryRestrictions: "",
        specialRequests: "",
      });
      setShowAddGuestDialog(false);
      
      // Refresh guest list
      await refetchGuests();
    } catch (error: any) {
      toast({ 
        title: "Failed to add guest", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleSeedItinerary = async () => {
    setIsSeedingItinerary(true);
    try {
      const response = await fetch(`/api/events/${id}/seed-itinerary`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to seed itinerary');
      
      const result = await response.json();
      
      toast({ 
        title: "Itinerary seeded!", 
        description: `Added ${result.count} sample events with deliberate conflicts for testing`,
        duration: 5000,
      });
    } catch (error: any) {
      toast({ 
        title: "Failed to seed itinerary", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSeedingItinerary(false);
    }
  };

  const handleDownloadReport = () => {
    try {
      generateEventReport({
        event,
        guests: guests || [],
        labels: labels || [],
        perks: perks || [],
        requests: requests || [],
        hotelBookings: hotelBookings || [],
      });
      toast({ 
        title: "Report downloaded!", 
        description: "Your event report has been saved" 
      });
    } catch (error: any) {
      toast({ 
        title: "Download failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleAssignPerksToLabel = async (labelId: number, perkId: number, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/labels/${labelId}/perks/${perkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled, expenseHandledByClient: false }),
      });

      if (!response.ok) throw new Error('Failed to update perk assignment');
      
      toast({ title: "Updated", description: "Perk assignment updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Event Code:</span>
              <code className="text-sm font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-md border border-primary/20">
                {event.eventCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(event.eventCode);
                  toast({ title: "Copied!", description: "Event code copied to clipboard" });
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="text-right hidden md:block mr-4">
              <div className="text-2xl font-serif font-bold text-primary">{guests?.length || 0}</div>
              <div className="text-xs text-muted-foreground uppercase">Guests</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedItinerary}
              disabled={isSeedingItinerary}
              className="gap-2"
            >
              {isSeedingItinerary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  Add Demo Events
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${id}/setup`)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Setup
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/events/${id}/preview`)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview Event
            </Button>
          </div>
        </div>
      </div>

      {/* Capacity Alert */}
      {hotelBookings && hotelBookings.length > 0 && (
        <CapacityAlert 
          totalRooms={hotelBookings.reduce((sum: number, booking: any) => sum + (booking.numberOfRooms || 0), 0)}
          totalGuests={guests?.length || 0}
          className="mb-6"
        />
      )}

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

      {/* Quick Actions */}
      <div className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm mb-1">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Manage your event settings</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${id}/approval`)}
              className="gap-2 relative"
            >
              <CheckSquare className="w-4 h-4" />
              Review & Payment
              {requests?.filter((r: any) => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {requests.filter((r: any) => r.status === 'pending').length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLabelDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Label
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerkDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Perk
            </Button>
          </div>
        </div>
      </div>
      {/* Capacity Alert */}
      {hotelBookings && hotelBookings.length > 0 && (
        <CapacityAlert 
          totalRooms={hotelBookings.reduce((sum: number, booking: any) => sum + (booking.numberOfRooms || 0), 0)}
          totalGuests={guests?.length || 0}
          className="mb-6"
        />
      )}
      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="bg-white border border-border/50 p-1 mb-6 rounded-xl">
          <TabsTrigger value="guests" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Guests</TabsTrigger>
          <TabsTrigger value="labels" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Labels & Permissions</TabsTrigger>
          <TabsTrigger value="perks" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Perks & Add-ons</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-4">
          {/* Import Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={generateGuestListTemplate} variant="outline" className="w-full">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} />
                {uploading && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Processing...</div>}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showImportPreview && importedGuests.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-base">Preview ({importedGuests.length} guests)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedGuests.map((g, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{g.name}</td>
                          <td className="p-2 text-muted-foreground">{g.email}</td>
                          <td className="p-2"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{g.category || 'General'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setImportedGuests([]); setShowImportPreview(false); }}>Cancel</Button>
                  <Button size="sm" onClick={handleImportToDatabase} disabled={uploading}>
                    {uploading ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Importing...</> : `Import ${importedGuests.length}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <h3 className="font-medium">Guest List ({guests?.length || 0})</h3>
              <Button size="sm" onClick={() => setShowAddGuestDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
            </div>
            <div className="divide-y divide-border/50">
              {guests?.map(guest => (
                <div key={guest.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-primary">{guest.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {guest.email && <span>{guest.email}</span>}
                      {guest.phone && <span> • {guest.phone}</span>}
                    </div>
                    {guest.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{guest.category}</span>
                    )}
                    {guest.status && (
                      <span className={`inline-block mt-1 ml-2 px-2 py-0.5 rounded text-xs ${
                        guest.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        guest.status === 'declined' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {guest.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <GuestLinkManager guest={guest} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGuest(guest.id, guest.name)}
                      disabled={deleteGuest.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {guests?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No guests yet. Upload an Excel file to import.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Add Guest Dialog */}
          <Dialog open={showAddGuestDialog} onOpenChange={setShowAddGuestDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Guest</DialogTitle>
                <DialogDescription>
                  Manually add a single guest to the event
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestName"
                    placeholder="Full name"
                    value={newGuestData.name}
                    onChange={(e) => setNewGuestData({ ...newGuestData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={newGuestData.email}
                    onChange={(e) => setNewGuestData({ ...newGuestData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input
                    id="guestPhone"
                    placeholder="Phone number"
                    value={newGuestData.phone}
                    onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestCategory">Category</Label>
                  <Input
                    id="guestCategory"
                    placeholder="e.g., VIP, General, Family"
                    value={newGuestData.category}
                    onChange={(e) => setNewGuestData({ ...newGuestData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestDietary">Dietary Restrictions</Label>
                  <Input
                    id="guestDietary"
                    placeholder="e.g., Vegetarian, Gluten-free"
                    value={newGuestData.dietaryRestrictions}
                    onChange={(e) => setNewGuestData({ ...newGuestData, dietaryRestrictions: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestRequests">Special Requests</Label>
                  <Input
                    id="guestRequests"
                    placeholder="Any special accommodations"
                    value={newGuestData.specialRequests}
                    onChange={(e) => setNewGuestData({ ...newGuestData, specialRequests: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddGuestDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddGuest} 
                  disabled={isAddingGuest || !newGuestData.name.trim() || !newGuestData.email.trim()}
                >
                  {isAddingGuest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Guest"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="labels" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-sans font-medium">Guest Labels & Permissions</h3>
              <p className="text-sm text-muted-foreground">Create categories and assign perks to each label</p>
            </div>
            <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Label
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Label</DialogTitle>
                  <DialogDescription>
                    Create a category for your guests (e.g., VIP, Staff, Friend, Family)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="labelName">Label Name</Label>
                    <Input
                      id="labelName"
                      placeholder="e.g., VIP Guest"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowLabelDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLabel} disabled={isAddingLabel || !newLabelName.trim()}>
                    {isAddingLabel ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Label"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {labels?.map(label => (
              <Card key={label.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{label.name}</CardTitle>
                      <CardDescription>
                        Control which perks this category can access
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLabel(label);
                        setShowAssignPerksDialog(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Assign Perks
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {labels?.length === 0 && (
              <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
                <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Labels Yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Create labels to categorize your guests and control their access to perks.
                </p>
              </div>
            )}
          </div>

          {/* Assign Perks Dialog */}
          <Dialog open={showAssignPerksDialog} onOpenChange={setShowAssignPerksDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Perks to {selectedLabel?.name}</DialogTitle>
                <DialogDescription>
                  Select which perks guests with this label can see and request
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-y-auto py-4">
                {perks?.map(perk => (
                  <div key={perk.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{perk.name}</div>
                      <div className="text-sm text-muted-foreground">{perk.description}</div>
                      {perk.type && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                          {perk.type}
                        </span>
                      )}
                    </div>
                    <Checkbox
                      onCheckedChange={(checked) => handleAssignPerksToLabel(selectedLabel?.id, perk.id, !!checked)}
                    />
                  </div>
                ))}
                {perks?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No perks available. Create perks first in the Perks & Add-ons tab.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="perks" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium">Perks & Add-ons</h3>
              <p className="text-sm text-muted-foreground">Define services guests can request</p>
            </div>
            <Dialog open={showPerkDialog} onOpenChange={setShowPerkDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Perk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Perk</DialogTitle>
                  <DialogDescription>
                    Add a service or amenity that guests can request
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="perkName">Perk Name</Label>
                    <Input
                      id="perkName"
                      placeholder="e.g., Airport Pickup"
                      value={newPerkData.name}
                      onChange={(e) => setNewPerkData({ ...newPerkData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="perkDescription">Description</Label>
                    <Input
                      id="perkDescription"
                      placeholder="e.g., Complimentary airport transfer service"
                      value={newPerkData.description}
                      onChange={(e) => setNewPerkData({ ...newPerkData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="perkType">Type</Label>
                    <Input
                      id="perkType"
                      placeholder="e.g., transport, accommodation, meal, activity"
                      value={newPerkData.type}
                      onChange={(e) => setNewPerkData({ ...newPerkData, type: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPerkDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePerk} disabled={isAddingPerk || !newPerkData.name.trim()}>
                    {isAddingPerk ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Perk"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {perks?.map(perk => (
              <Card key={perk.id}>
                <CardHeader>
                  <CardTitle className="text-base">{perk.name}</CardTitle>
                  <CardDescription>{perk.description}</CardDescription>
                </CardHeader>
                {perk.type && (
                  <CardContent>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {perk.type}
                    </span>
                  </CardContent>
                )}
              </Card>
            ))}

            {perks?.length === 0 && (
              <div className="bg-white rounded-2xl border border-border/50 p-8 text-center">
                <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Perks Yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Create perks like Airport Pickup, Spa Treatments, or Room Upgrades for your guests.
                </p>
              </div>
            )}
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
