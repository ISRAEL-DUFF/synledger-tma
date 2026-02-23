import { motion } from "framer-motion";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickActions } from "@/components/QuickActions";
import { SpendingInsights } from "@/components/SpendingInsights";
import { TransactionList } from "@/components/TransactionList";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockTransactions, currentExchangeRate } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useTransactions } from "@/hooks/useTransactions";
import { useSpendingInsights } from "@/hooks/useSpendingInsights";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const navigate = useNavigate();
  const { isConnected, balance } = useWallet();

  // Fetch dynamic exchange rate
  const { data: exchangeRateData } = useExchangeRate('USDT');
  const rate = exchangeRateData?.effectiveRate || currentExchangeRate;

  // Fetch real transactions for recent activity
  const { data: transactionsData, isLoading: isTxLoading } = useTransactions({
    limit: 5,
    page: 1,
  });

  // Fetch real spending insights
  const { data: insightsData, isLoading: isInsightsLoading } = useSpendingInsights();

  const transactions = transactionsData?.data || [];

  // Use real balance if connected, otherwise show demo values
  const displayBalance = {
    usdt: isConnected ? balance.usdt : 1250.50,
    usdc: isConnected ? balance.usdc : 350.25,
    locked: isConnected ? balance.locked : 35.20,
  };

  return (
    <DashboardLayout>
      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Balance Card */}
          <BalanceCard
            usdtBalance={displayBalance.usdt}
            usdcBalance={displayBalance.usdc}
            ngnRate={rate}
            lockedAmount={displayBalance.locked}
          />

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <QuickActions />
          </motion.section>

          {/* Recent Transactions - Full width on mobile, shown in main column on desktop */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:hidden"
          >
            {isTxLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-2xl" />
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                showViewAll
                onViewAll={() => navigate("/history")}
                onTransactionClick={(tx) => console.log("View transaction:", tx)}
              />
            )}
          </motion.section>
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="lg:col-span-4 space-y-6">
          {/* Spending Insights */}
          {isInsightsLoading ? (
            <Skeleton className="h-[120px] w-full rounded-2xl" />
          ) : (
            <SpendingInsights
              totalSpentToday={insightsData?.totalSpentToday || 0}
              totalSpentWeek={insightsData?.totalSpentWeek || 0}
              totalSpentMonth={insightsData?.totalSpentMonth || 0}
              weeklyChange={insightsData?.weeklyChange}
            />
          )}

          {/* Recent Transactions - Desktop only in sidebar */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block"
          >
            {isTxLoading ? (
              <div className="space-y-3 mt-4">
                <Skeleton className="h-[300px] w-full rounded-2xl" />
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                showViewAll
                onViewAll={() => navigate("/history")}
                onTransactionClick={(tx) => console.log("View transaction:", tx)}
              />
            )}
          </motion.section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
