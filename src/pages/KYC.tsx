import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Shield, CheckCircle2, Clock, AlertCircle, ChevronRight,
  User, CreditCard, Fingerprint, MapPin, Loader2,
} from 'lucide-react';
import {
  useKycSummary, useKycLimits, useSubmitKycProfile,
  useSubmitBvn, useSubmitNin,
} from '@/hooks/useKyc';

type Step = 'overview' | 'profile' | 'bvn' | 'nin';

const TIER_LABELS: Record<string, string> = {
  tier0: 'Unverified',
  tier1: 'Basic',
  tier2: 'Standard',
  tier3: 'Full',
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  verified: { color: 'text-success', icon: CheckCircle2 },
  approved: { color: 'text-success', icon: CheckCircle2 },
  pending: { color: 'text-warning', icon: Clock },
  pending_review: { color: 'text-warning', icon: Clock },
  not_started: { color: 'text-muted-foreground', icon: AlertCircle },
  rejected: { color: 'text-destructive', icon: AlertCircle },
};

export default function KYC() {
  const [step, setStep] = useState<Step>('overview');
  const { data: summary, isLoading } = useKycSummary();
  const { data: limits } = useKycLimits();

  if (step === 'profile') return <ProfileStep onBack={() => setStep('overview')} summary={summary} />;
  if (step === 'bvn') return <BvnStep onBack={() => setStep('overview')} />;
  if (step === 'nin') return <NinStep onBack={() => setStep('overview')} />;

  // ─── Overview ──────────────────────────────────
  return (
    <PageLayout title="Verification" showBack>
      <div className="py-4 space-y-6">
        {/* Tier Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Current Tier</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      {TIER_LABELS[summary?.tier ?? 'tier0'] ?? summary?.tier}
                    </h2>
                    <Badge variant={summary?.tier === 'tier3' ? 'default' : 'secondary'}>
                      {summary?.tier ?? 'tier0'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Verification Steps */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Verification Steps
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <StepRow
                icon={User}
                label="Personal Information"
                description="Name, email, phone number"
                status={getCheckStatus(summary?.checks, 'profile')}
                onClick={() => setStep('profile')}
              />
              <StepRow
                icon={CreditCard}
                label="BVN Verification"
                description="Bank Verification Number"
                status={getCheckStatus(summary?.checks, 'bvn')}
                onClick={() => setStep('bvn')}
              />
              <StepRow
                icon={Fingerprint}
                label="NIN Verification"
                description="National Identification Number"
                status={getCheckStatus(summary?.checks, 'nin')}
                onClick={() => setStep('nin')}
              />
              <StepRow
                icon={MapPin}
                label="Proof of Address"
                description="Utility bill or bank statement"
                status={getCheckStatus(summary?.checks, 'proof_of_address')}
                disabled
              />
            </CardContent>
          </Card>
        </div>

        {/* Limits */}
        {limits && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Transaction Limits
            </h3>
            <Card className="p-4 space-y-3">
              {Object.entries(limits.limits ?? {}).map(([op, limit]) => (
                <div key={op} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{op.replace(/_/g, ' ')}</span>
                  <span className="font-medium">
                    {limit.enabled
                      ? `$${limit.dailyUsed.toFixed(0)} / $${limit.dailyLimit.toFixed(0)} daily`
                      : 'Unlimited'}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function getCheckStatus(checks: { type: string; status: string }[] | undefined, type: string): string {
  if (!checks) return 'not_started';
  const check = checks.find((c) => c.type === type);
  return check?.status ?? 'not_started';
}

function StepRow({
  icon: Icon, label, description, status, onClick, disabled,
}: {
  icon: typeof User;
  label: string;
  description: string;
  status: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  const StatusIcon = config.icon;

  return (
    <button
      className={`w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="p-2 rounded-xl bg-secondary">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-4 w-4 ${config.color}`} />
        {!disabled && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </button>
  );
}

// ─── Profile Step ─────────────────────────────────
function ProfileStep({ onBack, summary }: { onBack: () => void; summary?: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string } }) {
  const [firstName, setFirstName] = useState(summary?.firstName ?? '');
  const [lastName, setLastName] = useState(summary?.lastName ?? '');
  const [email, setEmail] = useState(summary?.email ?? '');
  const [phone, setPhone] = useState(summary?.phoneNumber ?? '');
  const submit = useSubmitKycProfile();

  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && phone.trim();

  async function handleSubmit() {
    try {
      await submit.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phoneNumber: phone.trim() });
      toast.success('Profile submitted for verification');
      onBack();
    } catch {
      toast.error('Failed to submit profile');
    }
  }

  return (
    <PageLayout title="Personal Information" showBack onBack={onBack}>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" type="email" />
        </div>
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." type="tel" />
        </div>
        <Button className="w-full" size="lg" disabled={!canSubmit || submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Submit
        </Button>
      </div>
    </PageLayout>
  );
}

// ─── BVN Step ────────────────────────────────────
function BvnStep({ onBack }: { onBack: () => void }) {
  const [bvn, setBvn] = useState('');
  const [consent, setConsent] = useState(false);
  const submit = useSubmitBvn();

  const isValid = /^\d{11}$/.test(bvn) && consent;

  async function handleSubmit() {
    try {
      await submit.mutateAsync({ bvn, consentAccepted: true });
      toast.success('BVN submitted for verification');
      onBack();
    } catch {
      toast.error('BVN verification failed');
    }
  }

  return (
    <PageLayout title="BVN Verification" showBack onBack={onBack}>
      <div className="py-4 space-y-4">
        <Card className="p-4 bg-secondary/30">
          <p className="text-sm text-muted-foreground">
            Your Bank Verification Number (BVN) is used to verify your identity.
            It will not be stored — only the verification result is saved.
          </p>
        </Card>
        <div className="space-y-2">
          <Label>BVN (11 digits)</Label>
          <Input
            value={bvn}
            onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="12345678901"
            inputMode="numeric"
            maxLength={11}
          />
          {bvn.length > 0 && bvn.length !== 11 && (
            <p className="text-xs text-destructive">BVN must be exactly 11 digits</p>
          )}
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span className="text-sm text-muted-foreground">
            I consent to verification of my BVN for identity purposes
          </span>
        </label>
        <Button className="w-full" size="lg" disabled={!isValid || submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Verify BVN
        </Button>
      </div>
    </PageLayout>
  );
}

// ─── NIN Step ────────────────────────────────────
function NinStep({ onBack }: { onBack: () => void }) {
  const [nin, setNin] = useState('');
  const [consent, setConsent] = useState(false);
  const submit = useSubmitNin();

  const isValid = /^\d{11}$/.test(nin) && consent;

  async function handleSubmit() {
    try {
      await submit.mutateAsync({ nin, consentAccepted: true });
      toast.success('NIN submitted for verification');
      onBack();
    } catch {
      toast.error('NIN verification failed');
    }
  }

  return (
    <PageLayout title="NIN Verification" showBack onBack={onBack}>
      <div className="py-4 space-y-4">
        <Card className="p-4 bg-secondary/30">
          <p className="text-sm text-muted-foreground">
            Your National Identification Number (NIN) is used to verify your identity.
          </p>
        </Card>
        <div className="space-y-2">
          <Label>NIN (11 digits)</Label>
          <Input
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="12345678901"
            inputMode="numeric"
            maxLength={11}
          />
          {nin.length > 0 && nin.length !== 11 && (
            <p className="text-xs text-destructive">NIN must be exactly 11 digits</p>
          )}
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span className="text-sm text-muted-foreground">
            I consent to verification of my NIN for identity purposes
          </span>
        </label>
        <Button className="w-full" size="lg" disabled={!isValid || submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Verify NIN
        </Button>
      </div>
    </PageLayout>
  );
}
