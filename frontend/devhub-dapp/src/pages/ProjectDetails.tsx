import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, Calendar, Code2, Loader2, User, Tag, Briefcase, TrendingUp, XCircle, ExternalLink, Paperclip, Image as ImageIcon, File, CheckCircle, MessageSquare } from 'lucide-react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/common/Layout';
import { PACKAGE_ID, DEVHUB_OBJECT_ID } from '@/lib/suiClient';
import { WalrusService } from '@/services/walrus';

interface Project {
  id: string;
  title: string;
  short_summary: string;
  description: string;
  category: string;
  experience_level: string;
  budget_min: number;
  budget_max: number;
  timeline_weeks: number;
  required_skills: string[];
  owner: string;
  applications_status: string;
  creation_timestamp: number;
  attachments_walrus_blob_ids?: string[];
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError("No project ID provided.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching project:', id);
        
        // First, try to get the project directly by ID
        try {
          const obj = await suiClient.getObject({
            id: id,
            options: { showContent: true, showType: true, showOwner: true }
          });
          
          if (obj.data && obj.data.content && 'fields' in obj.data.content) {
            const fields = (obj.data.content as any).fields;
            
            // Budget extraction - use exact same logic as Projects.tsx line 228-229
            const budgetMin: number = Number(fields.budget_min ?? 0);
            const budgetMax: number = Number(fields.budget_max ?? 0);
            
            const projectData: Project = {
              id: obj.data.objectId || id,
              title: fields.title || 'Untitled Project',
              short_summary: fields.short_summary || fields.shortSummary || '',
              description: fields.description || '',
              category: fields.category || 'General',
              experience_level: fields.experience_level || fields.experienceLevel || 'Unknown',
              budget_min: isNaN(budgetMin) ? 0 : budgetMin,
              budget_max: isNaN(budgetMax) ? 0 : budgetMax,
              timeline_weeks: Number(fields.timeline_weeks ?? fields.timelineWeeks ?? 0),
              required_skills: Array.isArray(fields.required_skills) 
                ? fields.required_skills.map((s: any) => String(s))
                : Array.isArray(fields.skills)
                  ? fields.skills
                  : [],
              owner: fields.owner || '',
              applications_status: fields.applications_status || fields.applicationsStatus || 'Open',
              creation_timestamp: Number(fields.creation_timestamp ?? fields.creationTimestamp ?? Date.now()),
              attachments_walrus_blob_ids: Array.isArray(fields.attachments_walrus_blob_ids)
                ? fields.attachments_walrus_blob_ids.map((id: any) => String(id))
                : [],
            };
            
            setProject(projectData);
            setLoading(false);
            return;
          }
        } catch (directError: any) {
          console.log('⚠️ Direct fetch failed, trying table lookup...', directError?.message);
        }
        
        // If direct fetch fails, query from the projects table in DevHub
        try {
          const devhubObj = await suiClient.getObject({
            id: DEVHUB_OBJECT_ID,
            options: { showContent: true, showType: true, showOwner: true }
          });
          
          if (devhubObj.data?.content && 'fields' in devhubObj.data.content) {
            const devhubFields = (devhubObj.data.content as any).fields;
            
            if (devhubFields.projects) {
              let projectsTableId: string;
              let idValue: any;
              
              if (devhubFields.projects.fields && devhubFields.projects.fields.id) {
                idValue = devhubFields.projects.fields.id;
              } else if (devhubFields.projects.id) {
                idValue = devhubFields.projects.id;
              } else {
                throw new Error('Projects table structure not recognized');
              }
              
              if (typeof idValue === 'object' && idValue !== null) {
                if (idValue.id) {
                  projectsTableId = String(idValue.id);
                } else if (idValue.objectId) {
                  projectsTableId = String(idValue.objectId);
                } else {
                  const keys = Object.keys(idValue);
                  const possibleId = keys.find(k => 
                    typeof idValue[k] === 'string' && 
                    idValue[k].startsWith('0x')
                  );
                  if (possibleId) {
                    projectsTableId = String(idValue[possibleId]);
                  } else {
                    throw new Error('Cannot extract table ID');
                  }
                }
              } else if (typeof idValue === 'string') {
                projectsTableId = idValue;
              } else {
                throw new Error('Cannot extract table ID');
              }
              
              // Query all dynamic fields on the table
              const tableDynamicFields = await suiClient.getDynamicFields({
                parentId: projectsTableId,
                limit: 200
              });
              
              // First, get all events to map project IDs
              const events = await suiClient.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::devhub::ProjectCreated` },
                limit: 100,
              });
              
              console.log('📋 Searching through', tableDynamicFields.data?.length || 0, 'dynamic fields for project ID:', id);
              
              if (tableDynamicFields.data && tableDynamicFields.data.length > 0) {
                for (const field of tableDynamicFields.data) {
                  try {
                    const fieldObj = await suiClient.getDynamicFieldObject({
                      parentId: projectsTableId,
                      name: field.name
                    });
                    
                    if (fieldObj.data && fieldObj.data.content && 'fields' in fieldObj.data.content) {
                      const type = fieldObj.data.type || '';
                      if (type.includes('Project')) {
                        // Extract fields using the exact same logic as Projects.tsx
                        const container = fieldObj.data.content as any;
                        
                        const valueNode = container.fields?.value ?? container.fields;
                        const fields = (valueNode && valueNode.fields) ? valueNode.fields : valueNode;
                        
                        if (!fields) continue;
                        
                        // Extract project data same way as Projects.tsx does
                        const title: string = fields.title || 'Untitled Project';
                        const owner: string = fields.owner || '';
                        
                        // Find matching event by owner and title (same logic as Projects.tsx)
                        const event = events.data?.find((e: any) => {
                          const parsed = e.parsedJson || e;
                          return parsed?.owner === owner && parsed?.title === title;
                        });
                        
                        // Use same ID extraction logic as Projects.tsx
                        // Get the actual project object ID from the dynamic field
                        // Priority: 1) Project's UID (fields.id.id), 2) Event's project_id, 3) Field object ID
                        const eventProjectId = event && event.parsedJson && typeof event.parsedJson === 'object'
                          ? ((event.parsedJson as any)?.project_id || (event.parsedJson as any)?.projectId)
                          : null;
                        
                        const projectObjectId = fields.id?.id || 
                                                eventProjectId || 
                                                fieldObj.data.objectId || 
                                                `table-${String(fields.id || '').slice(-8) || 'unknown'}`;
                        
                        // Normalize IDs for comparison (remove any prefixes/suffixes)
                        const normalizeId = (id: string) => {
                          if (!id) return '';
                          // Remove common prefixes and convert to lowercase
                          return String(id).toLowerCase().trim();
                        };
                        
                        // Extract all possible IDs for matching
                        const projectUid = fields.id?.id;
                        
                        const normalizedId = normalizeId(id);
                        const normalizedProjectId = normalizeId(String(projectObjectId));
                        
                        // Match by exact ID or last 8 characters
                        // Also check if any of the extracted IDs match
                        const exactMatch = normalizedProjectId === normalizedId;
                        const suffixMatch = normalizedProjectId.endsWith(normalizedId.slice(-8)) ||
                                          normalizedId.endsWith(normalizedProjectId.slice(-8));
                        
                        // Check if projectUid matches
                        const projectUidMatch = projectUid && normalizeId(String(projectUid)) === normalizedId;
                        const projectUidSuffixMatch = projectUid && (
                          normalizeId(String(projectUid)).endsWith(normalizedId.slice(-8)) ||
                          normalizedId.endsWith(normalizeId(String(projectUid)).slice(-8))
                        );
                        
                        // Check if eventProjectId matches
                        const eventIdMatch = eventProjectId && normalizeId(String(eventProjectId)) === normalizedId;
                        const eventIdSuffixMatch = eventProjectId && (
                          normalizeId(String(eventProjectId)).endsWith(normalizedId.slice(-8)) ||
                          normalizedId.endsWith(normalizeId(String(eventProjectId)).slice(-8))
                        );
                        
                        const matchesId = exactMatch || suffixMatch || projectUidMatch || projectUidSuffixMatch || eventIdMatch || eventIdSuffixMatch;
                        
                        console.log('🔍 Comparing project:', {
                          projectId: projectObjectId,
                          searchId: id,
                          normalizedProjectId,
                          normalizedId,
                          matchesId,
                          title
                        });
                        
                        if (matchesId) {
                          // Budget extraction - use exact same logic as Projects.tsx line 228-229
                          const budgetMin: number = Number(fields.budget_min ?? 0);
                          const budgetMax: number = Number(fields.budget_max ?? 0);
                          
                          const projectData: Project = {
                            id: projectObjectId,
                            title: fields.title || 'Untitled Project',
                            short_summary: fields.short_summary || '',
                            description: fields.description || '',
                            category: fields.category || 'General',
                            experience_level: fields.experience_level || 'Unknown',
                            budget_min: isNaN(budgetMin) ? 0 : budgetMin,
                            budget_max: isNaN(budgetMax) ? 0 : budgetMax,
                            timeline_weeks: Number(fields.timeline_weeks ?? 0),
                            required_skills: Array.isArray(fields.required_skills)
                              ? fields.required_skills.map((s: any) => String(s))
                              : [],
                            owner: fields.owner || '',
                            applications_status: fields.applications_status || 'Open',
                            creation_timestamp: Number(fields.creation_timestamp ?? Date.now()),
                            attachments_walrus_blob_ids: Array.isArray(fields.attachments_walrus_blob_ids)
                              ? fields.attachments_walrus_blob_ids.map((id: any) => String(id))
                              : [],
                          };
                          
                          setProject(projectData);
                          setLoading(false);
                          return;
                        }
                      }
                    }
                  } catch (fieldError: any) {
                    console.debug(`⚠️ Error processing field ${field.name}:`, fieldError?.message);
                    continue;
                  }
                }
              }
            }
          }
        } catch (tableError: any) {
          console.error('❌ Error querying from table:', tableError);
        }
        
        // If we still don't have the project, check events one more time
        // This handles the case where the ID format might be different
        try {
          const events = await suiClient.queryEvents({
            query: { MoveEventType: `${PACKAGE_ID}::devhub::ProjectCreated` },
            limit: 100,
          });
          
          const normalizeId = (id: string) => {
            if (!id) return '';
            return String(id).toLowerCase().trim();
          };
          
          const normalizedSearchId = normalizeId(id);
          
          const matchingEvent = events.data?.find((e: any) => {
            const parsed = e.parsedJson || e;
            const eventProjectId = parsed?.project_id || parsed?.projectId;
            if (!eventProjectId) return false;
            
            const normalizedEventId = normalizeId(String(eventProjectId));
            
            // Match by exact ID or last 8 characters
            return normalizedEventId === normalizedSearchId ||
                   normalizedEventId.endsWith(normalizedSearchId.slice(-8)) ||
                   normalizedSearchId.endsWith(normalizedEventId.slice(-8));
          });
          
          if (matchingEvent) {
            // We found the event but couldn't fetch the project data
            console.warn('⚠️ Found project event but could not fetch project data:', matchingEvent);
            throw new Error('Project found in events but data unavailable. The project may have been deleted.');
          }
        } catch (eventError) {
          // Ignore event errors
        }
        
        console.error('❌ Project not found after all attempts. Search ID:', id);
        throw new Error(`Project not found. ID: ${id}`);
      } catch (err: unknown) {
        console.error('Error fetching project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, suiClient]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBudget = (min: number, max: number) => {
    // Check if values are actually numbers and valid
    const minNum = Number(min);
    const maxNum = Number(max);
    
    if (isNaN(minNum) || isNaN(maxNum)) {
      return 'Not specified';
    }
    
    if (!minNum && !maxNum) {
      return 'Not specified';
    }
    
    // Budget is stored in USD dollars
    const minFormatted = minNum > 0 ? minNum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '$0';
    const maxFormatted = maxNum > 0 ? maxNum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '$0';
    
    if (minNum === maxNum && minNum > 0) {
      return minFormatted;
    }
    if (minNum > 0 || maxNum > 0) {
      return `${minFormatted} - ${maxFormatted}`;
    }
    return 'Not specified';
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Loading Project...</h2>
            <p className="text-muted-foreground">Fetching project details from the blockchain.</p>
          </motion.div>
        </div>
      </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-24 h-24 bg-destructive/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/30">
              <Briefcase className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Project Not Found</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {error || "The project you're looking for doesn't exist or could not be loaded."}
            </p>
            <Link
              to="/projects"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/25"
            >
              Browse Projects
            </Link>
          </motion.div>
        </div>
      </div>
      </Layout>
    );
  }

  const isOwner = currentAccount?.address === project.owner;
  const isOpen = project.applications_status?.toLowerCase() === 'open';

  return (
    <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Projects</span>
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h1 className="text-4xl font-bold text-foreground">{project.title}</h1>
                      <AnimatePresence>
                        {isOpen ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-sm bg-green-500/20 text-green-400 border border-green-500/30`}
                          >
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span>Open for Applications</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-sm bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg backdrop-blur-sm`}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <span>Applications Closed</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <p className="text-xl text-muted-foreground mb-6">{project.short_summary}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{project.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>{project.experience_level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formatDate(project.creation_timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  Project Description
                </h3>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </p>
              </motion.div>

              {/* Required Skills */}
              {project.required_skills && project.required_skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Code2 className="h-6 w-6 text-primary" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence>
                      {project.required_skills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all group cursor-default"
                        >
                          <span className="text-primary font-medium text-sm">{skill}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Attachments */}
              {project.attachments_walrus_blob_ids && project.attachments_walrus_blob_ids.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl shadow-primary/5"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Paperclip className="h-6 w-6 text-primary" />
                    Attachments
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {project.attachments_walrus_blob_ids.map((blobId, index) => {
                        const blobUrl = WalrusService.getBlobUrl(blobId);
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(blobId) || blobId.includes('image');
                        
                        return (
                          <motion.div
                            key={blobId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative group"
                          >
                            {isImage ? (
                              <div className="relative overflow-hidden rounded-lg border border-border bg-background/50">
                                <img
                                  src={blobUrl}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden absolute inset-0 flex items-center justify-center bg-background/80">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <a
                                  href={blobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                                >
                                  <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              </div>
                            ) : (
                              <a
                                href={blobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-background/50 border border-border rounded-lg hover:bg-accent transition-all group"
                              >
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                  <File className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">
                                    Attachment {index + 1}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {blobId.slice(0, 20)}...
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </a>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-background/50 hover:bg-accent rounded-xl transition-all border border-border">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground mb-1">Budget</div>
                      <div className="text-sm text-muted-foreground">
                        {project.budget_min > 0 || project.budget_max > 0 
                          ? formatBudget(project.budget_min, project.budget_max)
                          : 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-background/50 hover:bg-accent rounded-xl transition-all border border-border">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground mb-1">Timeline</div>
                      <div className="text-sm text-muted-foreground">
                        {project.timeline_weeks > 0 
                          ? `${project.timeline_weeks} week${project.timeline_weeks !== 1 ? 's' : ''}`
                          : 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-background/50 hover:bg-accent rounded-xl transition-all border border-border">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground mb-1">Owner</div>
                      <div className="text-sm text-muted-foreground font-mono truncate">
                        {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/5"
              >
                <div className="space-y-3">
                  {isOwner ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/dashboard-projects`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      <Briefcase className="h-5 w-5" />
                      Manage Project
                    </motion.button>
                  ) : isOpen ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Navigate to apply page or open apply modal
                        navigate(`/projects/${id}/apply`);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Apply Now
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted text-muted-foreground font-semibold rounded-lg cursor-not-allowed"
                    >
                      <XCircle className="h-5 w-5" />
                      Applications Closed
                    </motion.div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Navigate to messages or open contact modal
                      navigate(`/dashboard-messages?project=${id}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-accent transition-colors border border-border"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Message Owner
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ProjectDetails;

