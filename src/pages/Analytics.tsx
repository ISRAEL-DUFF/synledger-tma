import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, Wallet, Receipt, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const formatNaira = (value: number) => {
  if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `₦${(value / 1000).toFixed(0)}K`;
  return `₦${value.toLocaleString()}`;
};

export default function Analytics() {
  const { data: stats, isLoading, isError, error, refetch } = useAnalytics();

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout>
        <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Failed to load analytics</h3>
            <p className="text-muted-foreground">{(error as any)?.message || "Internal server error"}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">Try Again</Button>
        </div>
      </PageLayout>
    );
  }

  if (!stats) return null;

  return (
    <PageLayout>
      <div className="py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Your real-time spending insights</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total Spent (Month)</p>
              <p className="text-xl font-bold">{formatNaira(stats.totalSpentNgn)}</p>
              <p className="text-xs text-primary">${stats.totalSpentUsd.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <Receipt className="h-4 w-4 text-success" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold">{stats.totalTransactions}</p>
              <p className="text-xs text-muted-foreground">Total confirmed</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-warning/10">
                  <ArrowUpRight className="h-4 w-4 text-warning" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Avg Transaction</p>
              <p className="text-xl font-bold">{formatNaira(stats.avgTransactionNgn)}</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-pending/10">
                  <TrendingUp className="h-4 w-4 text-pending" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">vs Last Week</p>
              <p className={`text-xl font-bold ${stats.spendingChange && stats.spendingChange > 0 ? 'text-destructive' : 'text-success'}`}>
                {stats.spendingChange && stats.spendingChange > 0 ? '+' : ''}{stats.spendingChange || 0}%
              </p>
              <p className="text-xs text-muted-foreground">Weekly trend</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 30-Day Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">30-Day Spending Trend</h3>
              {stats.dailyTrend.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.dailyTrend}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatNaira(value), "Spent"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(174, 72%, 40%)"
                        strokeWidth={2}
                        fill="url(#colorAmount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm italic">
                  Not enough data for 30-day trend
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Spending by Category</h3>
              {stats.categoryBreakdown.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {stats.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {stats.categoryBreakdown.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm">{entry.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatNaira(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm italic">
                  No categorical data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Current Week Daily Breakdown</h3>
              {stats.weeklyTrend.length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyTrend}>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatNaira(value), "Spent"]}
                      />
                      <Bar
                        dataKey="amount"
                        fill="hsl(174, 72%, 40%)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm italic">
                  No activity this week
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
