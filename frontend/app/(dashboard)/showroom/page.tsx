import React from "react";
import Link from "next/link";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Car, AlertCircle, RefreshCw } from "lucide-react";
import { vehicleService } from "@/lib/api";
import type { VehicleSummary } from "@csm/contracts";

type FetchResult =
  | { success: true; data: VehicleSummary[] }
  | { success: false; error: string };

async function getShowroomVehicles(): Promise<FetchResult> {
  try {
    const data = await vehicleService.list({ status: "IN_STOCK" });
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load showroom vehicles.",
    };
  }
}

export default async function ShowroomPage() {
  const result = await getShowroomVehicles();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Showroom Store List</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Explore available vehicles in stock across all branches.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load showroom</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3">
            <p>{result.error}</p>
            <Link href="/showroom">
              <Button variant="outline" size="sm" className="gap-2 w-fit">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const vehicles = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Showroom Store List</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Explore available vehicles in stock across all branches.
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          Total in stock: <span className="text-foreground font-bold">{vehicles.length} Units</span>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Car className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No vehicles in showroom</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
            There are currently no vehicles in stock. Purchase a new vehicle to display it in the showroom.
          </p>
          <Link href="/inventory/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Purchase Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}

