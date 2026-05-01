import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Loader2, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const KYC_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  verified: { label: 'Verified', variant: 'default' },
  approved: { label: 'Approved', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  pending_review: { label: 'Pending Review', variant: 'secondary' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  none: { label: 'Unverified', variant: 'outline' },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? user?.phone ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [saving, setSaving] = useState(false);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    user?.email ||
    'User';

  const initials = (
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') ||
    user?.email?.[0] ||
    'U'
  ).toUpperCase();

  const kycConfig = KYC_BADGE[user?.kycStatus ?? 'none'] ?? KYC_BADGE.none;

  const copyWallet = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast.success('Wallet address copied');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileChanged =
        firstName !== (user?.firstName ?? '') ||
        lastName !== (user?.lastName ?? '') ||
        email !== (user?.email ?? '') ||
        phoneNumber !== (user?.phoneNumber ?? user?.phone ?? '');

      if (profileChanged) {
        await api.put('/users/me', { firstName, lastName, email, phoneNumber });
      }

      const newUsername = username.trim().toLowerCase();
      if (newUsername && !user?.username) {
        await api.patch('/users/me/username', { username: newUsername });
      }

      await refreshUser();
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Profile" showBack>
      <div className="py-4 space-y-6">
        {/* Avatar + Name Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 pb-2"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">{displayName}</h1>
            {user?.username && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <AtSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.username}</span>
              </div>
            )}
          </div>
          <Badge variant={kycConfig.variant}>{kycConfig.label}</Badge>
        </motion.div>

        {/* Wallet Address */}
        {user?.walletAddress && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Wallet Address</p>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono flex-1 break-all text-foreground leading-relaxed">
                    {user.walletAddress}
                  </span>
                  <button
                    onClick={copyWallet}
                    className="shrink-0 p-1.5 rounded-md hover:bg-secondary transition-colors mt-0.5"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-sm">Personal Details</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john_doe"
                  disabled={!!user?.username}
                />
                {user?.username && (
                  <p className="text-xs text-muted-foreground">Username cannot be changed once set.</p>
                )}
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
