'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Camera, CameraOff, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

export default function QRScanner({ onScan, onError, disabled }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const scannerRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null);
    const containerId = 'qr-reader-container';

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { }
            try { await scannerRef.current.clear(); } catch { }
            scannerRef.current = null;
        }
        setIsScanning(false);
    }, []);

    const startScanner = useCallback(async () => {
        if (disabled) return;
        try {
            setIsStarting(true);
            const { Html5Qrcode } = await import('html5-qrcode');

            // Clean up any existing instance
            await stopScanner();

            const scanner = new Html5Qrcode(containerId);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText: string) => {
                    onScan(decodedText);
                    stopScanner();
                },
                () => { }, // ignore intermediate failures
            );

            setIsScanning(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to start camera. Please allow camera access.';
            onError?.(message);
        } finally {
            setIsStarting(false);
        }
    }, [onScan, onError, stopScanner, disabled]);

    useEffect(() => {
        return () => { stopScanner(); };
    }, [stopScanner]);

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="relative w-72 h-72 bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-800">
                <div id={containerId} className="w-full h-full" />
                {!isScanning && !isStarting && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <QrCode className="h-24 w-24 text-zinc-700" />
                    </div>
                )}
                {isStarting && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                )}
            </div>

            {!isScanning ? (
                <Button
                    size="lg"
                    className="gap-2 px-10 h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200"
                    onClick={startScanner}
                    disabled={isStarting || disabled}
                >
                    {isStarting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    {isStarting ? 'Starting Camera...' : 'Start Scanner'}
                </Button>
            ) : (
                <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 px-10 h-14 text-lg font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                    onClick={stopScanner}
                >
                    <CameraOff className="h-5 w-5" />
                    Stop Scanner
                </Button>
            )}
        </div>
    );
}
