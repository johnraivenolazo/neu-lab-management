"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { summarizeLabUsageData } from '@/ai/flows/summarize-lab-usage-data';
import { LabLog } from '@/lib/types';

interface AIUsageSummaryProps {
  logs: LabLog[];
}

export default function AIUsageSummary({ logs }: AIUsageSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (logs.length === 0) return;

    setLoading(true);
    try {
      const result = await summarizeLabUsageData({
        usageData: JSON.stringify(logs.map(log => ({
          professor: log.professorName,
          room: log.roomNumber,
          timestamp: log.checkIn.toISOString(),
          duration: log.duration
        })))
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("AI Error:", error);
      setSummary("Failed to generate summary. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (logs.length > 0 && !summary) {
      generateSummary();
    }
  }, [logs]);

  return (
    <Card className="border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Smart Lab Insights
            </CardTitle>
            <CardDescription className="text-zinc-500">AI-generated overview of usage trends</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={generateSummary}
            disabled={loading || logs.length === 0}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500 animate-pulse">Analyzing logs...</p>
          </div>
        ) : summary ? (
          <div className="prose prose-sm prose-invert max-w-none text-zinc-400 leading-relaxed">
            {summary.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-4">No data available to analyze.</p>
        )}
      </CardContent>
    </Card>
  );
}
