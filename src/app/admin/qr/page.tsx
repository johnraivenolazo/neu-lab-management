"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase/provider';
import AuthGuard from '@/components/auth/AuthGuard';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createLabRoom, getAllLabRooms } from '@/lib/firestore-service';
import type { LabRoomRecord } from '@/lib/types';
import QRCode from 'qrcode';

const STATIC_QR_CODES = [
    { name: 'ComLab 1', file: '/qr-codes/qr-comlab-1.png' },
    { name: 'ComLab 2', file: '/qr-codes/qr-comlab-2.png' },
    { name: 'Multimedia Lab', file: '/qr-codes/qr-multimedia-lab.png' },
    { name: 'Network Lab', file: '/qr-codes/qr-network-lab.png' },
    { name: 'Hardware Lab', file: '/qr-codes/qr-hardware-lab.png' },
];

type QRCardItem = {
    id: string;
    name: string;
    value: string;
    file?: string;
    source: 'static' | 'generated';
};

export default function QRDownloadsPage() {
    return (
        <AuthGuard requiredRole="admin">
            <QRDownloadsContent />
        </AuthGuard>
    );
}

function QRDownloadsContent() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [labRooms, setLabRooms] = useState<LabRoomRecord[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [newRoomName, setNewRoomName] = useState('');
    const [creatingRoom, setCreatingRoom] = useState(false);
    const [generatedQrData, setGeneratedQrData] = useState<Record<string, string>>({});

    const currentUser = {
        displayName: user?.displayName || 'Admin',
        email: user?.email || '',
        role: 'admin' as const,
        photoURL: user?.photoURL || undefined,
    };

    const qrCards = useMemo<QRCardItem[]>(() => {
        const staticCards: QRCardItem[] = STATIC_QR_CODES.map((qr) => ({
            id: `static-${qr.name}`,
            name: qr.name,
            value: qr.name,
            file: qr.file,
            source: 'static',
        }));

        const generatedCards: QRCardItem[] = labRooms.map((room) => ({
            id: room.id,
            name: room.name,
            value: room.qrValue,
            source: 'generated',
        }));

        return [...generatedCards, ...staticCards];
    }, [labRooms]);

    useEffect(() => {
        async function loadRooms() {
            if (!firestore) {
                setLoadingRooms(false);
                return;
            }

            try {
                const rooms = await getAllLabRooms(firestore);
                setLabRooms(rooms);
            } catch (err) {
                console.error('Failed to load lab rooms:', err);
                toast({
                    variant: 'destructive',
                    title: 'Load Failed',
                    description: 'Unable to load generated room QR codes.',
                });
            } finally {
                setLoadingRooms(false);
            }
        }

        loadRooms();
    }, [firestore, toast]);

    const ensureGeneratedQr = useCallback(async (item: QRCardItem): Promise<string> => {
        if (item.file) return item.file;

        const existing = generatedQrData[item.id];
        if (existing) return existing;

        const dataUrl = await QRCode.toDataURL(item.value, {
            margin: 2,
            width: 512,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        setGeneratedQrData((prev) => {
            if (prev[item.id]) return prev;
            return { ...prev, [item.id]: dataUrl };
        });

        return dataUrl;
    }, [generatedQrData]);

    useEffect(() => {
        qrCards
            .filter((item) => item.source === 'generated')
            .forEach((item) => {
                void ensureGeneratedQr(item);
            });
    }, [qrCards, ensureGeneratedQr]);

    const handleDownload = async (item: QRCardItem) => {
        const src = item.file || await ensureGeneratedQr(item);
        const link = document.createElement('a');
        link.href = src;
        link.download = `QR-${item.name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = async () => {
        await Promise.all(
            qrCards
                .filter((item) => item.source === 'generated')
                .map((item) => ensureGeneratedQr(item))
        );
        window.print();
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;

        const name = newRoomName.trim();
        if (!name) {
            toast({
                variant: 'destructive',
                title: 'Room Name Required',
                description: 'Enter a room name before generating a QR code.',
            });
            return;
        }

        setCreatingRoom(true);
        try {
            const created = await createLabRoom(firestore, name);
            setLabRooms((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            setNewRoomName('');

            toast({
                title: 'QR Created',
                description: `${created.name} was added and is ready to download/print.`,
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: err?.message || 'Could not create room QR right now.',
            });
        } finally {
            setCreatingRoom(false);
        }
    };

    return (
        <div className="min-h-screen bg-black print:bg-white print:text-black">
            <div className="print:hidden">
                <Navbar user={currentUser} />
            </div>

            <main className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex items-center justify-between print:hidden">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight text-white font-headline">Room QR Codes</h1>
                        </div>
                        <p className="text-zinc-500">Generate, download, and print QR codes for laboratory access points.</p>
                    </div>
                    <Button variant="outline" onClick={handlePrint} className="gap-2 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                        <Printer className="h-4 w-4" />
                        Print All
                    </Button>
                </div>

                <Card className="bg-zinc-950 border-zinc-800 print:hidden">
                    <CardHeader>
                        <CardTitle className="text-white">Generate New Room QR</CardTitle>
                        <CardDescription className="text-zinc-500">Create a new room entry and auto-generate its QR code instantly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row gap-3">
                            <Input
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="e.g. Robotics Lab"
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                                disabled={creatingRoom}
                            />
                            <Button type="submit" className="gap-2 bg-zinc-100 text-black hover:bg-zinc-200 font-bold" disabled={creatingRoom}>
                                {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Generate QR
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8">
                    {qrCards.map((qr) => (
                        <Card key={qr.id} className="bg-zinc-950 border-zinc-800 shadow-xl print:shadow-none print:border-black/20 print:bg-white">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-xl text-white font-bold print:text-black">{qr.name}</CardTitle>
                                <CardDescription className="text-zinc-500 print:text-gray-500">
                                    {qr.source === 'generated' ? 'Generated in-app' : 'Predefined static QR'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-6 pb-6">
                                <div className="bg-white p-4 rounded-xl shadow-inner border border-zinc-200">
                                    <div className="relative w-48 h-48">
                                        {qr.file || generatedQrData[qr.id] ? (
                                            <Image
                                                src={qr.file || generatedQrData[qr.id]}
                                                alt={`QR Code for ${qr.name}`}
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full grid place-items-center text-zinc-500 text-xs">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    className="w-full gap-2 bg-zinc-100 text-black hover:bg-zinc-200 font-bold print:hidden"
                                    onClick={() => void handleDownload(qr)}
                                >
                                    <Download className="h-4 w-4" />
                                    Download Image
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {loadingRooms ? (
                    <div className="print:hidden flex items-center justify-center py-4 text-zinc-500 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading generated rooms...
                    </div>
                ) : null}

                <div className="hidden print:block text-center mt-12 text-sm text-gray-400">
                    Generated by NEU Laboratory Log Management System
                </div>
            </main>
        </div>
    );
}
