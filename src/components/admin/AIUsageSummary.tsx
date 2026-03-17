"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { LabLog } from '@/lib/types';
import { formatDuration, getDurationSeconds } from '@/lib/utils';

interface AIUsageSummaryProps {
  logs: LabLog[];
}

export default function AIUsageSummary({ logs }: AIUsageSummaryProps) {
  const [refreshTick, setRefreshTick] = useState(0);

  const summaryLines = useMemo(() => {
    void refreshTick;

    if (logs.length === 0) {
      return ["No data available to analyze."];
    }

    const closedLogs = logs.filter((log) => !!log.checkOut);
    const activeLogs = logs.length - closedLogs.length;

    const roomCounts = logs.reduce((acc, log) => {
      acc[log.roomNumber] = (acc[log.roomNumber] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topRoom = Object.entries(roomCounts).sort(([, a], [, b]) => b - a)[0];

    const professorCounts = logs.reduce((acc, log) => {
      acc[log.professorName] = (acc[log.professorName] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topProfessor = Object.entries(professorCounts).sort(([, a], [, b]) => b - a)[0];

    const hourCounts: Record<number, number> = {};
    for (const log of logs) {
      const hour = log.checkIn.getHours();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
    const peakHourEntry = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
    const peakHour = peakHourEntry ? Number(peakHourEntry[0]) : null;

    const totalDurationSeconds = closedLogs.reduce((acc, log) => acc + (getDurationSeconds(log) ?? 0), 0);
    const avgDurationSeconds = closedLogs.length > 0 ? Math.round(totalDurationSeconds / closedLogs.length) : 0;

    const lines = [
      `Total sessions recorded: ${logs.length}. Active now: ${activeLogs}.`,
      `Most active room: ${topRoom ? `Room ${topRoom[0]} (${topRoom[1]} sessions)` : 'N/A'}.`,
      `Most frequent user: ${topProfessor ? `${topProfessor[0]} (${topProfessor[1]} sessions)` : 'N/A'}.`,
      `Peak check-in hour: ${peakHour !== null ? `${peakHour.toString().padStart(2, '0')}:00-${((peakHour + 1) % 24).toString().padStart(2, '0')}:00` : 'N/A'}.`,
      `Average closed-session duration: ${closedLogs.length > 0 ? formatDuration(avgDurationSeconds) : 'N/A'}.`,
    ];

    return lines;
  }, [logs, refreshTick]);

  return (
    <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Smart Lab Insights
            </CardTitle>
            <CardDescription className="text-zinc-500">Rule-based overview of usage trends</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRefreshTick((prev) => prev + 1)}
            disabled={logs.length === 0}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm prose-invert max-w-none text-zinc-400 leading-relaxed">
          {summaryLines.map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">{line}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
