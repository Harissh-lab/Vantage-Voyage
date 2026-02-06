import { useState } from "react";
import { useLocation } from "wouter";
import { useGuestPortal } from "@/hooks/use-guest-portal";
import { GuestLayout } from "@/components/GuestLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar as CalendarIcon, Hotel, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestRoomUpgrade({ token }: { token: string }) {
  const { data: guestData, isLoading } = useGuestPortal(token);
  const [, navigate] = useLocation();
  
  const [step, setStep] = useState(1); // 1 = select dates, 2 = confirm & submit
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!guestData) {
    return <div className="p-10 text-center">Invalid access link</div>;
  }

  const numberOfNights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;

  const handleContinue = () => {
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Dates Required",
        description: "Please select both check-in and check-out dates",
        variant: "destructive"
      });
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast({
        title: "Invalid Dates",
        description: "Check-out must be after check-in",
        variant: "destructive"
      });
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const requestData = {
        type: "room_upgrade",
        notes: JSON.stringify({
          checkInDate: checkInDate?.toISOString(),
          checkOutDate: checkOutDate?.toISOString(),
          numberOfNights,
          additionalNotes: notes
        })
      };

      const response = await fetch(`/api/guest/${token}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      toast({
        title: "Request Submitted!",
        description: "Your room upgrade request has been sent to the event team.",
      });

      // Navigate back to dashboard after a moment
      setTimeout(() => {
        navigate(`/guest/${token}`);
      }, 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit room request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GuestLayout bookingRef={guestData.bookingRef} step={2}>
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent-foreground">Room Upgrade Request</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">
            Request a Room Upgrade
          </h1>
          <p className="text-muted-foreground">
            {step === 1 
              ? "Select your desired check-in and check-out dates"
              : "Review and confirm your request"
            }
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              1
            </div>
            <span className="text-sm font-medium">Select Dates</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              2
            </div>
            <span className="text-sm font-medium">Confirm</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Select Your Stay Dates
                  </CardTitle>
                  <CardDescription>
                    Choose when you'd like to check in and check out
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Check-In Date</Label>
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Check-Out Date</Label>
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => {
                          return checkInDate ? date <= checkInDate : date < new Date();
                        }}
                        className="rounded-md border"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  {checkInDate && checkOutDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-accent/10 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Check-In:</span>
                        <span className="font-medium">{format(checkInDate, "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Check-Out:</span>
                        <span className="font-medium">{format(checkOutDate, "MMM d, yyyy")}</span>
                      </div>
                      <div className="border-t border-accent/20 pt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">Total Nights:</span>
                        <span className="font-semibold text-lg text-primary">{numberOfNights}</span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleContinue}
                  className="px-12"
                >
                  Continue to Review
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-primary" />
                    Review Your Request
                  </CardTitle>
                  <CardDescription>
                    Confirm your room upgrade details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Request Summary */}
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Guest Name</p>
                        <p className="font-medium">{guestData.name}</p>
                      </div>
                      <Badge variant="secondary">
                        <Hotel className="w-3 h-3 mr-1" />
                        Room Upgrade
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Check-In</p>
                        <p className="font-medium">{checkInDate && format(checkInDate, "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Check-Out</p>
                        <p className="font-medium">{checkOutDate && format(checkOutDate, "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Nights</p>
                        <p className="font-medium text-primary">{numberOfNights} {numberOfNights === 1 ? 'night' : 'nights'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special preferences or requirements..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">What happens next?</p>
                        <p className="text-blue-800">
                          Your request will be reviewed by the event team. You'll be notified via email once your room upgrade is confirmed or if additional information is needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back to Dates
                </Button>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 w-4 h-4" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GuestLayout>
  );
}
