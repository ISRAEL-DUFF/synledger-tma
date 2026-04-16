import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2, Wallet } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createWithdrawalAddress,
  deleteWithdrawalAddress,
  getWithdrawalAddresses,
  type WithdrawalAddress,
  type WithdrawalAddressChain,
  type WithdrawalAddressToken,
} from "@/lib/withdrawalAddressApi";

const CHAIN_OPTIONS: Array<{ value: WithdrawalAddressChain; label: string; helper: string }> = [
  { value: "arbitrum", label: "Arbitrum", helper: "EVM" },
  { value: "base", label: "Base", helper: "EVM" },
  { value: "polygon", label: "Polygon", helper: "EVM" },
  { value: "bsc", label: "BNB Smart Chain", helper: "EVM" },
  { value: "ethereum", label: "Ethereum", helper: "EVM" },
  { value: "tron", label: "Tron", helper: "TRON" },
  { value: "solana", label: "Solana", helper: "SPL" },
];

const TOKEN_OPTIONS: WithdrawalAddressToken[] = ["USDT", "USDC"];

function getChainLabel(chain: WithdrawalAddressChain) {
  return CHAIN_OPTIONS.find((option) => option.value === chain)?.label || chain;
}

function isValidAddress(address: string, chain: WithdrawalAddressChain) {
  const value = address.trim();
  if (!value) return false;

  if (chain === "tron") {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
  }

  if (chain === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export default function WithdrawalAddresses() {
  const [addresses, setAddresses] = useState<WithdrawalAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<WithdrawalAddressChain>("arbitrum");
  const [token, setToken] = useState<WithdrawalAddressToken>("USDT");

  const selectedChain = useMemo(
    () => CHAIN_OPTIONS.find((option) => option.value === chain),
    [chain],
  );

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await getWithdrawalAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Failed to load withdrawal addresses", error);
      toast.error("Failed to load withdrawal addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const resetForm = () => {
    setLabel("");
    setAddress("");
    setChain("arbitrum");
    setToken("USDT");
  };

  const handleCreate = async () => {
    const cleanLabel = label.trim();
    const cleanAddress = address.trim();

    if (!cleanLabel) {
      toast.error("Add a label for this address");
      return;
    }

    if (!cleanAddress) {
      toast.error("Enter the wallet address");
      return;
    }

    if (!isValidAddress(cleanAddress, chain)) {
      toast.error(`That address does not match the expected ${selectedChain?.label || chain} format`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createWithdrawalAddress({
        label: cleanLabel,
        address: cleanAddress,
        chain,
        token,
      });
      setAddresses((current) => [created, ...current]);
      setDialogOpen(false);
      resetForm();
      toast.success("Withdrawal address saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save withdrawal address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteWithdrawalAddress(id);
      setAddresses((current) => current.filter((item) => item.id !== id));
      toast.success("Withdrawal address removed");
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove withdrawal address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Address copied");
    } catch {
      toast.error("Unable to copy address");
    }
  };

  return (
    <PageLayout
      title="Withdrawal Addresses"
      showBack
      rightAction={
        <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      }
    >
      <div className="space-y-6 py-6">
        <Card variant="gradient">
          <CardHeader>
            <CardTitle>Saved wallets for on-ramp auto-withdrawal</CardTitle>
            <CardDescription className="text-white/80">
              Use saved withdrawal addresses during on-ramp checkout so credited funds can move straight to your preferred external wallet.
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <Card variant="outline">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading withdrawal addresses...</CardContent>
          </Card>
        ) : addresses.length === 0 ? (
          <Card variant="outline">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">No withdrawal addresses yet</p>
                <p className="text-sm text-muted-foreground">
                  Add one now to make your on-ramp flow smoother on mobile and Telegram.
                </p>
              </div>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add your first address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((item) => (
              <Card key={item.id} variant="elevated">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">{item.label}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{getChainLabel(item.chain)}</Badge>
                        <Badge variant="outline">{item.token}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(item.address)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                    <p className="break-all font-mono text-sm text-foreground">{item.address}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => handleCopy(item.address)}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === item.id ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add withdrawal address</DialogTitle>
            <DialogDescription>
              Save a destination wallet once, then reuse it when on-ramp starts supporting full checkout in Telegram and mobile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label</label>
              <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="My Base wallet" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={chain === "tron" ? "T..." : chain === "solana" ? "Solana base58 address" : "0x..."}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Network</label>
              <div className="grid grid-cols-2 gap-2">
                {CHAIN_OPTIONS.map((option) => {
                  const selected = option.value === chain;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setChain(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs opacity-80">{option.helper}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Token</label>
              <div className="grid grid-cols-2 gap-2">
                {TOKEN_OPTIONS.map((option) => {
                  const selected = option === token;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setToken(option)}
                      className={`rounded-2xl border px-4 py-3 font-semibold transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Saving..." : "Save Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
