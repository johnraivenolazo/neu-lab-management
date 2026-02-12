import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-950 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {(description || trend) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend.value}
              </span>
            )}
            {description && (
              <p className="text-xs text-zinc-600">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
