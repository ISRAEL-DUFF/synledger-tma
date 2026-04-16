import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { useRemittance } from "@/hooks/useRemittance";
import { RecipientSelector } from "@/components/remittance/RecipientSelector";
import { AmountInput } from "@/components/remittance/AmountInput";
import { TransferConfirmation } from "@/components/remittance/TransferConfirmation";
import { TransferSuccess } from "@/components/remittance/TransferSuccess";
import { AddRecipientForm } from "@/components/remittance/AddRecipientForm";
import type { SavedRecipient, RemittanceTransaction } from "@/lib/remittanceData";
import { toast } from "sonner";

type Step = "recipient" | "add-recipient" | "amount" | "confirm" | "success";

export default function Remittance() {
  const navigate = useNavigate();
  const {
    recipients,
    exchangeRates,
    refreshExchangeRates,
    calculateConversion,
    calculateFee,
    validateAmount,
    limits,
    addRecipient,
    deleteRecipient,
    createTransaction,
    isLoading,
  } = useRemittance();

  const [step, setStep] = useState<Step>("recipient");
  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);
  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState<"USDT" | "USDC">("USDT");
  const [note, setNote] = useState<string | undefined>();
  const [transaction, setTransaction] = useState<RemittanceTransaction | null>(null);

  const handleSelectRecipient = (recipient: SavedRecipient) => {
    setSelectedRecipient(recipient);
    setStep("amount");
  };

  const handleAmountContinue = (amt: number, tok: "USDT" | "USDC", n?: string) => {
    setAmount(amt);
    setToken(tok);
    setNote(n);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedRecipient) return;
    try {
      const tx = await createTransaction(selectedRecipient, amount, token, note);
      setTransaction(tx);
      setStep("success");
    } catch {
      toast.error("Transfer failed. Please try again.");
    }
  };

  const handleNewTransfer = () => {
    setStep("recipient");
    setSelectedRecipient(null);
    setAmount(0);
    setNote(undefined);
    setTransaction(null);
  };

  const conversion = selectedRecipient
    ? calculateConversion(amount, token)
    : null;
  const fee = calculateFee(amount);

  return (
    <PageLayout title="Diaspora Remittance" showBack onBack={() => step === "recipient" ? navigate(-1) : setStep("recipient")}>
      <div className="py-6">
        {step === "recipient" && (
          <RecipientSelector
            recipients={recipients}
            onSelect={handleSelectRecipient}
            onAddNew={() => setStep("add-recipient")}
            onDelete={(id) => deleteRecipient(id)}
          />
        )}

        {step === "add-recipient" && (
          <AddRecipientForm
            onBack={() => setStep("recipient")}
            onSave={(data) => {
              addRecipient(data);
              setStep("recipient");
            }}
          />
        )}

        {step === "amount" && selectedRecipient && (
          <AmountInput
            recipient={selectedRecipient}
            onBack={() => setStep("recipient")}
            onContinue={handleAmountContinue}
            exchangeRates={exchangeRates}
            onRefreshRates={refreshExchangeRates}
            calculateConversion={calculateConversion}
            validateAmount={validateAmount}
            limits={limits}
          />
        )}

        {step === "confirm" && selectedRecipient && conversion && (
          <TransferConfirmation
            recipient={selectedRecipient}
            amount={amount}
            token={token}
            note={note}
            conversion={conversion}
            onBack={() => setStep("amount")}
            onConfirm={handleConfirm}
            isProcessing={isLoading}
          />
        )}

        {step === "success" && transaction && (
          <TransferSuccess
            transaction={transaction}
            onNewTransfer={handleNewTransfer}
            onGoHome={() => navigate("/")}
          />
        )}
      </div>
    </PageLayout>
  );
}
