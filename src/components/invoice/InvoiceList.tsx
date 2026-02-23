import { Invoice, formatCurrency, getStatusColor, getInvoiceTypeLabel } from "@/lib/invoiceData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
}

export const InvoiceList = ({ invoices, onSelectInvoice }: InvoiceListProps) => {
  if (invoices.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No invoices yet</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first invoice to get started</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice, index) => (
        <motion.div
          key={invoice.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            variant="glass"
            className="p-4 cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => onSelectInvoice(invoice)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    {invoice.invoiceNumber}
                  </span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <p className="font-medium text-foreground truncate">{invoice.clientName}</p>
                <p className="text-sm text-muted-foreground truncate">{invoice.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{getInvoiceTypeLabel(invoice.type)}</span>
                  <span>•</span>
                  <span>Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatCurrency(invoice.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.acceptedTokens.join(', ')}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
