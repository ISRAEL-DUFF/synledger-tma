import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import WebApp from '@twa-dev/sdk';

export default function Auth() {
  const [isTelegram, setIsTelegram] = useState(true);

  useEffect(() => {
    // Basic check if it's inside Telegram
    if (!WebApp.initData) {
      setIsTelegram(false);
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
        <span className="text-primary-foreground font-bold text-3xl">S</span>
      </div>

      {isTelegram ? (
        <div className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Authenticating...</h1>
          <p className="text-muted-foreground text-sm max-w-[250px]">
            Securely connecting to your Synledger wallet via Telegram.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-sm">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
            <span className="text-destructive text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            Please launch this Mini App directly from the Synledger Telegram Bot to safely access your wallet.
          </p>
        </div>
      )}
    </div>
  );
}
