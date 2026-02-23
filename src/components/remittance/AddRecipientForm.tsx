import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nigerianBanks } from '@/lib/mockData';
import { SavedRecipient } from '@/lib/remittanceData';
import { ArrowLeft, User, Building2, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddRecipientFormProps {
  onBack: () => void;
  onSave: (recipient: Omit<SavedRecipient, 'id' | 'createdAt'>) => void;
}

export function AddRecipientForm({ onBack, onSave }: AddRecipientFormProps) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    fullName: '',
    bankCode: '',
    accountNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedBank = nigerianBanks.find(b => b.code === formData.bankCode);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.bankCode) {
      newErrors.bankCode = 'Please select a bank';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{10}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsValidating(true);

    // Mock account validation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsValidating(false);

    if (!selectedBank) return;

    onSave({
      nickname: formData.nickname.trim(),
      fullName: formData.fullName.trim(),
      bankCode: formData.bankCode,
      bankName: selectedBank.name,
      accountNumber: formData.accountNumber,
    });

    toast({
      title: 'Recipient added',
      description: `${formData.nickname} has been saved to your recipients.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add New Recipient</h2>
            <p className="text-sm text-muted-foreground">Enter Nigerian bank details</p>
          </div>
        </div>

        <Card variant="glass" className="p-5 space-y-5">
          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nickname
            </Label>
            <Input
              id="nickname"
              placeholder="e.g., Mom, Dad, Sister"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
              className={errors.nickname ? 'border-destructive' : ''}
            />
            {errors.nickname && (
              <p className="text-xs text-destructive">{errors.nickname}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Full Name (as on bank account)
            </Label>
            <Input
              id="fullName"
              placeholder="John Oluwaseun Doe"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Bank Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Bank
            </Label>
            <Select
              value={formData.bankCode}
              onValueChange={(value) => setFormData(prev => ({ ...prev, bankCode: value }))}
            >
              <SelectTrigger className={errors.bankCode ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {nigerianBanks.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bankCode && (
              <p className="text-xs text-destructive">{errors.bankCode}</p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Account Number
            </Label>
            <Input
              id="accountNumber"
              placeholder="0123456789"
              value={formData.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, accountNumber: value }));
              }}
              className={errors.accountNumber ? 'border-destructive' : ''}
              inputMode="numeric"
            />
            {errors.accountNumber && (
              <p className="text-xs text-destructive">{errors.accountNumber}</p>
            )}
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={isValidating}
        >
          {isValidating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Validating Account...
            </>
          ) : (
            'Save Recipient'
          )}
        </Button>
      </form>
    </motion.div>
  );
}
