import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface VitalSignChartProps {
  signId: string;
  signName: string;
  signNameAr: string;
  color: string;
  days?: number;
}

export function VitalSignChart({ signId, signName, signNameAr, color, days = 7 }: VitalSignChartProps) {
  const { data: history, isLoading } = trpc.vitalSigns.getVitalSignsHistory.useQuery({
    signId,
    days
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // استخراج اللون الأساسي من gradient
  const primaryColor = color.includes("blue") ? "#3b82f6" :
                       color.includes("yellow") || color.includes("orange") ? "#f59e0b" :
                       color.includes("green") ? "#10b981" :
                       color.includes("purple") ? "#a855f7" : "#6b7280";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{signNameAr}</span>
          <span className="text-sm text-muted-foreground">{signName}</span>
        </CardTitle>
        <CardDescription>آخر {days} أيام</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={history || []}>
            <defs>
              <linearGradient id={`gradient-${signId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: `1px solid ${primaryColor}`,
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }}
              formatter={(value: any) => [value.toFixed(1), signNameAr]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              fill={`url(#gradient-${signId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
