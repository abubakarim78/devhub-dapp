import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContract } from "../hooks/useContract";
import { motion, AnimatePresence } from "framer-motion";

type FormData = {
  title: string;
  shortSummary: string;
  description: string;
  category: string;
  experienceLevel: string;
  budgetMin: number;
  budgetMax: number;
  timelineWeeks: number;
  requiredSkills: string[];
  visibility: string;
  applicationsStatus: string;
  devhubMessagesEnabled: boolean;
  attachmentsWalrusBlobIds: string[];
  // New fields to match the design
  keyDeliverables: string;
  complexityLevel: string;
  paymentModel: string;
  preferredStartWindow: string;
  niceToHaveSkills: string[];
  repoOrSpecLink: string;
  applicationType: string;
  finalNotes: string;
};

const initialForm: FormData = {
  title: "",
  shortSummary: "",
  description: "",
  category: "General",
  experienceLevel: "Intermediate",
  budgetMin: 0,
  budgetMax: 0,
  timelineWeeks: 0,
  requiredSkills: [],
  visibility: "Public",
  applicationsStatus: "Open",
  devhubMessagesEnabled: true,
  attachmentsWalrusBlobIds: [],
  keyDeliverables: "",
  complexityLevel: "Medium",
  paymentModel: "Fixed / Hourly / Milestone",
  preferredStartWindow: "Flexible",
  niceToHaveSkills: [],
  repoOrSpecLink: "",
  applicationType: "Open applications & proposals",
  finalNotes: "",
};

const CATEGORIES = [
  "Mobile / Web / Product / App",
  "General",
  "Web3",
  "DeFi",
  "NFT",
  "Gaming",
  "Infrastructure",
  "Tools",
];

const CUSTOM_CATEGORY = "Custom";

