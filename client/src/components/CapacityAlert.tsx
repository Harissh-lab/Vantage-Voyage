import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Hotel, Users } from "lucide-react";
import { motion } from "framer-motion";

interface CapacityAlertProps {
  totalRooms: number;
  totalGuests: number;
  className?: string;
}

export function CapacityAlert({ totalRooms, totalGuests, className = "" }: CapacityAlertProps) {
  const roomsRemaining = totalRooms - totalGuests;
  const utilizationRate = totalGuests / totalRooms;
  
  // Show alert when:
  // 1. Rooms remaining <= 5 (critical)
  // 2. Utilization rate >= 80% (warning)
  // 3. Over capacity (danger)
  
  const isOverCapacity = totalGuests > totalRooms;
  const isCritical = roomsRemaining <= 5 && roomsRemaining > 0;
  const isWarning = utilizationRate >= 0.8 && !isCritical && !isOverCapacity;
  
  if (!isOverCapacity && !isCritical && !isWarning) {
    return null;
  }
  
  const getAlertConfig = () => {
    if (isOverCapacity) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        title: "OVER CAPACITY",
        message: `${totalGuests - totalRooms} guests exceed room availability`,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    }
    
    if (isCritical) {
      return {
        variant: "destructive" as const,
        icon: Bell,
        title: `ONLY ${roomsRemaining} ROOMS LEFT`,
        message: "Room capacity is critically low",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      };
    }
    
    return {
      variant: "default" as const,
      icon: Bell,
      title: "CAPACITY WARNING",
      message: `${Math.round(utilizationRate * 100)}% of rooms allocated`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    };
  };
  
  const config = getAlertConfig();
  const IconComponent = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Alert variant={config.variant} className={`${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              transition: { 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut" 
              }
            }}
            className="mt-0.5"
          >
            <IconComponent className={`h-5 w-5 ${config.color}`} />
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={isOverCapacity ? "destructive" : "outline"}
                className={`font-bold ${config.color} border-current`}
              >
                {config.title}
              </Badge>
            </div>
            
            <AlertDescription className={`${config.color} font-medium`}>
              {config.message}
            </AlertDescription>
            
            <div className="mt-3 flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Hotel className={`w-4 h-4 ${config.color}`} />
                <span className={config.color}>
                  <strong>{totalRooms}</strong> rooms booked
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className={`w-4 h-4 ${config.color}`} />
                <span className={config.color}>
                  <strong>{totalGuests}</strong> guests
                </span>
              </div>
              {!isOverCapacity && (
                <div className={`flex items-center gap-1.5 ${config.color}`}>
                  <Bell className="w-4 h-4" />
                  <span>
                    <strong>{roomsRemaining}</strong> rooms available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Alert>
    </motion.div>
  );
}
