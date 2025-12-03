import { useLocation, useNavigate } from "react-router-dom";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useSignAndExecuteWithSponsorship } from '@/hooks/useSignAndExecuteWithSponsorship';
import { createProjectTransaction, PROJECT_POSTING_FEE, setGasPaymentForTransaction } from "../lib/suiClient";
import { useMemo, useState } from "react";

export default function ReviewSubmitProject() {
  const { state } = useLocation() as { state?: { form?: any } };
  const navigate = useNavigate();
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signExecute } = useSignAndExecuteWithSponsorship();
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
      // Fetch user's SUI coins from testnet
      const coins = await client.getCoins({
        owner: account.address,
        coinType: '0x2::sui::SUI',
        limit: 50,
      });
      
      if (!coins.data || coins.data.length === 0) {
        throw new Error('No SUI coins found in wallet');
      }

      // Select coins to cover the project posting fee + gas
      const ESTIMATED_GAS = 1_000_000; // 1 MIST estimated gas
      const TOTAL_NEEDED = PROJECT_POSTING_FEE + ESTIMATED_GAS;
      let totalBalance = BigInt(0);
      const selectedCoins: string[] = [];
      
      // Fetch fresh coins right before transaction
      const freshCoins = await client.getCoins({
        owner: account.address,
        coinType: '0x2::sui::SUI',
        limit: 50,
      });
      
      if (!freshCoins.data || freshCoins.data.length === 0) {
        throw new Error('No SUI coins found in wallet');
      }
      
      for (const coin of freshCoins.data) {
        const balance = BigInt(coin.balance);
        selectedCoins.push(coin.coinObjectId);
        totalBalance += balance;
        if (totalBalance >= BigInt(TOTAL_NEEDED)) break;
      }
      
      if (totalBalance < BigInt(TOTAL_NEEDED)) {
        throw new Error(`Insufficient SUI balance. Need at least ${(TOTAL_NEEDED / 1_000_000_000).toFixed(3)} SUI (${(PROJECT_POSTING_FEE / 1_000_000_000).toFixed(3)} SUI fee + gas).`);
      }
      
      // Use the first coin with sufficient balance
      let paymentCoinId = null;
      for (const coin of freshCoins.data) {
        const balance = BigInt(coin.balance);
        if (balance >= BigInt(PROJECT_POSTING_FEE)) {
          paymentCoinId = coin.coinObjectId;
          break;
        }
      }
      
      if (!paymentCoinId) {
        throw new Error('No coin with sufficient balance found');
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
        // New fields from redesigned form
        keyDeliverables: form.keyDeliverables || '',
        complexityLevel: form.complexityLevel || 'Medium',
        paymentModel: form.paymentModel || 'Fixed / Hourly / Milestone',
        preferredStartWindow: form.preferredStartWindow || 'Flexible',
        niceToHaveSkills: form.niceToHaveSkills || [],
        repoOrSpecLink: form.repoOrSpecLink || '',
        applicationType: form.applicationType || 'Open applications & proposals',
        finalNotes: form.finalNotes || '',
      }, paymentCoinId);

      // Explicitly set gas payment coins (excluding the payment coin)
      // Pass paymentCoinId so we can handle single-coin scenarios
      await setGasPaymentForTransaction(tx, client, account.address, [paymentCoinId], paymentCoinId);

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
      navigate("/opportunities");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Review & Submit</h1>
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
            <h2 className="text-lg font-semibold mb-4 text-foreground">Project Summary</h2>
            <div className="space-y-4 text-sm text-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-muted-foreground font-medium">Title:</span> <span className="text-foreground">{form.title}</span></div>
                <div><span className="text-muted-foreground font-medium">Category:</span> <span className="text-foreground">{form.category}</span></div>
                <div><span className="text-muted-foreground font-medium">Experience:</span> <span className="text-foreground">{form.experienceLevel}</span></div>
                <div><span className="text-muted-foreground font-medium">Complexity:</span> <span className="text-foreground">{form.complexityLevel}</span></div>
                <div><span className="text-muted-foreground font-medium">Budget:</span> <span className="text-foreground">${form.budgetMin?.toLocaleString('en-US')} - ${form.budgetMax?.toLocaleString('en-US')}</span></div>
                <div><span className="text-muted-foreground font-medium">Payment Model:</span> <span className="text-foreground">{form.paymentModel}</span></div>
                <div><span className="text-muted-foreground font-medium">Timeline:</span> <span className="text-foreground">{form.timelineWeeks} weeks</span></div>
                <div><span className="text-muted-foreground font-medium">Start Window:</span> <span className="text-foreground">{form.preferredStartWindow}</span></div>
                <div><span className="text-muted-foreground font-medium">Application Type:</span> <span className="text-foreground">{form.applicationType}</span></div>
                <div><span className="text-muted-foreground font-medium">Visibility:</span> <span className="text-foreground">{form.visibility}</span></div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="text-muted-foreground font-medium mb-1">Short Summary</div>
                <div className="text-foreground">{form.shortSummary}</div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="text-muted-foreground font-medium mb-1">Description</div>
                <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{form.description}</div>
              </div>

              {form.keyDeliverables && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-muted-foreground font-medium mb-1">Key Deliverables</div>
                  <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{form.keyDeliverables}</div>
                </div>
              )}

              {(Array.isArray(form.requiredSkills) && form.requiredSkills.length > 0) || (Array.isArray(form.niceToHaveSkills) && form.niceToHaveSkills.length > 0) ? (
                <div className="pt-2 border-t border-border/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(form.requiredSkills) && form.requiredSkills.length > 0 && (
                      <div>
                        <div className="text-muted-foreground font-medium mb-2 text-xs sm:text-sm">Required Skills</div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {form.requiredSkills.map((s: string) => (
                            <span key={s} className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(form.niceToHaveSkills) && form.niceToHaveSkills.length > 0 && (
                      <div>
                        <div className="text-muted-foreground font-medium mb-2 text-xs sm:text-sm">Nice-to-have Skills</div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {form.niceToHaveSkills.map((s: string) => (
                            <span key={s} className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full bg-muted text-muted-foreground border border-border">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {form.repoOrSpecLink && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-muted-foreground font-medium mb-1">Repo / Spec Link</div>
                  <a href={form.repoOrSpecLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{form.repoOrSpecLink}</a>
                </div>
              )}

              {form.finalNotes && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-muted-foreground font-medium mb-1">Final Notes</div>
                  <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{form.finalNotes}</div>
                </div>
              )}

              {Array.isArray(form.attachmentsWalrusBlobIds) && form.attachmentsWalrusBlobIds.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-muted-foreground font-medium mb-1">Attachments (Walrus Blob IDs)</div>
                  <div className="space-y-1 text-xs font-mono bg-muted/50 p-3 rounded-lg border border-border/50">
                    {form.attachmentsWalrusBlobIds.map((id: string) => (
                      <div key={id} className="truncate text-foreground/80">{id}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="bg-card/70 backdrop-blur-xl border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
              <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-foreground">On-chain Actions</h3>
              <div className="rounded-md border border-primary/30 bg-primary/10 p-2.5 sm:p-3 text-xs sm:text-sm">
                <div className="font-medium mb-2 text-primary">Transaction prepared</div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Project Creation Fee</span>
                  <span className="text-foreground font-medium">{estimatedFeeSui.toFixed(2)} SUI</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Publishing To</span>
                  <span className="text-foreground font-medium">BountyLink Projects</span>
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


