import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, CreditCard, User, FileText, DollarSign, AlertCircle } from "lucide-react";
import { useRequests, useUpdateRequest } from "@/hooks/use-requests";
import { useEvent } from "@/hooks/use-events";
import { useGuests } from "@/hooks/use-guests";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ApprovalReview() {
  const { id } = useParams();
  const eventId = Number(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: requests, isLoading: requestsLoading } = useRequests(eventId);
  const { data: guests } = useGuests(eventId);
  const updateRequest = useUpdateRequest();
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') || [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') || [];
  
  const totalCost = approvedRequests.length * 50; // Placeholder: $50 per request

  const handleReviewClick = (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewDialog(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;

    try {
      await updateRequest.mutateAsync({
        id: selectedRequest.id,
        status: reviewAction === "approve" ? "approved" : "rejected",
        notes: reviewNotes || undefined,
      });

      toast({
        title: reviewAction === "approve" ? "Request Approved" : "Request Rejected",
        description: `${selectedRequest.guest?.name}'s request has been ${reviewAction}d`,
      });

      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProceedToPayment = () => {
    toast({
      title: "Proceeding to Payment",
      description: "Payment integration coming soon",
    });
    // navigate(`/events/${eventId}/payment`);
  };

  if (eventLoading || requestsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Event not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-border/50 pb-6">
          <h1 className="text-4xl font-serif text-primary mb-2">Request Approval & Review</h1>
          <p className="text-muted-foreground">
            Review and approve guest requests for {event.name} before proceeding to payment
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedRequests.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Est. Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">${totalCost}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Alert */}
        {pendingRequests.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>{pendingRequests.length}</strong> request(s) require your attention before proceeding to payment.
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-primary">Pending Requests</h2>
            <div className="space-y-3">
              {pendingRequests.map((request: any) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-yellow-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{request.guest?.name || 'Unknown Guest'}</CardTitle>
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                              Pending Review
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="capitalize">{request.type?.replace('_', ' ')}</span>
                            {request.createdAt && (
                              <>
                                <span>•</span>
                                <span>{format(new Date(request.createdAt), 'PPP')}</span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleReviewClick(request, "reject")}
                            disabled={updateRequest.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleReviewClick(request, "approve")}
                            disabled={updateRequest.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {request.notes && (
                      <CardContent>
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm text-muted-foreground"><strong>Request Details:</strong></p>
                          <p className="text-sm mt-1">{request.notes}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Requests Section */}
        {approvedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-primary">Approved Requests</h2>
            <div className="space-y-3">
              {approvedRequests.map((request: any) => (
                <Card key={request.id} className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <CardTitle className="text-base">{request.guest?.name || 'Unknown Guest'}</CardTitle>
                          <Badge className="bg-green-600">Approved</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          <span className="capitalize">{request.type?.replace('_', ' ')}</span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-700">+$50</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests Section */}
        {rejectedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-primary">Rejected Requests</h2>
            <div className="space-y-3">
              {rejectedRequests.map((request: any) => (
                <Card key={request.id} className="border-red-200 bg-red-50/50 opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <CardTitle className="text-base">{request.guest?.name || 'Unknown Guest'}</CardTitle>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Requests Message */}
        {requests?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No guest requests submitted yet</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary & Action */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total Amount Due:</span>
              <span className="text-2xl font-bold text-primary">${totalCost}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {approvedRequests.length} approved request(s)</p>
              <p>• {guests?.length || 0} total guests</p>
            </div>
            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/events/${eventId}`)}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={pendingRequests.length > 0}
                className="flex-1 bg-gradient-to-r from-primary to-accent"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </Button>
            </div>
            {pendingRequests.length > 0 && (
              <p className="text-xs text-yellow-700 text-center">
                Review all pending requests before proceeding to payment
              </p>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approve" ? "Approve" : "Reject"} Request
              </DialogTitle>
              <DialogDescription>
                {reviewAction === "approve" 
                  ? "Confirm approval for this guest request"
                  : "Provide a reason for rejection (optional)"
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedRequest && (
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <div><strong>Guest:</strong> {selectedRequest.guest?.name}</div>
                  <div><strong>Type:</strong> {selectedRequest.type?.replace('_', ' ')}</div>
                  {selectedRequest.notes && (
                    <div><strong>Details:</strong> {selectedRequest.notes}</div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {reviewAction === "approve" ? "Approval Notes (Optional)" : "Rejection Reason"}
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === "approve" 
                    ? "Add any notes about this approval..."
                    : "Explain why this request is being rejected..."
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReview}
                disabled={updateRequest.isPending}
                className={reviewAction === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {updateRequest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {reviewAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
