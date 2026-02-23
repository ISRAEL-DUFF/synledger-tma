import { Card } from "@/components/ui/card";
import { FileText, Send, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/invoiceData";

interface InvoiceStatsProps {
  stats: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalPaid: number;
    totalPending: number;
  };
}

export const InvoiceStats = ({ stats }: InvoiceStatsProps) => {
  const statItems = [
    {
      label: "Draft",
      value: stats.draft,
      icon: FileText,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Sent",
      value: stats.sent,
      icon: Send,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Paid",
      value: stats.paid,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {statItems.map((item) => (
          <Card key={item.label} variant="glass" className="p-3 text-center">
            <div className={`w-8 h-8 rounded-full ${item.bgColor} flex items-center justify-center mx-auto mb-2`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-lg font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Card variant="glass" className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(stats.totalPaid)}</p>
        </Card>
        <Card variant="glass" className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-xl font-bold text-warning">{formatCurrency(stats.totalPending)}</p>
        </Card>
      </div>
    </div>
  );
};
