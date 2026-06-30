"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  connectMeta,
  connectVercelAnalytics,
  disconnectIntegration,
  fetchMetaPages,
  getVercelDrainInfo,
  syncReachIntegration,
  validateMetaToken,
  type IntegrationView,
} from "@/lib/actions/integrations";
import type { ReachChannelConfig } from "@/lib/reach-channels";
import { EYEBROW, INPUT_SURFACE, SURFACE_WELL } from "@/lib/ui-patterns";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type ReachIntegrationPanelProps = {
  channel: ReachChannelConfig;
  integration?: IntegrationView;
  onConnected?: () => void;
};

export function ReachIntegrationPanel({
  channel,
  integration,
  onConnected,
}: ReachIntegrationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [igUserId, setIgUserId] = useState("");
  const [adAccounts, setAdAccounts] = useState<
    Array<{ id: string; name: string; account_id: string }>
  >([]);
  const [pages, setPages] = useState<
    Array<{ id: string; name: string; instagram_business_account?: { id: string } }>
  >([]);
  const [drainInfo, setDrainInfo] = useState<{
    webhookUrl: string;
    drainSecret: string;
  } | null>(null);

  const provider =
    channel.id === "website"
      ? "vercel-analytics"
      : channel.id === "facebook" || channel.id === "instagram"
        ? "meta"
        : null;

  const status = integration?.provider === provider ? integration : undefined;

  useEffect(() => {
    if (channel.id === "website" && status?.status === "connected") {
      getVercelDrainInfo().then((info) => {
        if (info) setDrainInfo({ webhookUrl: info.webhookUrl, drainSecret: info.drainSecret });
      });
    }
  }, [channel.id, status?.status]);

  if (!provider) {
    if (channel.id === "x") {
      return (
        <div className={cn(SURFACE_WELL, "px-4 py-3 text-sm text-muted-foreground")}>
          Połączenie API X wymaga Premium. Na razie loguj zasięgi ręcznie w sekcji organicznej.
        </div>
      );
    }
    return null;
  }

  function handleValidateToken() {
    if (!accessToken.trim()) return;
    startTransition(async () => {
      try {
        const accounts = await validateMetaToken(accessToken.trim());
        const pageList = await fetchMetaPages(accessToken.trim());
        setAdAccounts(accounts);
        setPages(pageList);
        if (accounts[0]) setAdAccountId(accounts[0].account_id);
        if (pageList[0]) {
          setPageId(pageList[0].id);
          if (pageList[0].instagram_business_account?.id) {
            setIgUserId(pageList[0].instagram_business_account.id);
          }
        }
        toast.success("Token zaakceptowany");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się zweryfikować tokena",
        );
      }
    });
  }

  function handleConnectMeta() {
    startTransition(async () => {
      try {
        await connectMeta({
          accessToken: accessToken.trim(),
          adAccountId,
          pageId: pageId || undefined,
          igUserId: igUserId || undefined,
        });
        toast.success("Połączono Meta Business");
        onConnected?.();
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się połączyć",
        );
      }
    });
  }

  function handleConnectVercel() {
    startTransition(async () => {
      try {
        const result = await connectVercelAnalytics();
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const orgId = drainInfo?.webhookUrl.match(/org=([^&]+)/)?.[1] ?? "";
        setDrainInfo({
          webhookUrl: `${baseUrl}/api/webhooks/vercel-analytics?org=${orgId}&secret=${result.drainSecret}`,
          drainSecret: result.drainSecret,
        });
        const info = await getVercelDrainInfo();
        if (info) {
          setDrainInfo({
            webhookUrl: info.webhookUrl,
            drainSecret: info.drainSecret,
          });
        }
        toast.success("Drain skonfigurowany — skopiuj URL do Vercel");
        onConnected?.();
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Nie udało się skonfigurować",
        );
      }
    });
  }

  function handleSync() {
    startTransition(async () => {
      try {
        const result = await syncReachIntegration(provider!);
        toast.success("Zsynchronizowano", {
          description: `Zaktualizowano ${result.metricsUpdated} metryk`,
        });
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Sync nie powiódł się",
        );
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectIntegration(provider!);
        setDrainInfo(null);
        toast.success("Rozłączono");
        router.refresh();
      } catch {
        toast.error("Nie udało się rozłączyć");
      }
    });
  }

  if (provider === "meta") {
    return (
      <div className="space-y-4 border-t border-dna-border pt-6">
        <p className={EYEBROW}>Połączenie Meta Business</p>
        {status?.status === "connected" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Połączono
              {status.maskedToken ? ` · token ${status.maskedToken}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSync} disabled={isPending}>
                {isPending ? "Sync..." : "Sync teraz"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                disabled={isPending}
              >
                Rozłącz
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="meta-token" className={EYEBROW}>
                Access token
              </Label>
              <Input
                id="meta-token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAG..."
                className={cn(INPUT_SURFACE, "font-mono text-xs")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleValidateToken}
              disabled={isPending || !accessToken.trim()}
            >
              Zweryfikuj token
            </Button>
            {adAccounts.length > 0 && (
              <div className="space-y-2">
                <Label className={EYEBROW}>Konto reklamowe</Label>
                <select
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  className={cn(INPUT_SURFACE, "h-9 w-full rounded-md px-3 text-sm")}
                >
                  {adAccounts.map((acc) => (
                    <option key={acc.id} value={acc.account_id}>
                      {acc.name} ({acc.account_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {pages.length > 0 && (
              <div className="space-y-2">
                <Label className={EYEBROW}>Strona Facebook</Label>
                <select
                  value={pageId}
                  onChange={(e) => {
                    setPageId(e.target.value);
                    const page = pages.find((p) => p.id === e.target.value);
                    setIgUserId(page?.instagram_business_account?.id ?? "");
                  }}
                  className={cn(INPUT_SURFACE, "h-9 w-full rounded-md px-3 text-sm")}
                >
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              type="button"
              onClick={handleConnectMeta}
              disabled={isPending || !accessToken || !adAccountId}
              style={{ backgroundColor: channel.color }}
              className="w-full border-0 text-white"
            >
              Połącz i pobierz dane
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-dna-border pt-6">
      <p className={EYEBROW}>Vercel Web Analytics Drain</p>
      {status?.status === "connected" && drainInfo ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Skopiuj URL do Vercel → Project → Drains → Web Analytics
          </p>
          <div className={cn(SURFACE_WELL, "break-all p-3 font-mono text-xs")}>
            {drainInfo.webhookUrl}
          </div>
          <p className="text-xs text-muted-foreground">
            Ruch płatny: UTM z medium cpc/ppc/paid. Reszta trafia do organicznego.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(drainInfo.webhookUrl);
                toast.success("Skopiowano URL");
              }}
            >
              Kopiuj URL
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              Rozłącz
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Wygeneruj endpoint drain i podłącz go w panelu Vercel.
          </p>
          <Button
            type="button"
            onClick={handleConnectVercel}
            disabled={isPending}
            style={{ backgroundColor: channel.color }}
            className="w-full border-0 text-white"
          >
            Skonfiguruj drain
          </Button>
        </div>
      )}
    </div>
  );
}
