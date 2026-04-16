import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceList } from "@/components/invoice/InvoiceList";
import { InvoiceDetail } from "@/components/invoice/InvoiceDetail";
import { InvoiceStats } from "@/components/invoice/InvoiceStats";
import { CreateInvoiceForm } from "@/components/invoice/CreateInvoiceForm";
import type { Invoice } from "@/lib/invoiceData";
import { Plus, ArrowLeft } from "lucide-react";

type View = "list" | "detail" | "create";

export default function Invoices() {
  const navigate = useNavigate();
  const {
    invoices,
    isLoading,
    createInvoice,
    sendInvoice,
    markAsPaid,
    cancelInvoice,
    deleteInvoice,
    releaseMilestone,
    updateMilestoneStatus,
    getShareableLink,
    getStats,
  } = useInvoices();

  const [view, setView] = useState<View>("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const stats = getStats();

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView("detail");
  };

  const handleBack = () => {
    if (view === "list") {
      navigate(-1);
    } else {
      setView("list");
      setSelectedInvoice(null);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Invoices" showBack onBack={() => navigate(-1)}>
        <div className="py-6 flex justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={view === "create" ? "New Invoice" : view === "detail" ? "Invoice" : "Invoices"}
      showBack
      onBack={handleBack}
    >
      <div className="py-6 space-y-6">
        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <InvoiceStats stats={stats} />
              <div className="flex justify-end">
                <Button onClick={() => setView("create")} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Invoice
                </Button>
              </div>
              <InvoiceList
                invoices={invoices}
                onSelectInvoice={handleSelectInvoice}
              />
            </motion.div>
          )}

          {view === "detail" && selectedInvoice && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InvoiceDetail
                invoice={selectedInvoice}
                onBack={() => setView("list")}
                onSend={(id) => { sendInvoice(id); setView("list"); }}
                onMarkPaid={(id) => { markAsPaid(id); setView("list"); }}
                onCancel={(id) => { cancelInvoice(id); setView("list"); }}
                onDelete={(id) => { deleteInvoice(id); setView("list"); }}
                getShareableLink={getShareableLink}
                onReleaseMilestone={releaseMilestone}
                onUpdateMilestoneStatus={updateMilestoneStatus}
              />
            </motion.div>
          )}

          {view === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CreateInvoiceForm
                onSubmit={(data) => {
                  createInvoice(data);
                  setView("list");
                }}
                onCancel={() => setView("list")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
