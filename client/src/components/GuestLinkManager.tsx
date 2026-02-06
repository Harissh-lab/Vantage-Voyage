import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Copy, 
  Check, 
  Link as LinkIcon, 
  Mail, 
  ExternalLink,
  QrCode
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface GuestLinkManagerProps {
  guest: {
    id: number;
    name: string;
    email: string;
    bookingRef: string;
    accessToken: string;
    status?: string;
  };
}

export function GuestLinkManager({ guest }: GuestLinkManagerProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);

  // Generate the guest portal link
  const guestLink = `${window.location.origin}/guest/${guest.accessToken}`;

  const copyToClipboard = async (text: string, type: 'link' | 'ref') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast({
          title: "Link Copied!",
          description: "Guest portal link copied to clipboard",
        });
      } else {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
        toast({
          title: "Reference Copied!",
          description: "Booking reference copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(guestLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
      setShowQR(true);
    } catch (error) {
      toast({
        title: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`Your Event Invitation`);
    const body = encodeURIComponent(
      `Hi ${guest.name},\n\n` +
      `You're invited! Access your personalized event portal here:\n\n` +
      `${guestLink}\n\n` +
      `Your booking reference: ${guest.bookingRef}\n\n` +
      `We look forward to seeing you!`
    );
    window.open(`mailto:${guest.email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Booking Reference Badge */}
      <Badge 
        variant="outline" 
        className="font-mono text-xs cursor-pointer hover:bg-muted transition-colors"
        onClick={() => copyToClipboard(guest.bookingRef, 'ref')}
      >
        {copiedRef ? (
          <><Check className="w-3 h-3 mr-1" />{guest.bookingRef}</>
        ) : (
          <><Copy className="w-3 h-3 mr-1" />{guest.bookingRef}</>
        )}
      </Badge>

      {/* View/Copy Link Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            Link
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Guest Portal Link
            </DialogTitle>
            <DialogDescription>
              Share this secure link with {guest.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Guest Info */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Guest Name:</span>
                <span className="font-medium">{guest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium">{guest.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={guest.status === 'confirmed' ? 'default' : 'secondary'}>
                  {guest.status || 'pending'}
                </Badge>
              </div>
            </div>

            {/* Booking Reference */}
            <div>
              <Label htmlFor="bookingRef" className="text-sm font-medium mb-2 block">
                Booking Reference
              </Label>
              <div className="flex gap-2">
                <Input
                  id="bookingRef"
                  value={guest.bookingRef}
                  readOnly
                  className="font-mono bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(guest.bookingRef, 'ref')}
                >
                  {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This is what the guest searches for to access their portal
              </p>
            </div>

            {/* Portal Link */}
            <div>
              <Label htmlFor="guestLink" className="text-sm font-medium mb-2 block">
                Guest Portal Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="guestLink"
                  value={guestLink}
                  readOnly
                  className="font-mono text-sm bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(guestLink, 'link')}
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Direct link - no password needed, secured by unique token
              </p>
            </div>

            {/* QR Code Section */}
            {showQR && qrCodeUrl && (
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Scan to access guest portal
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(guestLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Test Link
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={generateQRCode}
              >
                <QrCode className="w-4 h-4" />
                {showQR ? 'Hide QR' : 'Show QR Code'}
              </Button>
              <Button
                className="gap-2 col-span-2 bg-primary"
                onClick={sendEmail}
              >
                <Mail className="w-4 h-4" />
                Send via Email
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to Share</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Email:</strong> Click "Send via Email" to pre-fill an invitation</li>
                <li>• <strong>Manual:</strong> Copy the link and send via SMS, WhatsApp, etc.</li>
                <li>• <strong>QR Code:</strong> Share QR code for easy mobile access</li>
                <li>• <strong>Reference:</strong> Guest can search using booking reference</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
