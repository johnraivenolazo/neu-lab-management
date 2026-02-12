"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Clock, MapPin, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth/AuthGuard';
import { useFirebase } from '@/firebase/provider';
import { getLogsByProfessor } from '@/lib/firestore-service';
import type { LabLog } from '@/lib/types';

export default function ProfessorHistoryPage() {
  return (
    <AuthGuard requiredRole="professor">
      <HistoryContent />
    </AuthGuard>
  );
}

function HistoryContent() {
  const { user, firestore } = useFirebase();
  const [logs, setLogs] = useState<LabLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!firestore || !user) return;
      try {
        const data = await getLogsByProfessor(firestore, user.uid);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [firestore, user]);

  const currentUser = {
    displayName: user?.displayName || 'Professor',
    email: user?.email || '',
    role: 'professor' as const,
    photoURL: user?.photoURL || undefined,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={currentUser} />

      <main className="container mx-auto px-4 py-12 space-y-8 max-w-5xl">
        <header className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              <History className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white font-headline">My Usage History</h1>
          </div>
          <p className="text-zinc-400 text-lg">Review your laboratory access sessions and durations.</p>
        </header>

        <Card className="shadow-2xl border-zinc-800 bg-zinc-950 overflow-hidden">
          <CardHeader className="border-b border-zinc-900 pb-6">
            <CardTitle className="text-xl text-white">Recent Sessions</CardTitle>
            <CardDescription className="text-zinc-500">A detailed log of your past laboratory entries and exits.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Date</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Laboratory Room</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Check-In</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Check-Out</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                      <TableCell className="text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          {format(log.checkIn, 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            Room {log.roomNumber}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="h-3 w-3" />
                          {format(log.checkIn, 'hh:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.checkOut ? (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock className="h-3 w-3" />
                            {format(log.checkOut, 'hh:mm a')}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-200">
                        {log.duration ? `${log.duration} min` : '--'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-zinc-600">
                      No session logs found for your account.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Total Sessions</CardDescription>
              <CardTitle className="text-3xl text-white">{logs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Total Minutes</CardDescription>
              <CardTitle className="text-3xl text-white">
                {logs.reduce((acc, log) => acc + (log.duration || 0), 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">Fav Room</CardDescription>
              <CardTitle className="text-3xl text-white">
                {logs.length > 0 ? `Room ${logs[0].roomNumber}` : 'N/A'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
