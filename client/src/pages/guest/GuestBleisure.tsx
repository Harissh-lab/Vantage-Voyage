import { useState } from "react";
import { useLocation } from "wouter";
import { useGuestPortal, useUpdateBleisure } from "@/hooks/use-guest-portal";
import { GuestLayout } from "@/components/GuestLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Calendar as CalendarIcon, DollarSign, Gift, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, addDays, subDays } from "date-fns";
import { motion } from "framer-motion";

export default function GuestBleisure({ token }: { token: string }) {
  const { data: guestData, isLoading } = useGuestPortal(token);
  const updateBleisure = useUpdateBleisure(token);
  const [, navigate] = useLocation();
  
  const [extendedCheckIn, setExtendedCheckIn] = useState<Date | undefined>();
  const [extendedCheckOut, setExtendedCheckOut] = useState<Date | undefined>();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!guestData) {
    return <div className="p-10 text-center">Invalid access link</div>;
  }

  const hostCheckIn = guestData.hostCoveredCheckIn ? new Date(guestData.hostCoveredCheckIn) : null;
  const hostCheckOut = guestData.hostCoveredCheckOut ? new Date(guestData.hostCoveredCheckOut) : null;

  const hostCoveredNights = hostCheckIn && hostCheckOut ? differenceInDays(hostCheckOut, hostCheckIn) : 0;
  
  const earlyCheckIn = extendedCheckIn && hostCheckIn && extendedCheckIn < hostCheckIn ? extendedCheckIn : null;
  const lateCheckOut = extendedCheckOut && hostCheckOut && extendedCheckOut > hostCheckOut ? extendedCheckOut : null;
  
  const extraNightsBefore = earlyCheckIn && hostCheckIn ? differenceInDays(hostCheckIn, earlyCheckIn) : 0;
  const extraNightsAfter = lateCheckOut && hostCheckOut ? differenceInDays(lateCheckOut, hostCheckOut) : 0;
  const totalExtraNights = extraNightsBefore + extraNightsAfter;
  
  // Simulated TBO retail rate
  const retailRatePerNight = 250;
  const totalExtraCost = totalExtraNights * retailRatePerNight;

  const handleSubmit = async () => {
    try {
      await updateBleisure.mutateAsync({
        extendedCheckIn: earlyCheckIn || undefined,
        extendedCheckOut: lateCheckOut || undefined
      });
      
      toast({
        title: "Dates Updated!",
        description: totalExtraNights > 0 
          ? `${totalExtraNights} extra night(s) added. Total: $${totalExtraCost}`
          : "Using host-covered dates only",
      });

      // Navigate to next page after successful save
      setTimeout(() => {
        navigate(`/guest/${token}/itinerary`);
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update dates. Please try again.",
        variant: "destructive"
      });
    }
  };

  const modifiers = {
    hostCovered: (date: Date) => {
      if (!hostCheckIn || !hostCheckOut) return false;
      return date >= hostCheckIn && date <= hostCheckOut;
    },
    selfPaid: (date: Date) => {
      const isBeforeHost = earlyCheckIn && hostCheckIn && date >= earlyCheckIn && date < hostCheckIn;
      const isAfterHost = lateCheckOut && hostCheckOut && date > hostCheckOut && date <= lateCheckOut;
      return !!(isBeforeHost || isAfterHost);
    }
  };

  const modifiersStyles = {
    hostCovered: {
      backgroundColor: 'rgb(var(--secondary) / 0.3)',
      color: 'rgb(var(--primary))',
      fontWeight: 'bold',
      border: '2px solid rgb(var(--primary))'
    },
    selfPaid: {
      backgroundColor: 'rgb(var(--accent) / 0.3)',
      color: 'rgb(var(--accent))',
      fontWeight: 'bold',
      border: '2px solid rgb(var(--accent))'
    }
  };

  return (
    <GuestLayout step={2} bookingRef={guestData.bookingRef}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-serif text-primary mb-3">Extend Your Stay</h1>
          <p className="text-lg text-muted-foreground">
            Mix business with pleasure — extend your trip at special retail rates
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Host-Covered Dates */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Gift className="w-5 h-5" />
                Host-Covered Dates
              </CardTitle>
              <CardDescription>
                Your accommodation is fully covered during these dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hostCheckIn && hostCheckOut ? (
                <>
                  <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Check-in</span>
                      <span className="font-medium">{format(hostCheckIn, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Check-out</span>
                      <span className="font-medium">{format(hostCheckOut, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="pt-2 border-t border-primary/20">
                      <div className="flex justify-between font-semibold">
                        <span>{hostCoveredNights} Nights</span>
                        <Badge className="bg-green-600">$0 — Included</Badge>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No host-covered dates set</p>
              )}
            </CardContent>
          </Card>

          {/* Self-Paid Extensions */}
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <DollarSign className="w-5 h-5" />
                Self-Paid Extensions
              </CardTitle>
              <CardDescription>
                Extend your stay at ${retailRatePerNight}/night (TBO Retail)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalExtraNights > 0 ? (
                <div className="bg-accent/10 rounded-lg p-4 space-y-3">
                  {extraNightsBefore > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Early arrival</span>
                      <span className="font-medium">
                        {extraNightsBefore} night(s) × ${retailRatePerNight}
                      </span>
                    </div>
                  )}
                  {extraNightsAfter > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Late departure</span>
                      <span className="font-medium">
                        {extraNightsAfter} night(s) × ${retailRatePerNight}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-accent/20">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Extra Cost</span>
                      <span className="text-accent">${totalExtraCost}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg">
                  Select dates on the calendar to add extra nights
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interactive Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Select Your Dates
            </CardTitle>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded border-2 border-primary bg-secondary/30"></div>
                <span>Host-Covered</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded border-2 border-accent bg-accent/30"></div>
                <span>Self-Paid</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Check-in Calendar */}
              <div>
                <p className="text-sm font-medium mb-2 text-center">Extend Check-In</p>
                <Calendar
                  mode="single"
                  selected={extendedCheckIn}
                  onSelect={setExtendedCheckIn}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  disabled={(date) => {
                    return hostCheckIn ? date >= hostCheckIn : false;
                  }}
                  className="rounded-md border"
                />
              </div>

              {/* Check-out Calendar */}
              <div>
                <p className="text-sm font-medium mb-2 text-center">Extend Check-Out</p>
                <Calendar
                  mode="single"
                  selected={extendedCheckOut}
                  onSelect={setExtendedCheckOut}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  disabled={(date) => {
                    return hostCheckOut ? date <= hostCheckOut : false;
                  }}
                  className="rounded-md border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Submit */}
        <motion.div
          className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Your Complete Stay</h3>
              <p className="text-sm text-muted-foreground">
                {hostCoveredNights + totalExtraNights} total nights
                {totalExtraNights > 0 && (
                  <> — {hostCoveredNights} included + {totalExtraNights} paid</>
                )}
              </p>
            </div>
            <Button
              size="lg"
              className="px-12 h-12 btn-primary"
              onClick={handleSubmit}
              disabled={updateBleisure.isPending}
            >
              {updateBleisure.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Confirm Dates
                  {totalExtraCost > 0 && ` — $${totalExtraCost}`}
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Continue to Next Step */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-4"
        >
          <Button 
            size="lg"
            variant="outline"
            className="px-12"
            onClick={() => navigate(`/guest/${token}/itinerary`)}
          >
            Continue to Event Itinerary
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </GuestLayout>
  );
}
