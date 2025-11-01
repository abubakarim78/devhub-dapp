import { useLocation, useNavigate } from "react-router-dom";
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { createProjectTransaction, PROJECT_POSTING_FEE } from "../lib/suiClient";
import { useMemo, useState } from "react";
import StarBackground from "@/components/common/StarBackground";

export default function ReviewSubmitProject() {
  const { state } = useLocation() as { state?: { form?: any } };
  const navigate = useNavigate();
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signExecute } = useSignAndExecuteTransaction();
  const [submitting, setSubmitting] = useState(false);
  const form = state?.form;

  const estimatedFeeSui = useMemo(() => PROJECT_POSTING_FEE / 1_000_000_000, []);

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-muted-foreground">No project data found. Please fill the form first.</p>
        <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md" onClick={() => navigate("/projects/new")}>Go to Form</button>
      </div>
    );
  }

  const onSubmit = async () => {
    if (!account?.address) return;
    setSubmitting(true);
    try {
      // Fetch user's SUI coins
      const response = await fetch(`https://fullnode.testnet.sui.io:443`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getCoins',
          params: [account.address, '0x2::sui::SUI'],
        }),
      });
      const coins = await response.json();
      if (!coins.result?.data?.length) {
        throw new Error('No SUI coins found in wallet');
      }

      // Select coins to cover the project posting fee + gas
      const ESTIMATED_GAS = 1_000_000; // 1 MIST estimated gas
      const TOTAL_NEEDED = PROJECT_POSTING_FEE + ESTIMATED_GAS;
      let totalBalance = 0;
      const selectedCoins: string[] = [];
      for (const coin of coins.result.data) {
        const balance = parseInt(coin.balance);
        selectedCoins.push(coin.coinObjectId);
        totalBalance += balance;
        if (totalBalance >= TOTAL_NEEDED) break;
      }
      if (totalBalance < TOTAL_NEEDED) {
        throw new Error(`Insufficient SUI balance. Need at least ${(TOTAL_NEEDED / 1_000_000_000).toFixed(3)} SUI (${(PROJECT_POSTING_FEE / 1_000_000_000).toFixed(3)} SUI fee + gas).`);
      }

      const tx = createProjectTransaction({
        title: form.title,
        shortSummary: form.shortSummary,
        description: form.description,
        category: form.category,
        experienceLevel: form.experienceLevel,
        budgetMin: Number(form.budgetMin || 0),
        budgetMax: Number(form.budgetMax || 0),
        timelineWeeks: Number(form.timelineWeeks || 0),
        requiredSkills: form.requiredSkills || [],
        attachmentsCount: Number(form.attachmentsCount || (form.attachmentsWalrusBlobIds?.length || 0)),
        visibility: form.visibility,
        applicationsStatus: form.applicationsStatus,
        devhubMessagesEnabled: Boolean(form.devhubMessagesEnabled),
        attachmentsWalrusBlobIds: form.attachmentsWalrusBlobIds || [],
      }, selectedCoins[0]);

      await new Promise<void>((resolve, reject) => {
        signExecute(
          {
            transaction: tx,
            chain: undefined,
            options: { showEffects: true, showEvents: true },
          } as any,
          {
            onSuccess: async (res: any) => {
              try {
                await client.waitForTransaction({ digest: res.digest });
                console.log('✅ Project created, digest:', res.digest);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            onError: reject,
          },
        );
      });
      // Small delay to allow indexers/RPC to surface the new object in queries
      await new Promise((r) => setTimeout(r, 1000));
      navigate("/projects");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen w-full flex flex-col relative">
      <StarBackground />
      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 py-8 mt-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Review & Submit</h1>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md bg-muted text-foreground/80"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <button
              disabled={submitting || !account?.address}
              className={`px-4 py-2 rounded-md ${
                submitting || !account?.address
                  ? "bg-muted text-foreground/50 cursor-not-allowed"
                  : "bg-primary text-primary-foreground"
              }`}
              onClick={onSubmit}
            >
              {submitting ? "Submitting..." : "Submit & Sign"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Project Summary</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Title:</span> {form.title}</div>
              <div><span className="text-muted-foreground">Short Summary:</span> {form.shortSummary}</div>
              <div className="pt-2">
                <div className="text-muted-foreground mb-1">Description</div>
                <div className="whitespace-pre-wrap leading-relaxed">{form.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Category:</span> {form.category}</div>
                <div><span className="text-muted-foreground">Experience:</span> {form.experienceLevel}</div>
                <div><span className="text-muted-foreground">Budget:</span> ${form.budgetMin?.toLocaleString('en-US')} - ${form.budgetMax?.toLocaleString('en-US')}</div>
                <div><span className="text-muted-foreground">Timeline:</span> {form.timelineWeeks} weeks</div>
              </div>
              {Array.isArray(form.requiredSkills) && form.requiredSkills.length > 0 && (
                <div className="pt-2">
                  <div className="text-muted-foreground mb-1">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {form.requiredSkills.map((s: string) => (
                      <span key={s} className="px-2 py-1 text-sm rounded-full bg-muted">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(form.attachmentsWalrusBlobIds) && form.attachmentsWalrusBlobIds.length > 0 && (
                <div className="pt-2">
                  <div className="text-muted-foreground mb-1">Attachments</div>
                  <div className="space-y-1 text-xs">
                    {form.attachmentsWalrusBlobIds.map((id: string) => (
                      <div key={id} className="truncate">{id}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium mb-3">On-chain Actions</h3>
              <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
                <div className="font-medium mb-2">Transaction prepared</div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Project Creation Fee</span>
                  <span>{estimatedFeeSui.toFixed(2)} SUI</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Publishing To</span>
                  <span>DevHub Projects</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                You will be prompted in your wallet to review and sign. No funds are moved besides fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


