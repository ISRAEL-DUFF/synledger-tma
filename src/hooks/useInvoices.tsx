import { useState, useEffect, useCallback } from 'react';
import {
  Invoice,
  InvoiceClient,
  InvoiceStatus,
  LineItem,
  getStoredInvoices,
  saveInvoices,
  getStoredClients,
  saveClients,
  generateInvoiceNumber,
  generateId,
  calculateInvoiceTotals,
  isInvoiceOverdue,
} from '@/lib/invoiceData';
import { useWallet } from './useWallet';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useWallet();

  // Load invoices and clients from storage
  useEffect(() => {
    const loadData = () => {
      const storedInvoices = getStoredInvoices();
      const storedClients = getStoredClients();
      
      // Update overdue status
      const updatedInvoices = storedInvoices.map(inv => {
        if (isInvoiceOverdue(inv) && inv.status === 'sent') {
          return { ...inv, status: 'overdue' as InvoiceStatus };
        }
        return inv;
      });
      
      setInvoices(updatedInvoices);
      setClients(storedClients);
      setIsLoading(false);
      
      // Save if any status changed
      if (JSON.stringify(storedInvoices) !== JSON.stringify(updatedInvoices)) {
        saveInvoices(updatedInvoices);
      }
    };
    
    loadData();
  }, []);

  // Create a new invoice
  const createInvoice = useCallback((
    invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total' | 'walletAddress'>
  ): Invoice => {
    // For milestone invoices, calculate total from milestones
    let subtotal: number;
    let total: number;
    
    if (invoiceData.type === 'milestone' && invoiceData.milestones) {
      subtotal = invoiceData.milestones.reduce((sum, m) => sum + m.amount, 0);
      total = subtotal; // No tax/discount on milestone invoices for now
    } else {
      const calculated = calculateInvoiceTotals(
        invoiceData.lineItems,
        invoiceData.discount,
        invoiceData.discountType,
        invoiceData.tax,
        invoiceData.taxType
      );
      subtotal = calculated.subtotal;
      total = calculated.total;
    }

    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      subtotal,
      total,
      walletAddress: address || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    // Update or create client
    updateClient(invoiceData.clientName, invoiceData.clientEmail, invoiceData.clientCompany, 0);

    return newInvoice;
  }, [invoices, address]);

  // Update an existing invoice
  const updateInvoice = useCallback((
    invoiceId: string,
    updates: Partial<Invoice>
  ): Invoice | null => {
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    if (index === -1) return null;

    let updatedInvoice = {
      ...invoices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate totals if line items changed
    if (updates.lineItems) {
      const { subtotal, total } = calculateInvoiceTotals(
        updates.lineItems,
        updatedInvoice.discount,
        updatedInvoice.discountType,
        updatedInvoice.tax,
        updatedInvoice.taxType
      );
      updatedInvoice = { ...updatedInvoice, subtotal, total };
    }

    const updatedInvoices = [...invoices];
    updatedInvoices[index] = updatedInvoice;
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    return updatedInvoice;
  }, [invoices]);

  // Delete an invoice
  const deleteInvoice = useCallback((invoiceId: string): boolean => {
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    if (index === -1) return false;

    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    return true;
  }, [invoices]);

  // Mark invoice as sent
  const sendInvoice = useCallback((invoiceId: string): Invoice | null => {
    return updateInvoice(invoiceId, { status: 'sent' });
  }, [updateInvoice]);

  // Mark invoice as paid
  const markAsPaid = useCallback((invoiceId: string): Invoice | null => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    const updated = updateInvoice(invoiceId, { 
      status: 'paid',
      paidAt: new Date().toISOString()
    });

    if (updated) {
      // Update client total paid
      const client = clients.find(c => c.email === invoice.clientEmail);
      if (client) {
        const updatedClients = clients.map(c => 
          c.email === invoice.clientEmail 
            ? { ...c, totalPaid: c.totalPaid + invoice.total }
            : c
        );
        setClients(updatedClients);
        saveClients(updatedClients);
      }
    }

    return updated;
  }, [invoices, clients, updateInvoice]);

  // Cancel invoice
  const cancelInvoice = useCallback((invoiceId: string): Invoice | null => {
    return updateInvoice(invoiceId, { status: 'cancelled' });
  }, [updateInvoice]);

  // Release a milestone (mark as released and transfer funds)
  const releaseMilestone = useCallback((invoiceId: string, milestoneId: string): Invoice | null => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || !invoice.milestones) return null;

    const updatedMilestones = invoice.milestones.map(m => 
      m.id === milestoneId ? { ...m, status: 'released' as const } : m
    );

    // Check if all milestones are released
    const allReleased = updatedMilestones.every(m => m.status === 'released');
    
    return updateInvoice(invoiceId, { 
      milestones: updatedMilestones,
      status: allReleased ? 'paid' : invoice.status,
      paidAt: allReleased ? new Date().toISOString() : undefined
    });
  }, [invoices, updateInvoice]);

  // Mark milestone as completed (ready for release)
  const completeMilestone = useCallback((invoiceId: string, milestoneId: string): Invoice | null => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || !invoice.milestones) return null;

    const updatedMilestones = invoice.milestones.map(m => 
      m.id === milestoneId ? { ...m, status: 'completed' as const } : m
    );
    
    return updateInvoice(invoiceId, { milestones: updatedMilestones });
  }, [invoices, updateInvoice]);

  // Update milestone status (for in_progress, etc.)
  const updateMilestoneStatus = useCallback((
    invoiceId: string, 
    milestoneId: string, 
    status: 'pending' | 'in_progress' | 'completed'
  ): Invoice | null => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || !invoice.milestones) return null;

    const updatedMilestones = invoice.milestones.map(m => 
      m.id === milestoneId ? { ...m, status } : m
    );
    
    return updateInvoice(invoiceId, { milestones: updatedMilestones });
  }, [invoices, updateInvoice]);

  // Update or create client
  const updateClient = useCallback((
    name: string,
    email: string,
    company?: string,
    paidAmount: number = 0
  ) => {
    const existingClient = clients.find(c => c.email === email);
    
    if (existingClient) {
      const updatedClients = clients.map(c => 
        c.email === email 
          ? { 
              ...c, 
              name, 
              company, 
              invoiceCount: c.invoiceCount + 1,
              totalPaid: c.totalPaid + paidAmount
            }
          : c
      );
      setClients(updatedClients);
      saveClients(updatedClients);
    } else {
      const newClient: InvoiceClient = {
        id: generateId(),
        name,
        email,
        company,
        invoiceCount: 1,
        totalPaid: paidAmount,
        createdAt: new Date().toISOString(),
      };
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      saveClients(updatedClients);
    }
  }, [clients]);

  // Get invoice by ID
  const getInvoice = useCallback((invoiceId: string): Invoice | undefined => {
    return invoices.find(inv => inv.id === invoiceId);
  }, [invoices]);

  // Get invoices by status
  const getInvoicesByStatus = useCallback((status: InvoiceStatus): Invoice[] => {
    return invoices.filter(inv => inv.status === status);
  }, [invoices]);

  // Generate shareable link (mock)
  const getShareableLink = useCallback((invoiceId: string): string => {
    return `${window.location.origin}/invoice/${invoiceId}`;
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    const draft = invoices.filter(i => i.status === 'draft').length;
    const sent = invoices.filter(i => i.status === 'sent').length;
    const paid = invoices.filter(i => i.status === 'paid');
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    
    const totalPaid = paid.reduce((sum, inv) => sum + inv.total, 0);
    const totalPending = invoices
      .filter(i => ['sent', 'viewed', 'overdue'].includes(i.status))
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      draft,
      sent,
      paid: paid.length,
      overdue,
      totalPaid,
      totalPending,
      totalInvoices: invoices.length,
    };
  }, [invoices]);

  return {
    invoices,
    clients,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markAsPaid,
    cancelInvoice,
    releaseMilestone,
    completeMilestone,
    updateMilestoneStatus,
    getInvoice,
    getInvoicesByStatus,
    getShareableLink,
    getStats,
  };
};
