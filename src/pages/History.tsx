import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { TransactionList, Transaction } from "@/components/TransactionList";
import { TransactionDetails } from "@/components/TransactionDetails";
import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { CategoryType, StatusType } from "@/components/CategoryIcon";
import { format } from "date-fns";
import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";

const categories: { id: CategoryType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "groceries", label: "Groceries" },
  { id: "airtime", label: "Airtime" },
  { id: "electricity", label: "Electricity" },
  { id: "cable", label: "Cable TV" },
  { id: "internet", label: "Internet" },
  { id: "transfer", label: "Transfer" },
];

const statuses: { id: StatusType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

export default function History() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const socket = useSocket();
  const queryClient = useQueryClient();

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log("Real-time update received: invalidating transactions query");
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    };

    socket.on("intentUpdated", handleUpdate);
    socket.on("statusChanged", handleUpdate);

    return () => {
      socket.off("intentUpdated", handleUpdate);
      socket.off("statusChanged", handleUpdate);
    };
  }, [socket, queryClient]);

  const { data, isLoading, isError, error } = useTransactions({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    status: selectedStatus === "all" ? undefined : selectedStatus,
    search: searchQuery,
    page: currentPage,
    limit: 10,
  });

  const transactions = data?.data || [];
  const meta = data?.meta;

  const totalSpent = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === "confirmed" && tx.category !== "deposit")
      .reduce((sum, tx) => sum + tx.amountNgn, 0);
  }, [transactions]);

  const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all";

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = () => {
    if (transactions.length === 0) return;

    const headers = ["Date", "Description", "Category", "Amount (NGN)", "Amount (USD)", "Status", "Reference", "Hash"];
    const csvData = transactions.map(tx => [
      format(new Date(tx.timestamp), "yyyy-MM-dd HH:mm:ss"),
      tx.description,
      tx.category,
      tx.amountNgn,
      tx.amountUsd,
      tx.status,
      tx.reference || "",
      tx.txHash || ""
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `synledger_transactions_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageLayout title="Activity">
      <div className="py-6">
        {/* Desktop: Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <h1 className="text-xl sm:text-2xl font-bold">Transaction History</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={transactions.length === 0 || isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="xs:inline">Export</span>
                </Button>
                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative flex-1 sm:flex-none"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="xs:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </motion.div>

            {/* Transactions List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <p className="text-destructive font-medium">Error loading transactions</p>
                <p className="text-sm text-destructive/80 mt-1">{(error as any)?.message || "Please try again later"}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : (
              <>
                <TransactionList
                  transactions={transactions}
                  title=""
                  onTransactionClick={(tx) => {
                    setSelectedTransaction(tx);
                    setIsDetailsOpen(true);
                  }}
                />

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === meta.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Filters Panel - Always visible on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`space-y-4 p-4 bg-card rounded-xl border border-border ${showFilters ? 'block' : 'hidden lg:block'
                }`}
            >
              <h3 className="font-semibold text-foreground">Filters</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => setSelectedStatus(status.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedStatus === status.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                  Clear All Filters
                </Button>
              )}
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-card rounded-xl border border-border"
            >
              <h3 className="font-semibold text-foreground mb-3">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-medium">{meta?.total || transactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="font-semibold text-primary">
                    ₦{totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <TransactionDetails
        transaction={selectedTransaction}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </PageLayout>
  );
}
