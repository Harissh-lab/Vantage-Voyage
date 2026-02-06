import { useGuestPortal, useJoinWaitlist } from "@/hooks/use-guest-portal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, CheckCircle, Hotel, Crown, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface WaitlistBellProps {
  token: string;
  className?: string;
}

export function WaitlistBell({ token, className = "" }: WaitlistBellProps) {
  const { data: guestData } = useGuestPortal(token);
  const joinWaitlist = useJoinWaitlist(token);

  if (!guestData) return null;

  const isOnWaitlist = guestData.isOnWaitlist;
  const priority = guestData.waitlistPriority || 0;
  
  // Determine tier name based on priority
  const getTierInfo = () => {
    if (guestData.label?.name?.toLowerCase().includes('vip')) {
      return { name: 'VIP', icon: Crown, color: 'text-amber-500', priority: 1 };
    } else if (guestData.label?.name?.toLowerCase().includes('family')) {
      return { name: 'Family', icon: Users, color: 'text-blue-500', priority: 2 };
    } else {
      return { name: 'Guest', icon: Users, color: 'text-gray-500', priority: 3 };
    }
  };

  const tierInfo = getTierInfo();

  const handleJoinWaitlist = async () => {
    try {
      const result = await joinWaitlist.mutateAsync();
      toast({
        title: "Joined Waitlist!",
        description: `You're #${result.position} in line. We'll notify you if a room opens up.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join waitlist",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`border-amber-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-primary" />
            Room Availability
          </CardTitle>
          <Badge variant="outline" className={`${tierInfo.color} border-current`}>
            <tierInfo.icon className="w-3 h-3 mr-1" />
            {tierInfo.name} Tier
          </Badge>
        </div>
        <CardDescription>
          Primary hotel room allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {isOnWaitlist ? (
            <motion.div
              key="on-waitlist"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-6"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  transition: { 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut" 
                  }
                }}
                className="inline-block mb-4"
              >
                <BellRing className="w-16 h-16 text-amber-500" />
              </motion.div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-lg">On Waitlist</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll be automatically notified if a room becomes available
                </p>
                <div className="pt-3">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Priority Level: {tierInfo.name}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="join-waitlist"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-block p-4 bg-amber-50 rounded-full mb-2">
                <Bell className="w-12 h-12 text-amber-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Primary Hotel Full</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The primary hotel is currently at capacity. Join the waitlist to be automatically upgraded if a room opens up.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left space-y-2">
                <p className="font-medium text-blue-900">How it works:</p>
                <ul className="space-y-1 text-blue-800 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Priority is based on your tier ({tierInfo.name})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>You'll receive instant notification if a room opens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Automatic swap — no action needed from you</span>
                  </li>
                </ul>
              </div>

              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleJoinWaitlist}
                disabled={joinWaitlist.isPending}
              >
                <Bell className="w-4 h-4 mr-2" />
                {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
