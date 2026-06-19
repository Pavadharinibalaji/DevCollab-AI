"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export interface ProductivityDataPoint {
  name: string;
  completed: number;
  created: number;
}

interface ProductivityChartProps {
  data: ProductivityDataPoint[];
  className?: string;
}

export function ProductivityChart({ data, className }: ProductivityChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ProductivityChartSkeleton />;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/30 p-5 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
            Workspace Velocity
          </h3>
          <p className="text-xs text-muted-foreground">
            Tasks completed vs created this week
          </p>
        </div>
      </div>

      <div className="h-65 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6e6aed" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6e6aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#8b8b93"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#8b8b93"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-border/80 bg-card p-3 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-1.5 mb-1.5">{label}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Completed:
                          </span>
                          <span className="font-semibold text-foreground">{payload[0].value}</span>
                        </div>
                        {payload[1] && (
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-primary flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              Created:
                            </span>
                            <span className="font-semibold text-foreground">{payload[1].value}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconSize={8}
              iconType="circle"
              wrapperStyle={{ fontSize: "10px", paddingBottom: "10px" }}
            />
            <Area
              name="Completed Tasks"
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
            <Area
              name="Created Tasks"
              type="monotone"
              dataKey="created"
              stroke="#6e6aed"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCreated)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProductivityChartSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/20 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-muted/60" />
          <div className="h-3 w-48 rounded bg-muted/60" />
        </div>
      </div>
      <div className="h-65 w-full flex items-end justify-between pt-6 pr-2">
        <div className="w-[10%] h-[20%] bg-muted/40 rounded-t" />
        <div className="w-[10%] h-[40%] bg-muted/40 rounded-t" />
        <div className="w-[10%] h-[35%] bg-muted/40 rounded-t" />
        <div className="w-[10%] h-[60%] bg-muted/40 rounded-t" />
        <div className="w-[10%] h-[80%] bg-muted/40 rounded-t" />
        <div className="w-[10%] h-[15%] bg-muted/40 rounded-t" />
        <div className="w-[10%] h-[30%] bg-muted/40 rounded-t" />
      </div>
    </div>
  );
}
