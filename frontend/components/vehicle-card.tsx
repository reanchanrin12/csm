import React from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, BatteryCharging, MapPin } from "lucide-react";
import type { VehicleSummary } from "@csm/contracts";

interface VehicleCardProps {
  vehicle: VehicleSummary;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const formattedPrice = vehicle.inSalePrice
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(vehicle.inSalePrice)
    : "Price on request";

  return (
    <Card className="overflow-hidden border border-border/80 shadow-sm hover:shadow-md transition-shadow">
      {/* Vehicle Image Cover */}
      <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden">
        {vehicle.coverImageUrl ? (
          <img
            src={vehicle.coverImageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm font-medium bg-muted/60">
            No Photo Available
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="default" className="bg-primary/90 backdrop-blur-sm">
            <MapPin className="mr-1 h-3 w-3" />
            {vehicle.branchName}
          </Badge>
        </div>
        {vehicle.batteryCapacity && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              <BatteryCharging className="mr-1 h-3 w-3 text-emerald-600" />
              {vehicle.batteryCapacity}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg leading-tight tracking-tight">
              {vehicle.brand} : {vehicle.model}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              VIN: <span className="font-mono">{vehicle.vin}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {formattedPrice}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-3 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between border-t border-border/40 pt-2">
          <span>Exterior Color:</span>
          <span className="font-medium text-foreground">{vehicle.exteriorColor}</span>
        </div>
        <div className="flex justify-between">
          <span>Made Year:</span>
          <span className="font-medium text-foreground">{vehicle.madeYear}</span>
        </div>
        <div className="flex justify-between">
          <span>Fuel Type:</span>
          <span className="font-medium text-foreground">{vehicle.fuelType}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/sales/new?vehicleId=${vehicle.id}`} className="w-full">
          <Button className="w-full font-medium" variant="default">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sale Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
