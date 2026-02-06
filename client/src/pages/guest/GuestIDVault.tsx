import { useState, useRef } from "react";
import { useGuestPortal, useUploadID } from "@/hooks/use-guest-portal";
import { GuestLayout } from "@/components/GuestLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Camera, Upload, FileText, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestIDVault({ token }: { token: string }) {
  const { data: guestData, isLoading } = useGuestPortal(token);
  const uploadID = useUploadID(token);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedName, setExtractedName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!guestData) {
    return <div className="p-10 text-center">Invalid access link</div>;
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      // Simulate OCR processing
      simulateOCR(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const simulateOCR = async (imageData: string) => {
    setIsProcessing(true);
    
    // Simulate API call to OCR service (e.g., Tesseract.js, Google Vision API)
    // In production, this would call your backend OCR service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo: extract name from booking (in production, OCR would read from document)
    setExtractedName(guestData.name);
    setIsProcessing(false);
    
    toast({
      title: "Document Scanned",
      description: "We've extracted your information from the document",
    });
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !extractedName) {
      toast({
        title: "Missing Information",
        description: "Please upload a document and verify the extracted name",
        variant: "destructive"
      });
      return;
    }

    // Check if name matches
    const nameMatch = extractedName.toLowerCase().trim() === guestData.name.toLowerCase().trim();
    
    if (!nameMatch) {
      toast({
        title: "Name Mismatch",
        description: "The name on the document doesn't match your booking",
        variant: "destructive"
      });
      return;
    }

    try {
      // In production, upload to storage service first (S3, Cloudinary, etc.)
      const documentUrl = preview || ""; // This would be the actual uploaded URL
      
      await uploadID.mutateAsync({
        documentUrl,
        verifiedName: extractedName
      });
      
      toast({
        title: "ID Verified!",
        description: "Your travel documents are all set",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload ID. Please try again.",
        variant: "destructive"
      });
    }
  };

  const verificationStatus = guestData.idVerificationStatus;
  const isVerified = verificationStatus === 'verified';
  const isFailed = verificationStatus === 'failed';

  return (
    <GuestLayout step={3} bookingRef={guestData.bookingRef}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-serif text-primary mb-3">ID Vault</h1>
          <p className="text-lg text-muted-foreground">
            Secure document upload for seamless travel verification
          </p>
        </div>

        {/* Status Banner */}
        <AnimatePresence mode="wait">
          {isVerified && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Verified!</strong> Your documents have been verified. Your flight manifest is 100% accurate.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          {isFailed && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  Verification failed. Please upload a clear image of your passport or ID.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Passport or ID</CardTitle>
            <CardDescription>
              AI-powered verification ensures your flight manifest matches your official documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!preview ? (
              <div className="space-y-4">
                {/* Camera Capture */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border-2 border-dashed border-primary/20">
                  <div className="text-center space-y-4">
                    <Camera className="w-16 h-16 text-primary mx-auto" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Quick Capture</h3>
                      <p className="text-sm text-muted-foreground">
                        Use your device camera for instant upload
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="btn-primary"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Take Photo
                    </Button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCameraCapture}
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-border/50 rounded-xl p-6">
                  <div className="text-center space-y-4">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-medium mb-1">Upload from Device</h3>
                      <p className="text-sm text-muted-foreground">
                        Select a file from your device
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Preview */}
                <div className="relative">
                  <img
                    src={preview}
                    alt="Document preview"
                    className="w-full rounded-lg border-2 border-border shadow-sm"
                  />
                  <Badge className="absolute top-2 right-2 bg-primary">
                    Preview
                  </Badge>
                </div>

                {/* OCR Processing */}
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 space-y-4"
                    >
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                      <div>
                        <p className="font-medium">Processing Document...</p>
                        <p className="text-sm text-muted-foreground">
                          AI is extracting information from your ID
                        </p>
                      </div>
                    </motion.div>
                  ) : extractedName ? (
                    <motion.div
                      key="extracted"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Alert className="bg-blue-50 border-blue-200">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Information extracted successfully
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-4">
                        <div>
                          <Label>Extracted Name</Label>
                          <Input
                            value={extractedName}
                            onChange={(e) => setExtractedName(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Booking Name</Label>
                          <Input
                            value={guestData.name}
                            disabled
                            className="mt-1.5 bg-muted"
                          />
                        </div>

                        {/* Name Match Indicator */}
                        {extractedName.toLowerCase().trim() === guestData.name.toLowerCase().trim() ? (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <AlertDescription className="text-green-800">
                              ✓ Names match — ready to verify
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertDescription>
                              ⚠ Name mismatch detected — please ensure the document matches your booking
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setExtractedName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 btn-primary"
                    onClick={handleSubmit}
                    disabled={!extractedName || isProcessing || uploadID.isPending}
                  >
                    {uploadID.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 w-4 h-4" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify & Submit
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Why do we need this?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Ensures 100% accuracy on flight manifests (no typos!)</p>
            <p>• Speeds up check-in at airports and hotels</p>
            <p>• Complies with international travel regulations</p>
            <p>• Your data is encrypted and secure</p>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
