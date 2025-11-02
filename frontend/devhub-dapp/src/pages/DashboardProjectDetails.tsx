import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  ArrowLeft, DollarSign, Clock, Calendar, Code2, Loader2, User, Tag, Briefcase, 
  TrendingUp, XCircle, ExternalLink, Edit2,
  Save, X, Paperclip, Image as ImageIcon, File
} from 'lucide-react';
import Layout from '@/components/common/Layout';
import { PACKAGE_ID, DEVHUB_OBJECT_ID, updateProjectTransaction } from '@/lib/suiClient';
import { WalrusService } from '@/services/walrus';

interface Project {
  id: string;
  project_id?: number; // u64 project_id from table key
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

const DashboardProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: signAndExecute, isPending: isUpdating } = useSignAndExecuteTransaction();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [skillInput, setSkillInput] = useState("");

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
        // Query events first to get project_id mapping
        const events = await suiClient.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::devhub::ProjectCreated` },
          limit: 100,
        });
        
        // Use the same fetching logic as ProjectDetails.tsx
        try {
          const obj = await suiClient.getObject({
            id: id,
            options: { showContent: true, showType: true, showOwner: true }
          });
          
          if (obj.data && obj.data.content && 'fields' in obj.data.content) {
            const fields = (obj.data.content as any).fields;
            
            // Try to find project_id from events by matching owner and title
            const title = fields.title || 'Untitled Project';
            const owner = fields.owner || '';
            const event = events.data?.find((e: any) => {
              const parsed = e.parsedJson || e;
              return parsed && typeof parsed === 'object' && 
                     parsed.owner === owner && parsed.title === title;
            });
            
            const eventProjectId = event && event.parsedJson && typeof event.parsedJson === 'object'
              ? ((event.parsedJson as any)?.project_id || (event.parsedJson as any)?.projectId)
              : undefined;
            
            const budgetMin: number = Number(fields.budget_min ?? 0);
            const budgetMax: number = Number(fields.budget_max ?? 0);
            
            const projectData: Project = {
              id: obj.data.objectId || id,
              project_id: eventProjectId ? Number(eventProjectId) : undefined,
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
            setEditedProject(projectData);
            setLoading(false);
            return;
          }
        } catch (directError: any) {
          // Fallback to table lookup
        }
        
        // Table lookup logic (same as ProjectDetails.tsx)
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
            
            const events = await suiClient.queryEvents({
              query: { MoveEventType: `${PACKAGE_ID}::devhub::ProjectCreated` },
              limit: 100,
            });
            
            const tableDynamicFields = await suiClient.getDynamicFields({
              parentId: projectsTableId,
              limit: 200
            });
            
            if (tableDynamicFields.data && tableDynamicFields.data.length > 0) {
              for (const field of tableDynamicFields.data) {
                try {
                  // Extract project_id (u64) from dynamic field name
                  // For Table<u64, T>, the name is typically { type: 'u64', value: '1' } where value can be string or number
                  let projectId: number | undefined;
                  if (field.name) {
                    if (typeof field.name === 'number') {
                      if (field.name > 0 && field.name <= 18446744073709551615) {
                        projectId = field.name;
                      }
                    } else if (typeof field.name === 'object' && field.name !== null) {
                      // Handle { type: 'u64', value: '1' } or { value: '1' } where value can be string or number
                      if ('value' in field.name) {
                        let value: any = field.name.value;
                        // Convert string to number if needed
                        if (typeof value === 'string') {
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue > 0 && numValue <= 18446744073709551615) {
                            projectId = numValue;
                          }
                        } else if (typeof value === 'number' && value > 0 && value <= 18446744073709551615) {
                          projectId = value;
                        }
                      } else if ('bcs' in field.name) {
                        // Sometimes it's bcs encoded
                        try {
                          const parsed = JSON.parse(JSON.stringify(field.name));
                          let value: any = parsed.value;
                          if (typeof value === 'string') {
                            const numValue = Number(value);
                            if (!isNaN(numValue) && numValue > 0 && numValue <= 18446744073709551615) {
                              projectId = numValue;
                            }
                          } else if (typeof value === 'number' && value > 0 && value <= 18446744073709551615) {
                            projectId = value;
                          }
                        } catch {
                          // Try to find a number value in the object
                          const entries = Object.entries(field.name);
                          const numEntry = entries.find(([_, v]) => {
                            if (typeof v === 'string') {
                              const num = Number(v);
                              return !isNaN(num) && num > 0 && num <= 18446744073709551615;
                            }
                            return typeof v === 'number' && (v as number) > 0 && (v as number) <= 18446744073709551615;
                          });
                          if (numEntry) {
                            const val = numEntry[1];
                            projectId = typeof val === 'string' ? Number(val) : (val as number);
                          }
                        }
                      } else {
                        // Try to find a valid number in the object (handle both string and number)
                        const entries = Object.entries(field.name);
                        const numEntry = entries.find(([_, v]) => {
                          if (typeof v === 'string') {
                            const num = Number(v);
                            return !isNaN(num) && num > 0 && num <= 18446744073709551615;
                          }
                          return typeof v === 'number' && (v as number) > 0 && (v as number) <= 18446744073709551615;
                        });
                        if (numEntry) {
                          const val = numEntry[1];
                          projectId = typeof val === 'string' ? Number(val) : (val as number);
                        }
                      }
                    }
                  }
                  
                  console.log('Extracted project_id from field name:', projectId, 'Field name:', field.name);
                  
                  const fieldObj = await suiClient.getDynamicFieldObject({
                    parentId: projectsTableId,
                    name: field.name
                  });
                  
                  if (fieldObj.data && fieldObj.data.content && 'fields' in fieldObj.data.content) {
                    const type = fieldObj.data.type || '';
                    if (type.includes('Project')) {
                      const container = fieldObj.data.content as any;
                      const valueNode = container.fields?.value ?? container.fields;
                      const fields = (valueNode && valueNode.fields) ? valueNode.fields : valueNode;
                      
                      if (!fields) continue;
                      
                      const title: string = fields.title || 'Untitled Project';
                      const owner: string = fields.owner || '';
                      
                      const event = events.data?.find((e: any) => {
                        const parsed = e.parsedJson || e;
                        return parsed?.owner === owner && parsed?.title === title;
                      });
                      
                      // Get the actual project object ID from the dynamic field
                      // Priority: 1) Project's UID (fields.id.id), 2) Event's project_id, 3) Field object ID
                      const eventProjectId = event && event.parsedJson && typeof event.parsedJson === 'object'
                        ? ((event.parsedJson as any)?.project_id || (event.parsedJson as any)?.projectId)
                        : null;
                      
                      // Extract all possible IDs for debugging
                      const projectUid = fields.id?.id;
                      const fieldObjectId = fieldObj.data.objectId;
                      
                      console.log('🔍 ID extraction debug:', {
                        projectUid,
                        eventProjectId,
                        fieldObjectId,
                        fieldsId: fields.id,
                        searchId: id
                      });
                      
                      const projectObjectId = projectUid || 
                                              eventProjectId || 
                                              fieldObjectId || 
                                              `table-${String(fields.id || '').slice(-8) || 'unknown'}`;
                      
                      const normalizeId = (id: string) => {
                        if (!id) return '';
                        return String(id).toLowerCase().trim();
                      };
                      
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
                      
                      console.log('🔍 Comparing project in DashboardProjectDetails:', {
                        projectObjectId,
                        projectUid,
                        eventProjectId,
                        fieldObjectId,
                        searchId: id,
                        normalizedProjectId,
                        normalizedId,
                        exactMatch,
                        suffixMatch,
                        projectUidMatch,
                        projectUidSuffixMatch,
                        eventIdMatch,
                        eventIdSuffixMatch,
                        matchesId,
                        title,
                        owner
                      });
                      
                      if (matchesId) {
                        // Ensure we have a valid projectId before setting it
                        if (!projectId || projectId <= 0 || projectId > 18446744073709551615) {
                          console.warn('Invalid project_id extracted:', projectId, 'from field name:', field.name);
                          // Try to extract again from field name (handle string values)
                          if (field.name) {
                            if (typeof field.name === 'number' && field.name > 0 && field.name <= 18446744073709551615) {
                              projectId = field.name;
                            } else if (typeof field.name === 'object' && field.name !== null) {
                              if ('value' in field.name) {
                                let value: any = field.name.value;
                                if (typeof value === 'string') {
                                  const numValue = Number(value);
                                  if (!isNaN(numValue) && numValue > 0 && numValue <= 18446744073709551615) {
                                    projectId = numValue;
                                  }
                                } else if (typeof value === 'number' && value > 0 && value <= 18446744073709551615) {
                                  projectId = value;
                                }
                              } else {
                                const entries = Object.entries(field.name);
                                const numEntry = entries.find(([_, v]) => {
                                  if (typeof v === 'string') {
                                    const num = Number(v);
                                    return !isNaN(num) && num > 0 && num <= 18446744073709551615;
                                  }
                                  return typeof v === 'number' && v > 0 && v <= 18446744073709551615;
                                });
                                if (numEntry) {
                                  const val = numEntry[1];
                                  projectId = typeof val === 'string' ? Number(val) : (val as number);
                                }
                              }
                            }
                          }
                        }
                        
                        const budgetMin: number = Number(fields.budget_min ?? 0);
                        const budgetMax: number = Number(fields.budget_max ?? 0);
                        
                        console.log('Setting project with project_id:', projectId, 'object ID:', projectObjectId);
                        
                        const projectData: Project = {
                          id: projectObjectId,
                          project_id: projectId && projectId > 0 && projectId <= 18446744073709551615 ? projectId : undefined,
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
                        setEditedProject(projectData);
                        setLoading(false);
                        return;
                      }
                    }
                  }
                } catch (fieldError: any) {
                  continue;
                }
              }
            }
          }
        }
        
        throw new Error('Project not found');
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
    const minNum = Number(min);
    const maxNum = Number(max);
    
    if (isNaN(minNum) || isNaN(maxNum)) {
      return 'Not specified';
    }
    
    if (!minNum && !maxNum) {
      return 'Not specified';
    }
    
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProject(project ? { ...project } : null);
    setSkillInput("");
  };

  const handleSave = async () => {
    if (!editedProject) {
      toast.error('Project data is missing. Cannot update project.');
      return;
    }
    
    // Try to get project_id from project, editedProject, or extract from dynamic fields
    let projectId = project?.project_id || editedProject?.project_id;
    
    // If still no project_id, try to extract from dynamic fields by matching object ID
    if (!projectId && editedProject.id) {
      console.warn('Project ID not found, attempting to extract from dynamic fields...');
      console.log('Looking for project with object ID:', editedProject.id);
      
      try {
        // Get DevHub object to find projects table
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
            
            console.log('Projects table ID:', projectsTableId);
            
            // Get all dynamic fields
            const tableDynamicFields = await suiClient.getDynamicFields({
              parentId: projectsTableId,
              limit: 200
            });
            
            console.log(`Found ${tableDynamicFields.data?.length || 0} dynamic fields`);
            
            // Find the field that matches our project's object ID
            if (tableDynamicFields.data && tableDynamicFields.data.length > 0) {
              const normalizeId = (id: string) => String(id).toLowerCase().trim();
              const projectObjectId = normalizeId(editedProject.id);
              
              for (const field of tableDynamicFields.data) {
                try {
                      // Extract u64 project_id from field name first
                      // Handle { type: 'u64', value: '1' } where value can be string or number
                      let extractedProjectId: number | undefined;
                      if (field.name) {
                        if (typeof field.name === 'number') {
                          if (field.name > 0 && field.name <= 18446744073709551615) {
                            extractedProjectId = field.name;
                          }
                        } else if (typeof field.name === 'object' && field.name !== null) {
                          if ('value' in field.name) {
                            let value: any = field.name.value;
                            // Convert string to number if needed
                            if (typeof value === 'string') {
                              const numValue = Number(value);
                              if (!isNaN(numValue) && numValue > 0 && numValue <= 18446744073709551615) {
                                extractedProjectId = numValue;
                              }
                            } else if (typeof value === 'number' && value > 0 && value <= 18446744073709551615) {
                              extractedProjectId = value;
                            }
                          } else if ('bcs' in field.name) {
                            try {
                              const parsed = JSON.parse(JSON.stringify(field.name));
                              let value: any = parsed.value;
                              if (typeof value === 'string') {
                                const numValue = Number(value);
                                if (!isNaN(numValue) && numValue > 0 && numValue <= 18446744073709551615) {
                                  extractedProjectId = numValue;
                                }
                              } else if (typeof value === 'number' && value > 0 && value <= 18446744073709551615) {
                                extractedProjectId = value;
                              }
                            } catch {
                              const entries = Object.entries(field.name);
                              const numEntry = entries.find(([_, v]) => {
                                if (typeof v === 'string') {
                                  const num = Number(v);
                                  return !isNaN(num) && num > 0 && num <= 18446744073709551615;
                                }
                                return typeof v === 'number' && v <= 18446744073709551615 && v > 0;
                              });
                              if (numEntry) {
                                const val = numEntry[1];
                                extractedProjectId = typeof val === 'string' ? Number(val) : (val as number);
                              }
                            }
                          } else {
                            // Try to find a number in the object (handle both string and number)
                            const entries = Object.entries(field.name);
                            const numEntry = entries.find(([_, v]) => {
                              if (typeof v === 'string') {
                                const num = Number(v);
                                return !isNaN(num) && num > 0 && num <= 18446744073709551615;
                              }
                              return typeof v === 'number' && v <= 18446744073709551615 && v > 0;
                            });
                            if (numEntry) {
                              const val = numEntry[1];
                              extractedProjectId = typeof val === 'string' ? Number(val) : (val as number);
                            }
                          }
                        }
                      }
                  
                  const fieldObj = await suiClient.getDynamicFieldObject({
                    parentId: projectsTableId,
                    name: field.name
                  });
                  
                  // Check if this field's object ID matches our project ID
                  if (fieldObj.data && fieldObj.data.objectId) {
                    const fieldObjectId = normalizeId(fieldObj.data.objectId);
                    
                    if (fieldObjectId === projectObjectId || 
                        fieldObjectId.endsWith(projectObjectId.slice(-8)) ||
                        projectObjectId.endsWith(fieldObjectId.slice(-8))) {
                      console.log('Found matching field! Field name:', field.name, 'Extracted project_id:', extractedProjectId);
                      if (extractedProjectId !== undefined && extractedProjectId > 0 && extractedProjectId <= 18446744073709551615) {
                        projectId = extractedProjectId;
                        break;
                      }
                    }
                  }
                } catch (fieldError) {
                  console.error('Error processing field:', fieldError);
                  continue;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error extracting project_id from dynamic fields:', error);
      }
    }
    
    if (!projectId) {
      toast.error('Project ID is missing. Cannot update project. Please try refreshing the page.');
      console.error('Project ID missing. Project:', project, 'EditedProject:', editedProject);
      return;
    }

    console.log('✅ Using project_id:', projectId, 'for update transaction');
    
    try {
      const updateTx = updateProjectTransaction(projectId, {
        title: editedProject.title,
        shortSummary: editedProject.short_summary,
        description: editedProject.description,
        category: editedProject.category,
        experienceLevel: editedProject.experience_level,
        budgetMin: editedProject.budget_min,
        budgetMax: editedProject.budget_max,
        timelineWeeks: editedProject.timeline_weeks,
        requiredSkills: editedProject.required_skills,
        applicationsStatus: editedProject.applications_status,
      });

      signAndExecute(
        { transaction: updateTx as any },
        {
          onSuccess: async (result: any) => {
            console.log('Project update transaction submitted:', result);
            
            // Wait for transaction confirmation
              try {
                await suiClient.waitForTransaction({ digest: result.digest });
                console.log('Project updated successfully');
                
                // Refresh project data by re-fetching from blockchain
                if (id) {
                  // Re-fetch the project to show updated data
                  // Trigger a re-fetch by updating the loading state which will cause useEffect to run
                  setLoading(true);
                  setError(null);
                  setIsEditing(false);
                  
                  // The useEffect with [id, suiClient] dependencies will automatically re-fetch
                  // when loading changes, but we need to manually trigger a re-fetch
                  // Use setTimeout to allow state to update first
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                } else {
                  // Fallback: just update local state and exit edit mode
                  setProject(editedProject);
                  setIsEditing(false);
                }
                
                // Show success toast
                toast.success('Project updated successfully! Refreshing page...');
              } catch (waitError) {
                console.error('Error waiting for transaction:', waitError);
                toast.error('Project update submitted but confirmation failed. Please refresh the page to verify.');
                setIsEditing(false);
              }
          },
          onError: (error: any) => {
            console.error('Error updating project:', error);
            toast.error(`Failed to update project: ${error.message || 'Unknown error'}`);
          },
        }
      );
    } catch (error: any) {
      console.error('Error creating update transaction:', error);
      toast.error(`Failed to update project: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (editedProject) {
      setEditedProject({
        ...editedProject,
        [field]: value,
      });
    }
  };

  const handleSkillAdd = () => {
    const skill = skillInput.trim();
    if (editedProject && skill && !editedProject.required_skills.includes(skill)) {
      setEditedProject({
        ...editedProject,
        required_skills: [...editedProject.required_skills, skill],
      });
      setSkillInput("");
    }
  };

  const handleSkillRemove = (index: number) => {
    if (editedProject) {
      setEditedProject({
        ...editedProject,
        required_skills: editedProject.required_skills.filter((_, i) => i !== index),
      });
    }
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
      <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div />
            <main className="lg:col-span-3">
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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/dashboard-projects')}
                      className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg shadow-primary/25"
                    >
                      Back to Projects
                    </motion.button>
                  </motion.div>
                </div>
              </main>
            </div>
          </div>
        </div>
    );
  }

  const isOwner = currentAccount?.address === project.owner;
  const isOpen = project.applications_status?.toLowerCase() === 'open';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="project-details-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <button
                      onClick={() => navigate('/dashboard-projects')}
                      className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors group"
                    >
                      <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                      <span className="font-medium">Back to Projects</span>
                    </button>
                    
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-1 max-w-3xl">
                        {isEditing && editedProject ? (
                          <input
                            type="text"
                            value={editedProject.title}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="text-4xl font-bold text-foreground bg-background border border-border rounded-md px-3 py-2 w-full mb-4"
                          />
                        ) : (
                          <h1 className="text-4xl font-bold text-foreground mb-4">{project.title}</h1>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                          {isOpen ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-sm bg-green-500/20 text-green-400 border border-green-500/30"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                              <span>Open for Applications</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-sm bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg backdrop-blur-sm"
                            >
                              <div className="w-2 h-2 rounded-full bg-red-400"></div>
                              <span>Applications Closed</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      {isOwner && (
                        <div className="flex gap-2 shrink-0">
                          {isEditing ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save size={18} />
                                    Save Changes
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-accent transition-colors"
                              >
                                <X size={18} />
                                Cancel
                              </motion.button>
                            </>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleEdit}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <Edit2 size={18} />
                              Edit Project
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Short Summary Section with Info Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Short Summary */}
                    <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-lg">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Short Summary</h3>
                      {isEditing && editedProject ? (
                        <textarea
                          value={editedProject.short_summary}
                          onChange={(e) => handleFieldChange('short_summary', e.target.value)}
                          rows={3}
                          className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-3 py-2 resize-none"
                        />
                      ) : (
                        <p className="text-foreground leading-relaxed">{project.short_summary || 'No summary provided.'}</p>
                      )}
                    </div>

                    {/* Quick Info Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl p-6 border border-primary/20 shadow-lg"
                    >
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mx-auto mb-2">
                            <Tag className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Category</div>
                          <div className="text-sm font-semibold text-foreground">{project.category}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mx-auto mb-2">
                            <TrendingUp className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Experience</div>
                          <div className="text-sm font-semibold text-foreground">{project.experience_level}</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mx-auto mb-2">
                            <Clock className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Timeline</div>
                          <div className="text-sm font-semibold text-foreground">
                            {project.timeline_weeks > 0 ? `${project.timeline_weeks} week${project.timeline_weeks !== 1 ? 's' : ''}` : 'N/A'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mx-auto mb-2">
                            <DollarSign className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Budget</div>
                          <div className="text-sm font-semibold text-foreground">
                            {project.budget_min > 0 || project.budget_max > 0 
                              ? formatBudget(project.budget_min, project.budget_max)
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Description Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Description
                    </h3>
                    {isEditing && editedProject ? (
                      <textarea
                        value={editedProject.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none"
                      />
                    ) : (
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {project.description || 'No description provided.'}
                      </p>
                    )}
                  </motion.div>

                  {/* Required Skills Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      Required Skills
                    </h3>
                    {isEditing && editedProject ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter a skill"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSkillAdd();
                              }
                            }}
                            className="flex-1 max-w-xs bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder-muted-foreground"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSkillAdd}
                            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                          >
                            <span>Add</span>
                            <span className="text-lg">+</span>
                          </motion.button>
                        </div>
                        {editedProject.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editedProject.required_skills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 text-sm rounded-full bg-muted text-foreground">
                                {skill}
                                <button className="ml-2 text-xs" onClick={() => handleSkillRemove(index)}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {project.required_skills && project.required_skills.length > 0 ? (
                          project.required_skills.map((skill, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.03 }}
                              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all group cursor-default"
                            >
                              <span className="text-primary font-medium text-sm">{skill}</span>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No skills specified.</p>
                        )}
                      </div>
                    )}
                  </motion.div>

                  {/* Project Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Details Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-lg"
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-4">Project Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Category</div>
                            {isEditing && editedProject ? (
                              <select
                                value={editedProject.category}
                                onChange={(e) => handleFieldChange('category', e.target.value)}
                                className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                              >
                                <option>General</option>
                                <option>Web3</option>
                                <option>DeFi</option>
                                <option>NFT</option>
                                <option>Gaming</option>
                                <option>Infrastructure</option>
                                <option>Tools</option>
                              </select>
                            ) : (
                              <div className="text-sm font-semibold text-foreground">{project.category}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Budget</div>
                            {isEditing && editedProject ? (
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  value={editedProject.budget_min}
                                  onChange={(e) => handleFieldChange('budget_min', Number(e.target.value))}
                                  placeholder="Min"
                                  className="bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                                />
                                <input
                                  type="number"
                                  value={editedProject.budget_max}
                                  onChange={(e) => handleFieldChange('budget_max', Number(e.target.value))}
                                  placeholder="Max"
                                  className="bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                                />
                              </div>
                            ) : (
                              <div className="text-sm font-semibold text-foreground">
                                {formatBudget(project.budget_min, project.budget_max)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Timeline</div>
                            {isEditing && editedProject ? (
                              <input
                                type="number"
                                value={editedProject.timeline_weeks}
                                onChange={(e) => handleFieldChange('timeline_weeks', Number(e.target.value))}
                                placeholder="Weeks"
                                className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                              />
                            ) : (
                              <div className="text-sm font-semibold text-foreground">
                                {project.timeline_weeks > 0 
                                  ? `${project.timeline_weeks} week${project.timeline_weeks !== 1 ? 's' : ''}`
                                  : 'Not specified'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Experience Level</div>
                            {isEditing && editedProject ? (
                              <select
                                value={editedProject.experience_level}
                                onChange={(e) => handleFieldChange('experience_level', e.target.value)}
                                className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                              >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Expert</option>
                              </select>
                            ) : (
                              <div className="text-sm font-semibold text-foreground">{project.experience_level}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Created</div>
                            <div className="text-sm font-semibold text-foreground">
                              {formatDate(project.creation_timestamp)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Owner</div>
                            <div className="text-sm font-semibold text-foreground font-mono truncate">
                              {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Manage Applications Card */}
                    {isOwner && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="bg-card/70 backdrop-blur-xl rounded-2xl p-6 border border-border shadow-lg"
                      >
                        <h3 className="text-lg font-semibold text-foreground mb-4">Manage Applications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                isOpen ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'
                              }`}></div>
                              <span className="text-sm font-medium text-foreground">Application Status</span>
                            </div>
                            {isEditing && editedProject ? (
                              <select
                                value={editedProject.applications_status}
                                onChange={(e) => handleFieldChange('applications_status', e.target.value)}
                                className="px-4 py-2 bg-background border border-border rounded-md text-foreground text-sm font-semibold"
                              >
                                <option>Open</option>
                                <option>Closed</option>
                              </select>
                            ) : (
                              <span className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 ${
                    isOpen 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {isOpen ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        {project.applications_status}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        {project.applications_status}
                      </>
                    )}
                  </span>
                            )}
                          </div>

                          {/* Attachments */}
                          {project.attachments_walrus_blob_ids && project.attachments_walrus_blob_ids.length > 0 && (
                            <div className="pt-3 border-t border-border">
                              <div className="flex items-center gap-2 mb-3">
                                <Paperclip className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-semibold text-foreground">Project Attachments</h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                              className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                              }}
                                            />
                                            <div className="hidden absolute inset-0 flex items-center justify-center bg-background/80">
                                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <a
                                              href={blobUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                                            >
                                              <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                          </div>
                                        ) : (
                                          <a
                                            href={blobUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-3 bg-background/50 border border-border rounded-lg hover:bg-accent transition-all group"
                                          >
                                            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                                              <File className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium text-foreground truncate">
                                                Attachment {index + 1}
                                              </div>
                                              <div className="text-xs text-muted-foreground truncate">
                                                {blobId.slice(0, 15)}...
                                              </div>
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                          </a>
                                        )}
                                      </motion.div>
                                    );
                                  })}
                                </AnimatePresence>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
      </AnimatePresence>
  );
};

export default DashboardProjectDetails;

