import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatMetric } from "@/types";

export function StatCard({ label, value, change }: StatMetric) {
  return (
    <Card className="border-border/60 bg-card/50 shadow-none transition-colors hover:border-border hover:bg-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}
