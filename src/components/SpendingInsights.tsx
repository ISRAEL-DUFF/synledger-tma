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
      label: "This Week",
      value: formatNaira(totalSpentWeek),
      change: weeklyChange,
      changeLabel: "vs last week",
    },
    {
      label: "This Month",
      value: formatNaira(totalSpentMonth),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card variant="default" className="overflow-hidden">
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground mb-4">Spending Overview</h3>
          
          <div className="grid grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div key={insight.label} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{insight.label}</p>
                <p className="text-lg font-bold text-foreground">{insight.value}</p>
                {insight.change !== undefined && (
                  <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${insight.change >= 0 ? 'text-destructive' : 'text-success'}`}>
                    {insight.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(insight.change)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
