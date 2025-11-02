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
};

const CATEGORIES = [
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
  
  // Initialize custom category state
  // Check if initial category is custom (not in predefined list)
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
    <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <main>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Post a Project</h1>
                    <p className="text-muted-foreground mt-2">Describe your opportunity and invite developers to apply.</p>
                  </div>
                  <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-muted text-foreground/80"
              onClick={() => navigate("/projects/review", { state: { form } })}
            >
              Save Draft
            </button>
            <button
              disabled={!canContinue}
              className={`px-4 py-2 rounded-md ${
                canContinue
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/50 cursor-not-allowed"
              }`}
              onClick={() =>
                navigate("/projects/review", {
                  state: { form: { ...form, attachmentsCount: form.attachmentsWalrusBlobIds.length } },
                })
              }
            >
              Continue
            </button>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Project Title</label>
                  <input
                    className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
                    placeholder="e.g., Sui Grants Portal"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Short Summary</label>
                  <input
                    className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
                    placeholder="One-liner that explains the goal"
                    value={form.shortSummary}
                    onChange={(e) => set("shortSummary", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    className="w-full min-h-[120px] bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
                    placeholder="Describe scope, context, milestones, and deliverables..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Category</label>
                    <select
                      className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2"
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
                          className="w-full mt-2 bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
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
                  <div>
                    <label className="block text-sm mb-1">Experience Level</label>
                    <select
                      className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2"
                      value={form.experienceLevel}
                      onChange={(e) => set("experienceLevel", e.target.value)}
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Budget Min ($)</label>
                    <input
                      className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
                      type="number"
                      min={0}
                      value={form.budgetMin}
                      onChange={(e) => set("budgetMin", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Budget Max ($)</label>
                    <input
                      className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
                      type="number"
                      min={0}
                      value={form.budgetMax}
                      onChange={(e) => set("budgetMax", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Timeline (weeks)</label>
                    <input
                      className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2"
                      type="number"
                      min={0}
                      value={form.timelineWeeks}
                      onChange={(e) => set("timelineWeeks", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Required Skills</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 max-w-xs bg-background border border-border rounded-md px-3 py-2"
                      placeholder="Enter a skill"
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
                      className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      onClick={addSkill}
                    >
                      <span>Add</span>
                      <span className="text-lg">+</span>
                    </motion.button>
                  </div>
                  {form.requiredSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.requiredSkills.map((s) => (
                        <span key={s} className="px-2 py-1 text-sm rounded-full bg-muted text-foreground">
                          {s}
                          <button className="ml-2 text-xs" onClick={() => removeSkill(s)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1">Attachments</label>
                  <div
                    className={`w-full border rounded-xl px-4 py-6 cursor-pointer transition-colors ${
                      isDragging ? "border-primary/60 bg-primary/5" : "border-border bg-input"
                    }`}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={onDrop}
                    onClick={() => document.getElementById(fileInputId)?.click()}
                  >
                    <p className="text-sm text-muted-foreground">Drop files or click to upload</p>
                    {walrusUploading && walrusProgress && (
                      <p className="text-xs mt-2 text-foreground/80">{walrusProgress}</p>
                    )}
                    <input
                      id={fileInputId}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFilesSelected(e.target.files)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Add specs, wireframes, or references.</p>
                  {/* Previews */}
                  {attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-3 bg-card/60 border border-border rounded-lg p-3">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {att.previewUrl ? (
                              <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-muted-foreground">{att.file.type || 'file'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate" title={att.file.name}>{att.file.name}</p>
                            <p className="text-xs text-muted-foreground">{(att.file.size / 1024).toFixed(1)} KB</p>
                            {att.error && <p className="text-xs text-destructive mt-1">{att.error}</p>}
                            {att.blobId && <p className="text-xs text-foreground/80 mt-1 truncate" title={att.blobId}>Blob: {att.blobId}</p>}
                          </div>
                          {!att.blobId ? (
                            <button
                              className="px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                              disabled={att.uploading}
                              onClick={() => uploadSingleAttachment(att.id)}
                            >
                              {att.uploading ? 'Uploading...' : 'Upload'}
                            </button>
                          ) : (
                            <button
                              className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                              onClick={() => removeAttachment(att.blobId!)}
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
                    <div className="mt-3 space-y-1">
                      {form.attachmentsWalrusBlobIds.map((id) => (
                        <div key={id} className="flex items-center justify-between text-sm bg-muted text-foreground rounded px-2 py-1">
                          <span className="truncate mr-2">{id}</span>
                          <button className="text-xs" onClick={() => removeAttachment(id)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6">
              <h3 className="text-sm font-medium mb-3">Visibility & Access</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Who can view</span>
                  <select
                    className="bg-background text-foreground border border-border rounded-md px-2 py-1"
                    value={form.visibility}
                    onChange={(e) => set("visibility", e.target.value)}
                  >
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span>Allow Applications</span>
                  <select
                    className="bg-background text-foreground border border-border rounded-md px-2 py-1"
                    value={form.applicationsStatus}
                    onChange={(e) => set("applicationsStatus", e.target.value)}
                  >
                    <option>Open</option>
                    <option>Closed</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span>Communication</span>
                  <select
                    className="bg-background text-foreground border border-border rounded-md px-2 py-1"
                    value={form.devhubMessagesEnabled ? "DevHub Messages" : "Off"}
                    onChange={(e) => set("devhubMessagesEnabled", e.target.value === "DevHub Messages")}
                  >
                    <option>DevHub Messages</option>
                    <option>Off</option>
                  </select>
                </div>
              </div>
                    </div>
                  </div>
                </div>
              </motion.div>
          </main>
        </div>
    </div>
  );
}


