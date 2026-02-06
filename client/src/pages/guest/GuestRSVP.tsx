import { useState } from "react";
import { useGuestPortal, useUpdateRSVP } from "@/hooks/use-guest-portal";
import { GuestLayout } from "@/components/GuestLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Plus, X, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
}

export default function GuestRSVP({ token }: { token: string }) {
  const { data: guestData, isLoading } = useGuestPortal(token);
  const updateRSVP = useUpdateRSVP(token);
  
  const [status, setStatus] = useState<'confirmed' | 'declined' | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: "", relationship: "", age: undefined });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!guestData) {
    return <div className="p-10 text-center">Invalid access link</div>;
  }

  const maxSeats = guestData.allocatedSeats;
  const currentSeats = 1 + familyMembers.length;
  const canAddMore = currentSeats < maxSeats;

  const handleAddMember = () => {
    if (newMember.name && newMember.relationship && canAddMore) {
      setFamilyMembers([...familyMembers, newMember]);
      setNewMember({ name: "", relationship: "", age: undefined });
    }
  };

  const handleRemoveMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleSubmitRSVP = async () => {
    if (!status) {
      toast({
        title: "Please select your response",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateRSVP.mutateAsync({
        status,
        confirmedSeats: status === 'confirmed' ? currentSeats : 0,
        familyMembers: status === 'confirmed' ? familyMembers : undefined
      });
      
      toast({
        title: status === 'confirmed' ? "RSVP Confirmed!" : "Response Recorded",
        description: status === 'confirmed' 
          ? `${currentSeats} seat(s) confirmed for ${guestData.event.name}`
          : "We're sorry you can't make it. Your response has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit RSVP. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <GuestLayout step={1} bookingRef={guestData.bookingRef}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            {guestData.label?.name || "Guest"}
          </Badge>
          <h1 className="text-4xl font-serif text-primary mb-3">You're Invited!</h1>
          <p className="text-xl text-muted-foreground">{guestData.event.name}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date(guestData.event.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Seat Allocation Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Your Allocation
            </CardTitle>
            <CardDescription>
              Reserved for <strong>{guestData.name}</strong> + {maxSeats - 1} guest(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
              <div>
                <div className="text-2xl font-bold text-primary">{maxSeats}</div>
                <div className="text-sm text-muted-foreground">Allocated Seats</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{currentSeats}</div>
                <div className="text-sm text-muted-foreground">Selected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Status Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Will you attend?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button
              variant={status === 'confirmed' ? "default" : "outline"}
              size="lg"
              className={`h-auto py-6 ${status === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => setStatus('confirmed')}
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-lg font-semibold">Yes, I'll be there!</span>
              </div>
            </Button>
            <Button
              variant={status === 'declined' ? "default" : "outline"}
              size="lg"
              className={`h-auto py-6 ${status === 'declined' ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
              onClick={() => setStatus('declined')}
            >
              <div className="flex flex-col items-center gap-2">
                <XCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Can't make it</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Family Members Section - Only show if confirmed */}
        <AnimatePresence>
          {status === 'confirmed' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Who's coming with you?</CardTitle>
                  <CardDescription>
                    You can add up to {maxSeats - 1} additional guest(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary Guest */}
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{guestData.name}</div>
                      <div className="text-sm text-muted-foreground">Primary Guest</div>
                    </div>
                    <Badge variant="secondary">You</Badge>
                  </div>

                  {/* Additional Family Members */}
                  {familyMembers.map((member, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.relationship}
                          {member.age && `, ${member.age} years old`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  {/* Add Member Form */}
                  {canAddMore && (
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="memberName">Name</Label>
                          <Input
                            id="memberName"
                            placeholder="Full name"
                            value={newMember.name}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="relationship">Relationship</Label>
                          <Input
                            id="relationship"
                            placeholder="e.g., Spouse, Child"
                            value={newMember.relationship}
                            onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label htmlFor="age">Age (Optional)</Label>
                          <Input
                            id="age"
                            type="number"
                            placeholder="Age"
                            value={newMember.age || ""}
                            onChange={(e) => setNewMember({ 
                              ...newMember, 
                              age: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={handleAddMember}
                            disabled={!newMember.name || !newMember.relationship}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Guest
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!canAddMore && familyMembers.length > 0 && (
                    <div className="text-sm text-muted-foreground text-center p-2 bg-muted/30 rounded-lg">
                      You've reached your maximum allocation of {maxSeats} seats
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="px-12 h-14 text-lg btn-primary"
            disabled={!status || updateRSVP.isPending}
            onClick={handleSubmitRSVP}
          >
            {updateRSVP.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>Submit RSVP</>
            )}
          </Button>
        </div>
      </div>
    </GuestLayout>
  );
}
