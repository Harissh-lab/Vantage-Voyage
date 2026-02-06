import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Step 1: Client Details
const clientDetailsSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  hasVipGuests: z.boolean().default(false),
  hasFriends: z.boolean().default(false),
  hasFamily: z.boolean().default(false),
});

// Step 2: Hotel Booking
const hotelBookingSchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  numberOfRooms: z.number().min(1, "At least 1 room is required"),
});

// Step 3: Travel Options
const travelOptionsSchema = z.object({
  hasFlight: z.boolean().default(false),
  hasTrain: z.boolean().default(false),
  departureDate: z.date().optional(),
  returnDate: z.date().optional(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
});

type ClientDetailsFormValues = z.infer<typeof clientDetailsSchema>;
type HotelBookingFormValues = z.infer<typeof hotelBookingSchema>;
type TravelOptionsFormValues = z.infer<typeof travelOptionsSchema>;

export default function EventSetup() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const { toast } = useToast();

  const clientForm = useForm<ClientDetailsFormValues>({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: {
      clientName: "",
      address: "",
      phone: "",
      hasVipGuests: false,
      hasFriends: false,
      hasFamily: false,
    },
  });

  const hotelForm = useForm<HotelBookingFormValues>({
    resolver: zodResolver(hotelBookingSchema),
    defaultValues: {
      hotelName: "",
      numberOfRooms: 1,
      checkInDate: "",
      checkOutDate: "",
    },
  });

  const travelForm = useForm<TravelOptionsFormValues>({
    resolver: zodResolver(travelOptionsSchema),
    defaultValues: {
      hasFlight: false,
      hasTrain: false,
    },
  });

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEventData(data);
      }
    } catch (error) {
      console.error("Failed to fetch event data", error);
    }
  };

  const onClientDetailsSubmit = async (data: ClientDetailsFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${id}/client-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save client details");
      }
      
      toast({
        title: "Success",
        description: "Client details saved successfully"
      });
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error saving client details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save client details",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onHotelBookingSubmit = async (data: HotelBookingFormValues) => {
    setIsSubmitting(true);
    try {
      // Validate dates
      const checkInDate = data.checkInDate ? new Date(data.checkInDate) : null;
      const checkOutDate = data.checkOutDate ? new Date(data.checkOutDate) : null;

      if (!checkInDate || isNaN(checkInDate.getTime())) {
        throw new Error("Invalid check-in date");
      }
      if (!checkOutDate || isNaN(checkOutDate.getTime())) {
        throw new Error("Invalid check-out date");
      }

      const payload = {
        hotelName: data.hotelName,
        numberOfRooms: data.numberOfRooms,
        eventId: Number(id),
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
      };

      const response = await fetch(`/api/events/${id}/hotel-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save hotel booking");
      }
      
      toast({
        title: "Success",
        description: "Hotel booking saved successfully"
      });
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Error saving hotel booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save hotel booking",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onTravelOptionsSubmit = async (data: TravelOptionsFormValues) => {
    setIsSubmitting(true);
    try {
      const travelModes = [];
      if (data.hasFlight) travelModes.push("flight");
      if (data.hasTrain) travelModes.push("train");

      // Only submit if at least one travel mode is selected
      if (travelModes.length === 0) {
        toast({
          title: "No travel mode selected",
          description: "Please select at least one travel option or skip this step",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      for (const mode of travelModes) {
        const payload: any = {
          eventId: Number(id),
          travelMode: mode,
        };

        // Only include dates and locations if they are provided
        if (data.departureDate) {
          payload.departureDate = data.departureDate instanceof Date ? data.departureDate.toISOString() : data.departureDate;
        }
        if (data.returnDate) {
          payload.returnDate = data.returnDate instanceof Date ? data.returnDate.toISOString() : data.returnDate;
        }
        if (data.fromLocation && data.fromLocation.trim()) {
          payload.fromLocation = data.fromLocation;
        }
        if (data.toLocation && data.toLocation.trim()) {
          payload.toLocation = data.toLocation;
        }

        const response = await fetch(`/api/events/${id}/travel-options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to save ${mode} options`);
        }
      }

      toast({
        title: "Success",
        description: "Travel options saved successfully"
      });
      
      // Navigate to preview page
      navigate(`/events/${id}/preview`);
    } catch (error: any) {
      console.error("Error saving travel options:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save travel options",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 space-x-2">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= step
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {currentStep > step ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 ${
                currentStep > step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-serif text-primary mb-2">
            Event Setup: {eventData?.name}
          </h1>
          <p className="text-muted-foreground">
            Complete the client details, hotel, and travel information
          </p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Client Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Client Details</CardTitle>
              <CardDescription>
                Enter the client's contact information and guest categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(onClientDetailsSubmit)} className="space-y-6">
                  <FormField
                    control={clientForm.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Guest Categories</FormLabel>
                    <FormField
                      control={clientForm.control}
                      name="hasVipGuests"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            VIP Guests
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="hasFriends"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Friends
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="hasFamily"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Family
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Next: Hotel Booking <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Hotel Booking */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Hotel Booking</CardTitle>
              <CardDescription>
                Provide hotel details and room requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...hotelForm}>
                <form onSubmit={hotelForm.handleSubmit(onHotelBookingSubmit)} className="space-y-6">
                  <FormField
                    control={hotelForm.control}
                    name="hotelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hotel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Grand Hotel Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={hotelForm.control}
                      name="checkInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-in Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={hotelForm.control}
                      name="checkOutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-out Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={hotelForm.control}
                    name="numberOfRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Rooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Next: Travel Options <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Travel Options */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Travel Options</CardTitle>
              <CardDescription>
                Select travel modes and provide journey details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...travelForm}>
                <form onSubmit={travelForm.handleSubmit(onTravelOptionsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormLabel>Travel Modes</FormLabel>
                    <FormField
                      control={travelForm.control}
                      name="hasFlight"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Flight
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={travelForm.control}
                      name="hasTrain"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Train
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {(travelForm.watch("hasFlight") || travelForm.watch("hasTrain")) && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={travelForm.control}
                          name="fromLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>From Location</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={travelForm.control}
                          name="toLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>To Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Paris" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={travelForm.control}
                          name="departureDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Departure Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value instanceof Date && !isNaN(field.value.getTime())
                                    ? field.value.toISOString().split('T')[0]
                                    : ""}
                                  onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                    field.onChange(date);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={travelForm.control}
                          name="returnDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Return Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value instanceof Date && !isNaN(field.value.getTime())
                                    ? field.value.toISOString().split('T')[0]
                                    : ""}
                                  onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : undefined;
                                    field.onChange(date);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate(`/events/${id}/preview`)}
                      >
                        Skip & Preview
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Complete Setup"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
