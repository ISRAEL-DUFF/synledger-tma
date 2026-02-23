import { Invoice, Milestone, formatCurrency, getStatusColor, getInvoiceTypeLabel } from "@/lib/invoiceData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Share2, 
  Trash2,
  ArrowLeft,
  Calendar,
  Mail,
  Building2,
  FileText,
  Target,
  Lock,
  Unlock,
  Play,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
  onSend: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  getShareableLink: (id: string) => string;
  onReleaseMilestone?: (invoiceId: string, milestoneId: string) => void;
  onUpdateMilestoneStatus?: (invoiceId: string, milestoneId: string, status: 'pending' | 'in_progress' | 'completed') => void;
}

const getMilestoneStatusColor = (status: Milestone['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-muted text-muted-foreground';
    case 'in_progress':
      return 'bg-blue-500/20 text-blue-400';
    case 'completed':
      return 'bg-amber-500/20 text-amber-400';
    case 'released':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const InvoiceDetail = ({ 
  invoice, 
  onBack, 
  onSend, 
  onMarkPaid, 
  onCancel,
  onDelete,
  getShareableLink,
  onReleaseMilestone,
  onUpdateMilestoneStatus
}: InvoiceDetailProps) => {
  const isMilestoneInvoice = invoice.type === 'milestone' && invoice.milestones && invoice.milestones.length > 0;
  
  const getMilestoneProgress = () => {
    if (!invoice.milestones) return 0;
    const released = invoice.milestones.filter(m => m.status === 'released').length;
    return (released / invoice.milestones.length) * 100;
  };

  const getReleasedAmount = () => {
    if (!invoice.milestones) return 0;
    return invoice.milestones
      .filter(m => m.status === 'released')
      .reduce((sum, m) => sum + m.amount, 0);
  };

  const getEscrowedAmount = () => {
    if (!invoice.milestones) return 0;
    return invoice.milestones
      .filter(m => m.status !== 'released')
      .reduce((sum, m) => sum + m.amount, 0);
  };
  const handleCopyLink = () => {
    const link = getShareableLink(invoice.id);
    navigator.clipboard.writeText(link);
    toast.success("Invoice link copied to clipboard!");
  };

  const handleShare = async () => {
    const link = getShareableLink(invoice.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice for ${invoice.title}`,
          url: link,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="font-mono text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
          <h2 className="text-xl font-bold text-foreground">{invoice.title}</h2>
        </div>
        <Badge className={getStatusColor(invoice.status)}>
          {invoice.status}
        </Badge>
      </div>

      {/* Client Info */}
      <Card variant="glass" className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Bill To</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{invoice.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{invoice.clientEmail}</span>
          </div>
          {invoice.clientCompany && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{invoice.clientCompany}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Dates */}
      <Card variant="glass" className="p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <div className="flex items-center gap-2 mt-1 justify-end">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">
                {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Milestones (for milestone invoices) */}
      {isMilestoneInvoice && (
        <Card variant="glass" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">Project Milestones</h3>
          </div>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(getMilestoneProgress())}%</span>
            </div>
            <Progress value={getMilestoneProgress()} className="h-2" />
          </div>
          
          {/* Escrow summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Lock className="h-3 w-3" />
                <span>In Escrow</span>
              </div>
              <p className="font-bold text-foreground">{formatCurrency(getEscrowedAmount())}</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-green-400 mb-1">
                <Unlock className="h-3 w-3" />
                <span>Released</span>
              </div>
              <p className="font-bold text-green-400">{formatCurrency(getReleasedAmount())}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {invoice.milestones!.map((milestone, index) => (
              <div key={milestone.id} className="border border-border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground">{milestone.title}</h4>
                      <Badge className={getMilestoneStatusColor(milestone.status)}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                      <span className="font-medium text-foreground">{formatCurrency(milestone.amount)}</span>
                    </div>
                    
                    {/* Milestone status controls */}
                    {milestone.status !== 'released' && onUpdateMilestoneStatus && invoice.status !== 'cancelled' && invoice.status !== 'draft' && (
                      <div className="flex gap-2 mt-3">
                        {milestone.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => onUpdateMilestoneStatus(invoice.id, milestone.id, 'in_progress')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {milestone.status === 'in_progress' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                              onClick={() => onUpdateMilestoneStatus(invoice.id, milestone.id, 'pending')}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Pause
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => onUpdateMilestoneStatus(invoice.id, milestone.id, 'completed')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          </>
                        )}
                        {milestone.status === 'completed' && onReleaseMilestone && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onReleaseMilestone(invoice.id, milestone.id)}
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Release Funds
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total Project Value</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Line Items (for non-milestone invoices) */}
      {!isMilestoneInvoice && (
        <Card variant="glass" className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Items</h3>
          <div className="space-y-3">
            {invoice.lineItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-foreground">{item.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.rate)}
                  </p>
                </div>
                <span className="font-medium text-foreground">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Info */}
      <Card variant="glass" className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment</h3>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Accepted:</span>
          {invoice.acceptedTokens.map((token) => (
            <Badge key={token} variant="outline">{token}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{getInvoiceTypeLabel(invoice.type)}</p>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card variant="glass" className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
          <p className="text-sm text-foreground">{invoice.notes}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {invoice.status === 'draft' && (
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onDelete(invoice.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button onClick={() => onSend(invoice.id)}>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        )}

        {(invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => onCancel(invoice.id)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => onMarkPaid(invoice.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            </div>
          </>
        )}

        {invoice.status === 'paid' && (
          <Card variant="glass" className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-medium">Payment Received</p>
            {invoice.paidAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Paid on {format(new Date(invoice.paidAt), 'MMM d, yyyy')}
              </p>
            )}
          </Card>
        )}

        {invoice.status === 'cancelled' && (
          <Card variant="glass" className="p-4 text-center">
            <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">Invoice Cancelled</p>
          </Card>
        )}
      </div>
    </motion.div>
  );
};
