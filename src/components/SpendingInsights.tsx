import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SpendingInsight {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
}

interface SpendingInsightsProps {
  totalSpentToday: number;
  totalSpentWeek: number;
  totalSpentMonth: number;
  weeklyChange?: number;
}

export function SpendingInsights({
  totalSpentToday,
  totalSpentWeek,
  totalSpentMonth,
  weeklyChange = 0
}: SpendingInsightsProps) {
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const insights: SpendingInsight[] = [
    {
      label: "Today",
      value: formatNaira(totalSpentToday),
    },
    {
      label: "Weekly",
      value: formatNaira(totalSpentWeek),
      change: weeklyChange,
    },
    {
      label: "Monthly",
      value: formatNaira(totalSpentMonth),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary via-primary/90 to-accent shadow-xl shadow-primary/20">
        <CardContent className="p-6 relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full -ml-12 -mb-12 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest">Spending Analytics</h3>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <span className="text-[10px] font-bold text-white">LIVE ⦿</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {insights.map((insight) => (
                <div key={insight.label} className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 border border-white/10 hover:bg-white/15 transition-colors">
                  <p className="text-[10px] font-medium text-white/60 mb-1 uppercase leading-tight">{insight.label}</p>
                  <p className="text-base font-black text-white tracking-tight leading-none mb-2">{insight.value}</p>

                  {insight.change !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit ${insight.change >= 0 ? 'bg-destructive/20 text-destructive-foreground' : 'bg-success/20 text-success-foreground'}`}>
                      {insight.change >= 0 ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      <span>{Math.abs(insight.change)}%</span>
                    </div>
                  )}
                  {insight.change === undefined && (
                    <div className="h-[18px]" /> // Spacer
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
