import { useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Download, Users, FileSpreadsheet, Loader2 } from "lucide-react";
import { parseExcelFile, parseCSVFile, generateGuestListTemplate, type GuestRow } from "@/lib/excelParser";
import { useToast } from "@/hooks/use-toast";

export default function GuestImport() {
  const { id } = useParams();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [guests, setGuests] = useState<GuestRow[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let parsedGuests: GuestRow[] = [];
      
      if (file.name.endsWith('.csv')) {
        parsedGuests = await parseCSVFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedGuests = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file type. Please upload .csv or .xlsx files.');
      }

      // Filter out empty rows
      parsedGuests = parsedGuests.filter(g => g.name && g.name.trim() !== '');
      
      setGuests(parsedGuests);
      toast({
        title: "File parsed successfully!",
        description: `Found ${parsedGuests.length} guests`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImportToDatabase = async () => {
    setUploading(true);
    try {
      // Import each guest to the database
      for (const guest of guests) {
        await fetch(`/api/events/${id}/guests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: parseInt(id!),
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            category: guest.category,
            dietaryRestrictions: guest.dietaryRestrictions,
            specialRequests: guest.specialRequests,
          }),
        });
      }

      toast({
        title: "Import successful!",
        description: `${guests.length} guests added to the event`,
      });
      
      setGuests([]);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Guest List Import</h1>
        <p className="text-muted-foreground">Upload Excel or CSV files to import your guest list</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Get a pre-formatted Excel template for your guest list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateGuestListTemplate}
              variant="outline"
              className="w-full"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Template includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Name (required)</li>
                <li>Email</li>
                <li>Phone</li>
                <li>Category (VIP/Friends/Family)</li>
                <li>Dietary Restrictions</li>
                <li>Special Requests</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Guest List
            </CardTitle>
            <CardDescription>
              Upload Excel (.xlsx) or CSV (.csv) file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            
            {uploading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing file...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {guests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Preview ({guests.length} guests)
            </CardTitle>
            <CardDescription>
              Review the imported guests before adding to database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b sticky top-0 bg-white">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{guest.name}</td>
                      <td className="p-2">{guest.email}</td>
                      <td className="p-2">{guest.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setGuests([])}>
                Cancel
              </Button>
              <Button onClick={handleImportToDatabase} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import {guests.length} Guests</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
