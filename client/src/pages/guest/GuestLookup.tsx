import { useState } from "react";
import { useLocation } from "wouter";
import { useGuestLookup } from "@/hooks/use-guests";
import { GuestLayout } from "@/components/GuestLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestLookup() {
  const [refInput, setRefInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();
  
  // We use this hook just to validate, but we manually trigger transition
  const { data: guest, error, isLoading } = useGuestLookup(isSearching ? refInput : "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (refInput.length > 2) {
      setIsSearching(true);
    }
  };

  // Redirect on success
  if (guest) {
    setLocation(`/guest/travel?ref=${guest.bookingRef}`);
  }

  return (
    <GuestLayout step={1}>
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-border/50 text-center max-w-lg mx-auto">
        <h2 className="text-3xl font-serif text-primary mb-4">Welcome</h2>
        <p className="text-muted-foreground mb-8">
          Please enter your unique booking reference code found in your invitation email to access your itinerary and concierge.
        </p>

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="e.g. BOOK-1234" 
              className="pl-12 h-14 text-lg bg-muted/20 border-border/60 focus:bg-white transition-all text-center uppercase tracking-widest font-mono"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value.toUpperCase())}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg"
              >
                Booking reference not found. Please try again.
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg rounded-xl btn-primary"
            disabled={isLoading || refInput.length < 3}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Find Invitation"}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Having trouble? <a href="#" className="text-primary underline">Contact Support</a>
          </p>
        </div>
      </div>
    </GuestLayout>
  );
}
