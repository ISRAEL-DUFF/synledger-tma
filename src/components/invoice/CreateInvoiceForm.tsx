import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Invoice, 
  InvoiceType, 
  LineItem, 
  Milestone,
  CryptoToken,
  generateId,
  defaultTerms,
} from "@/lib/invoiceData";
import { Plus, Trash2, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";

interface CreateInvoiceFormProps {
  onSubmit: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total' | 'walletAddress'>) => void;
  onCancel: () => void;
}

export const CreateInvoiceForm = ({ onSubmit, onCancel }: CreateInvoiceFormProps) => {
  const [step, setStep] = useState(1);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('simple');
  
  // Client details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  
  // Invoice details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  
  // Line items (for simple invoices)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  
  // Milestones (for milestone invoices)
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: generateId(), title: '', description: '', amount: 0, dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), status: 'pending' }
  ]);
  
  // Payment settings
  const [acceptedTokens, setAcceptedTokens] = useState<CryptoToken[]>(['USDT', 'USDC']);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: generateId(), description: '', quantity: 1, rate: 0, amount: 0 }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  // Milestone helpers
  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { id: generateId(), title: '', description: '', amount: 0, dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), status: 'pending' }
    ]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) => {
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const toggleToken = (token: CryptoToken) => {
    if (acceptedTokens.includes(token)) {
      if (acceptedTokens.length > 1) {
        setAcceptedTokens(acceptedTokens.filter(t => t !== token));
      }
    } else {
      setAcceptedTokens([...acceptedTokens, token]);
    }
  };

  const calculateTotal = () => {
    if (invoiceType === 'milestone') {
      return milestones.reduce((sum, m) => sum + m.amount, 0);
    }
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = () => {
    const invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total' | 'walletAddress'> = {
      type: invoiceType,
      status: 'draft',
      clientName,
      clientEmail,
      clientCompany: clientCompany || undefined,
      title,
      description: description || undefined,
      lineItems: invoiceType === 'milestone' ? [] : lineItems,
      milestones: invoiceType === 'milestone' ? milestones : undefined,
      acceptedTokens,
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
      termsAndConditions: defaultTerms,
    };
    
    onSubmit(invoice);
  };

  const isStep1Valid = invoiceType && clientName && clientEmail;
  const isStep2Valid = invoiceType === 'milestone' 
    ? title && milestones.every(m => m.title && m.amount > 0)
    : title && lineItems.every(item => item.description && item.rate > 0);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Invoice Type & Client</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Invoice Type</Label>
                  <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as InvoiceType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple Invoice</SelectItem>
                      <SelectItem value="milestone">Milestone Invoice</SelectItem>
                      <SelectItem value="recurring">Recurring Invoice</SelectItem>
                      <SelectItem value="quote">Quote/Estimate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Client Name *</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Client Email *</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Company (Optional)</Label>
                  <Input
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Company Name"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!isStep1Valid}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Invoice Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Invoice Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Web Development Services"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of services..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {invoiceType === 'milestone' ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <Label>Project Milestones</Label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={addMilestone}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Milestone
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      Client funds full amount upfront (escrow). Funds released per milestone completion.
                    </p>
                    
                    <div className="space-y-3">
                      {milestones.map((milestone, index) => (
                        <Card key={milestone.id} variant="glass" className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-1">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input
                                value={milestone.title}
                                onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                placeholder="Milestone title (e.g., Design Phase)"
                              />
                              <Textarea
                                value={milestone.description}
                                onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                                placeholder="Deliverables for this milestone..."
                                className="min-h-[60px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Amount ($)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={milestone.amount || ''}
                                    onChange={(e) => updateMilestone(milestone.id, 'amount', Number(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Due Date</Label>
                                  <Input
                                    type="date"
                                    value={milestone.dueDate}
                                    onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                            {milestones.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMilestone(milestone.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-right">
                      <span className="text-muted-foreground">Total Escrow: </span>
                      <span className="text-lg font-bold text-foreground">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Line Items</Label>
                      <Button variant="ghost" size="sm" onClick={addLineItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {lineItems.map((item) => (
                        <Card key={item.id} variant="glass" className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={item.description}
                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Qty</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Rate ($)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.rate || ''}
                                    onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Amount</Label>
                                  <Input
                                    value={`$${item.amount.toFixed(2)}`}
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                              </div>
                            </div>
                            {lineItems.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLineItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-right">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="text-lg font-bold text-foreground">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!isStep2Valid}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Payment Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Accepted Tokens</Label>
                  <div className="flex gap-2 mt-2">
                    {(['USDT', 'USDC'] as CryptoToken[]).map((token) => (
                      <Button
                        key={token}
                        variant={acceptedTokens.includes(token) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleToken(token)}
                      >
                        {token}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Notes for Client (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="mt-1"
                  />
                </div>

                <Card variant="glass" className="p-4">
                  <h4 className="font-medium text-foreground mb-3">Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span className="text-foreground">{clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Title</span>
                      <span className="text-foreground">{title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="text-foreground">{format(new Date(dueDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {invoiceType === 'milestone' ? 'Milestones' : 'Items'}
                      </span>
                      <span className="text-foreground">
                        {invoiceType === 'milestone' ? milestones.length : lineItems.length}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2 flex justify-between">
                      <span className="font-medium text-foreground">
                        {invoiceType === 'milestone' ? 'Total Escrow' : 'Total'}
                      </span>
                      <span className="font-bold text-foreground">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Create Invoice
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
