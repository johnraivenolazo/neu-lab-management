"use client";

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Mail, Loader2, CheckCircle2, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth/AuthGuard';
import { useFirebase } from '@/firebase/provider';
import {
  createUsageLog,
  checkOutLog,
  getActiveSession,
  checkProfessorBlocked,
} from '@/lib/firestore-service';
import type { LabLog } from '@/lib/types';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/professor/QRScanner'), { ssr: false });

export default function ProfessorCheckIn() {
  return (
    <AuthGuard requiredRole="professor">
      <ProfessorContent />
    </AuthGuard>
  );
}

function ProfessorContent() {
  const { user, firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<LabLog | null>(null);
  const { toast } = useToast();

  // Check for existing active session on mount
  useEffect(() => {
    async function load() {
      if (!firestore || !user) return;
      try {
        const session = await getActiveSession(firestore, user.uid);
        setActiveSession(session);
      } catch (err) {
        console.error('Failed to load active session:', err);
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, [firestore, user]);

  const handleCheckIn = useCallback(async (room: string) => {
    if (!firestore || !user) return;
    setLoading(true);
    try {
      // Check if professor is blocked
      const blocked = await checkProfessorBlocked(firestore, user.uid);
      if (blocked) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Your laboratory access has been revoked. Contact an administrator.',
        });
        return;
      }

      // Check for existing active session
      const existing = await getActiveSession(firestore, user.uid);
      if (existing) {
        toast({
          variant: 'destructive',
          title: 'Active Session Exists',
          description: `You already have an active session in Room ${existing.roomNumber}. Check out first.`,
        });
        setActiveSession(existing);
        return;
      }

      const logId = await createUsageLog(firestore, {
        professorId: user.uid,
        professorName: user.displayName || user.email || 'Unknown',
        roomNumber: room,
      });

      setActiveSession({
        id: logId,
        professorId: user.uid,
        professorName: user.displayName || '',
        roomNumber: room,
        checkIn: new Date(),
      });

      toast({
        title: 'Access Granted',
        description: `Thank you for using Room ${room}. Session started at ${format(new Date(), 'hh:mm a')}.`,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Check-in failed.' });
    } finally {
      setLoading(false);
    }
  }, [firestore, user, toast]);

  const handleCheckOut = async () => {
    if (!firestore || !activeSession) return;
    setLoading(true);
    try {
      await checkOutLog(firestore, activeSession.id);
      setActiveSession(null);
      toast({
        title: 'Session Ended',
        description: 'You have successfully checked out. Have a productive day!',
      });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Check-out failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (decoded: string) => {
    const room = decoded.trim();
    if (room) handleCheckIn(room);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const room = (formData.get('roomNumber') as string)?.trim();
    if (room) handleCheckIn(room);
  };

  const currentUser = {
    displayName: user?.displayName || 'Professor',
    email: user?.email || '',
    role: 'professor' as const,
    photoURL: user?.photoURL || undefined,
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={currentUser} />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white font-headline mb-2">Laboratory Entry</h1>
          <p className="text-zinc-400 text-lg">Scan the lab&apos;s QR code or enter room details manually.</p>
        </header>

        {activeSession ? (
          <Card className="border-emerald-500/20 bg-zinc-950 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="h-1 bg-emerald-500" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <CardTitle className="text-3xl font-bold text-white">Active Session</CardTitle>
              <CardDescription className="text-emerald-400/70">You are currently logged into a laboratory room.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center gap-3">
                  <MapPin className="h-6 w-6 text-emerald-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em]">Room Number</span>
                  <span className="text-2xl font-bold text-white">{activeSession.roomNumber}</span>
                </div>
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center gap-3">
                  <Clock className="h-6 w-6 text-emerald-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em]">Check-in Time</span>
                  <span className="text-2xl font-bold text-white">{format(activeSession.checkIn, 'hh:mm a')}</span>
                </div>
              </div>
              <div className="text-center px-4">
                <p className="text-sm text-zinc-400">Please remember to check out when you leave the premises to maintain accurate logs.</p>
              </div>
            </CardContent>
            <CardFooter className="pb-8">
              <Button
                variant="destructive"
                className="w-full h-14 text-lg font-bold bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20"
                onClick={handleCheckOut}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'End Session & Check Out'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-zinc-900 border border-zinc-800 p-1">
              <TabsTrigger value="qr" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all rounded-md">
                <QrCode className="h-4 w-4" />
                QR Scan
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all rounded-md">
                <Mail className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-8">
              <Card className="border border-zinc-800 bg-zinc-950 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Scan QR Code</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Point your camera at the QR code displayed near the lab entrance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
                  <QRScanner
                    onScan={handleQRScan}
                    onError={(msg) => toast({ variant: 'destructive', title: 'Camera Error', description: msg })}
                    disabled={loading}
                  />
                  <p className="text-xs text-zinc-600 text-center max-w-xs">
                    The QR code contains the room number. Grant camera permission when prompted.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-8">
              <Card className="border border-zinc-800 bg-zinc-950 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Manual Access</CardTitle>
                  <CardDescription className="text-zinc-400">
                    If the scanner fails, please enter the room number provided by the administrator.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="roomNumber" className="text-zinc-300 ml-1">Laboratory Room Number</Label>
                      <Input
                        id="roomNumber"
                        name="roomNumber"
                        placeholder="e.g. 101, 204, or BIO-1"
                        required
                        className="h-14 text-lg font-medium bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-white/20"
                      />
                    </div>
                    <Button type="submit" className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-zinc-200" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Verify Access'}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="bg-zinc-900/50 border-t border-zinc-800/50 py-5">
                  <p className="text-xs text-zinc-500 italic text-center w-full">
                    Manual login is logged for security auditing purposes.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}