export default function CreateProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [skillInput, setSkillInput] = useState("");
  const [niceToHaveInput, setNiceToHaveInput] = useState("");
  
  // Initialize custom category state
  const initialCategory = form.category || "General";
  const isInitiallyCustom = !CATEGORIES.includes(initialCategory);
  const [isCustomCategory, setIsCustomCategory] = useState(isInitiallyCustom);
  const [customCategory, setCustomCategory] = useState(isInitiallyCustom ? initialCategory : "");
  
  const { uploadToWalrus, walrusUploading, walrusProgress } = useContract();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputId = "project-attachments-input";
  const [attachments, setAttachments] = useState<{
    id: string;
    file: File;
    previewUrl: string | null;
    uploading: boolean;
    blobId?: string;
    error?: string;
  }[]>([]);

  const set = (k: keyof FormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (form.requiredSkills.includes(v)) return;
    set("requiredSkills", [...form.requiredSkills, v]);
    setSkillInput("");
  };

  const removeSkill = (v: string) => {
    set("requiredSkills", form.requiredSkills.filter((s) => s !== v));
  };

  const addNiceToHave = () => {
    const v = niceToHaveInput.trim();
    if (!v) return;
    if (form.niceToHaveSkills.includes(v)) return;
    set("niceToHaveSkills", [...form.niceToHaveSkills, v]);
    setNiceToHaveInput("");
  };

  const removeNiceToHave = (v: string) => {
    set("niceToHaveSkills", form.niceToHaveSkills.filter((s) => s !== v));
  };

  const removeAttachment = (v: string) => {
    set(
      "attachmentsWalrusBlobIds",
      form.attachmentsWalrusBlobIds.filter((id) => id !== v),
    );
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      uploading: false,
    }));
    setAttachments((prev) => [...prev, ...items]);
  };

  const uploadSingleAttachment = async (id: string) => {
    const idx = attachments.findIndex((a) => a.id === id);
    if (idx === -1) return;
    setAttachments((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], uploading: true, error: undefined };
      return copy;
    });
    try {
      const { blob } = await uploadToWalrus(attachments[idx].file);
      setAttachments((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], uploading: false, blobId: blob.blobId };
        return copy;
      });
      set(
        "attachmentsWalrusBlobIds",
        [...form.attachmentsWalrusBlobIds, blob.blobId],
      );
    } catch (e: any) {
      setAttachments((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], uploading: false, error: e?.message || "Upload failed" };
        return copy;
      });
    }
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFilesSelected(e.dataTransfer.files);
  };

  const canContinue =
    form.title.trim() &&
    form.shortSummary.trim() &&
    form.description.trim() &&
    form.category.trim() &&
    form.experienceLevel.trim() &&
    form.budgetMax >= form.budgetMin &&
    form.timelineWeeks > 0;

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <main>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Create a new project
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                      Define scope, budget, and requirements so builders can quickly understand and apply.
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      className="px-4 py-2 rounded-lg bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-all duration-200 hover:shadow-md"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-muted/80 hover:bg-muted text-foreground/80 transition-all duration-200 hover:shadow-md"
                      onClick={() => navigate("/projects/review", { state: { form } })}
                    >
                      Save draft
                    </button>
                    <button
                      disabled={!canContinue}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        canContinue
                          ? "bg-gradient-to-r from-primary to-blue-500 text-white hover:shadow-lg hover:shadow-primary/50 hover:scale-105"
                          : "bg-muted text-foreground/50 cursor-not-allowed"
                      }`}
                      onClick={() =>
                        navigate("/projects/review", {
                          state: { form: { ...form, attachmentsCount: form.attachmentsWalrusBlobIds.length } },
                        })
                      }
                    >
                      Publish project
                    </button>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content - Left Side */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Project Overview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Project overview
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start with a crisp, clear description of what this project is about.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Project title</label>
                          <input
                            className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="e.g., 'Sui Wallet Port Card'"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Short summary</label>
                          <input
                            className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="One sentence that explains what this project is about"
                            value={form.shortSummary}
                            onChange={(e) => set("shortSummary", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Full description</label>
                          <textarea
                            className="w-full min-h-[140px] bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Describe the context, goals, and success criteria for this project"
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Category</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={isCustomCategory ? CUSTOM_CATEGORY : (form.category || CATEGORIES[0])}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === CUSTOM_CATEGORY) {
                                  setIsCustomCategory(true);
                                  setCustomCategory(form.category || "");
                                } else {
                                  setIsCustomCategory(false);
                                  set("category", value);
                                  setCustomCategory("");
                                }
                              }}
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              <option value={CUSTOM_CATEGORY}>Custom...</option>
                            </select>
                            <AnimatePresence>
                              {isCustomCategory && (
                                <motion.input
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-full mt-2 bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                  placeholder="Enter custom category"
                                  value={customCategory}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setCustomCategory(value);
                                    set("category", value);
                                  }}
                                  autoFocus
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Scope & Deliverables */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.15 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Scope & deliverables
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Outline what success looks like and any key constraints.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Key deliverables</label>
                          <textarea
                            className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            placeholder="List 2-5 concrete outputs (e.g., 'functional web app', 'smart contract audit', 'design mockups')"
                            value={form.keyDeliverables}
                            onChange={(e) => set("keyDeliverables", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Complexity level</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={form.complexityLevel}
                              onChange={(e) => set("complexityLevel", e.target.value)}
                            >
                              <option>Low</option>
                              <option>Medium</option>
                              <option>High</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Preferred experience</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={form.experienceLevel}
                              onChange={(e) => set("experienceLevel", e.target.value)}
                            >
                              <option>Beginner</option>
                              <option>Intermediate</option>
                              <option>Expert</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">State</label>
                            <input
                              className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              placeholder="e.g., in a codebase"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Budget & Timeline */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Budget & timeline
                      </h2>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Budget range</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <input
                                  className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                  type="number"
                                  min={0}
                                  placeholder="Min"
                                  value={form.budgetMin || ""}
                                  onChange={(e) => set("budgetMin", Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <input
                                  className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                  type="number"
                                  min={0}
                                  placeholder="Max"
                                  value={form.budgetMax || ""}
                                  onChange={(e) => set("budgetMax", Number(e.target.value))}
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              ${form.budgetMin?.toLocaleString('en-US') || '0'} - ${form.budgetMax?.toLocaleString('en-US') || '0'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Payment model</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={form.paymentModel}
                              onChange={(e) => set("paymentModel", e.target.value)}
                            >
                              <option>Fixed / Hourly / Milestone</option>
                              <option>Fixed</option>
                              <option>Hourly</option>
                              <option>Milestone</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Estimated timeline</label>
                            <input
                              className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              type="number"
                              min={0}
                              placeholder="e.g., 8 weeks"
                              value={form.timelineWeeks || ""}
                              onChange={(e) => set("timelineWeeks", Number(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{form.timelineWeeks || 0} weeks</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Preferred start window</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={form.preferredStartWindow}
                              onChange={(e) => set("preferredStartWindow", e.target.value)}
                            >
                              <option>Flexible</option>
                              <option>Immediately</option>
                              <option>Within 2 weeks</option>
                              <option>Within 1 month</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Skills & Tags */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.25 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Skills & tags
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Help developers identify if they're a fit.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Core skills</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              placeholder="e.g., 'Move', 'Rust', 'Frontend & benchmarking', 'TypeScript'"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addSkill();
                                }
                              }}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-1.5"
                              onClick={addSkill}
                            >
                              <span>Add skill</span>
                            </motion.button>
                          </div>
                          {form.requiredSkills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {form.requiredSkills.map((s) => (
                                <motion.span
                                  key={s}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="px-3 py-1.5 text-sm rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 text-foreground border border-primary/30 flex items-center gap-2"
                                >
                                  {s}
                                  <button
                                    className="text-foreground/60 hover:text-foreground transition-colors"
                                    onClick={() => removeSkill(s)}
                                  >
                                    ×
                                  </button>
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Nice-to-have (optional)</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              placeholder="e.g., 'GraphQL', 'distributed systems'"
                              value={niceToHaveInput}
                              onChange={(e) => setNiceToHaveInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addNiceToHave();
                                }
                              }}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-5 py-2.5 bg-secondary/80 hover:bg-secondary text-secondary-foreground font-medium rounded-lg transition-all"
                              onClick={addNiceToHave}
                            >
                              Add
                            </motion.button>
                          </div>
                          {form.niceToHaveSkills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {form.niceToHaveSkills.map((s) => (
                                <motion.span
                                  key={s}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="px-3 py-1.5 text-sm rounded-full bg-muted/60 text-foreground/80 border border-border flex items-center gap-2"
                                >
                                  {s}
                                  <button
                                    className="text-foreground/60 hover:text-foreground transition-colors"
                                    onClick={() => removeNiceToHave(s)}
                                  >
                                    ×
                                  </button>
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Links, Attachments & Visibility */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Links, attachments & visibility
                      </h2>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Repo/spec link (optional)</label>
                            <input
                              className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              placeholder="https://github.com"
                              value={form.repoOrSpecLink}
                              onChange={(e) => set("repoOrSpecLink", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Additional contact link</label>
                            <input
                              className="w-full bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              placeholder="Twitter, docs, dashboard, or design"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">Attach files (optional)</label>
                          <div
                            className={`w-full border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-all duration-200 ${
                              isDragging ? "border-primary/60 bg-primary/5" : "border-border bg-background/30 hover:bg-background/50"
                            }`}
                            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={onDrop}
                            onClick={() => document.getElementById(fileInputId)?.click()}
                          >
                            <div className="text-center">
                              <div className="text-4xl mb-2">📎</div>
                              <p className="text-sm text-muted-foreground">
                                {isDragging ? "Drop files here..." : "Upload new, reference, or supporting docs"}
                              </p>
                              {walrusUploading && walrusProgress && (
                                <p className="text-xs mt-2 text-primary">{walrusProgress}</p>
                              )}
                            </div>
                            <input
                              id={fileInputId}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => handleFilesSelected(e.target.files)}
                            />
                          </div>
                          
                          {/* Attachment Previews */}
                          {attachments.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {attachments.map((att) => (
                                <div key={att.id} className="flex items-center gap-3 bg-background/60 border border-border rounded-lg p-3 hover:bg-background/80 transition-colors">
                                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted/50 flex items-center justify-center flex-shrink-0">
                                    {att.previewUrl ? (
                                      <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">File</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate text-foreground font-medium" title={att.file.name}>{att.file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(att.file.size / 1024).toFixed(1)} KB</p>
                                    {att.error && <p className="text-xs text-destructive mt-1">{att.error}</p>}
                                    {att.blobId && <p className="text-xs text-green-500 mt-1">✓ Uploaded</p>}
                                  </div>
                                  {!att.blobId ? (
                                    <button
                                      className="px-3 py-1.5 bg-primary/80 hover:bg-primary text-primary-foreground text-sm rounded-md disabled:opacity-50 transition-all"
                                      disabled={att.uploading}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        uploadSingleAttachment(att.id);
                                      }}
                                    >
                                      {att.uploading ? '...' : 'Upload'}
                                    </button>
                                  ) : (
                                    <button
                                      className="px-2 py-1 text-xs bg-secondary/60 hover:bg-secondary text-secondary-foreground rounded-md transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeAttachment(att.blobId!);
                                      }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Already uploaded (from state) */}
                          {form.attachmentsWalrusBlobIds.length > 0 && attachments.length === 0 && (
                            <div className="mt-3 space-y-2">
                              {form.attachmentsWalrusBlobIds.map((id) => (
                                <div key={id} className="flex items-center justify-between text-sm bg-background/60 border border-border rounded-lg px-3 py-2">
                                  <span className="truncate mr-2 text-foreground">{id}</span>
                                  <button className="text-xs text-destructive hover:text-destructive/80" onClick={() => removeAttachment(id)}>Remove</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Who can see this project?</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={form.visibility}
                              onChange={(e) => set("visibility", e.target.value)}
                            >
                              <option>Public</option>
                              <option>Private</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">Application type</label>
                            <select
                              className="w-full bg-background/60 text-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              value={form.applicationType}
                              onChange={(e) => set("applicationType", e.target.value)}
                            >
                              <option>Open applications & proposals</option>
                              <option>Invite only</option>
                              <option>Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Final Notes */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.35 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-foreground">
                        Final notes for applicants
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Expectations, communication, or constraints
                      </p>
                      <textarea
                        className="w-full min-h-[120px] bg-background/60 text-foreground placeholder-muted-foreground border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                        placeholder="Share any final feedback, application preferences, and any final constraints"
                        value={form.finalNotes}
                        onChange={(e) => set("finalNotes", e.target.value)}
                      />
                    </motion.div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    {/* How This Works */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 shadow-lg"
                    >
                      <h3 className="text-sm font-semibold mb-3 text-foreground">How this works</h3>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex gap-3">
                          <span className="text-primary font-bold">1.</span>
                          <p>Projects are published to our builders community. Developers can browse and apply.</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-primary font-bold">2.</span>
                          <p>Applicants describe their approach and submit proposals from your project page.</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-primary font-bold">3.</span>
                          <p>Review proposals and proposals from your project board.</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Snapshot Preview */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.25 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg"
                    >
                      <h3 className="text-sm font-semibold mb-3 text-foreground">Snapshot preview</h3>
                      <div className="space-y-3">
                        <div className="bg-background/60 rounded-lg p-4 border border-border">
                          <p className="text-sm font-medium text-foreground mb-1">
                            {form.title || "Sui Wallet Port Card"}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Budget</span>
                              <span className="text-foreground font-medium">
                                ${form.budgetMin?.toLocaleString('en-US') || '5k'} - ${form.budgetMax?.toLocaleString('en-US') || '8.2k'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Timeline</span>
                              <span className="text-foreground font-medium">{form.timelineWeeks || 6} weeks</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20">
                            {form.requiredSkills[0] || "Rust"}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20">
                            {form.requiredSkills[1] || "Move"}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-md bg-muted/60 text-muted-foreground">
                            {form.requiredSkills[2] || "Testing"}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tips for Better Matches */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg"
                    >
                      <h3 className="text-sm font-semibold mb-3 text-foreground">Tips for better matches</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Be specific about requirements and constraints</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Provide clear deliverables and success criteria</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Set a realistic budget and timeline</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-500">✓</span>
                          <span>Include relevant documentation or references</span>
                        </li>
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
          </main>
        </div>
    </div>
  );
}
