"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ScanLine, AlertCircle } from "lucide-react";

interface VinScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (vin: string) => void;
}

export function VinScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: VinScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera access not available or denied:", err);
      setHasCamera(false);
      setErrorMsg("Camera access not available or permission denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Factory VIN Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at the 17-digit VIN barcode on the driver door sticker, windshield, or factory shipping documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View Area */}
          <div className="relative aspect-video w-full rounded-lg bg-muted overflow-hidden flex items-center justify-center border border-border">
            {hasCamera ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-primary/80 m-6 rounded-md pointer-events-none flex items-center justify-center">
                  <ScanLine className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <p>{errorMsg || "Camera stream unavailable in this environment."}</p>
                <p className="text-foreground">
                  Please enter the 17-digit VIN directly in the form field.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
