import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { PACKAGE_ID, DEVHUB_OBJECT_ID } from "@/lib/suiClient";

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
}

const Opportunities = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching projects...');
        console.log('📦 PACKAGE_ID:', PACKAGE_ID);
        
        // Step 1: Query ProjectCreated events
        const events = await suiClient.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::devhub::ProjectCreated` },
          order: "descending",
          limit: 100,
        });

        console.log('📊 Events found:', events.data?.length || 0);
        console.log('📋 Events data:', events.data);

        const ids: string[] = [];
        for (const event of events.data || []) {
          const parsed = event.parsedJson || event;
          const id = parsed && typeof parsed === 'object' ? ((parsed as any)?.project_id || (parsed as any)?.projectId) : null;
          if (id) {
            ids.push(id);
            console.log('✅ Found project ID from event:', id);
          } else {
            console.warn('⚠️ Event missing project_id:', parsed);
          }
        }

        console.log('🆔 Extracted IDs:', ids);

        let mapped: Project[] = [];
        
        // Step 1.5: Projects are stored in a Table<u64, Project> inside DevHub
        // The table itself is stored as a field in DevHub, and entries are dynamic fields on the table's ID
        // We need to find the table's ID first, then access its dynamic fields
        try {
          console.log('🔍 Accessing projects via DevHub structure...');
          
          // First, get the DevHub object to find the projects table ID
          const devhubObj = await suiClient.getObject({
            id: DEVHUB_OBJECT_ID,
            options: { showContent: true, showType: true, showOwner: true }
          });
          
          console.log('📦 DevHub object:', {
            hasData: !!devhubObj.data,
            hasContent: !!devhubObj.data?.content,
            type: devhubObj.data?.type
          });
          
          if (devhubObj.data?.content && 'fields' in devhubObj.data.content) {
            const devhubFields = (devhubObj.data.content as any).fields;
            console.log('📋 DevHub fields:', Object.keys(devhubFields));
            
            // The projects field should contain a Table struct
            // Tables have an 'id' field that we can use to query dynamic fields
            if (devhubFields.projects) {
              // Extract the table ID - it's stored as a UID which has an id property
              let projectsTableId: string;
              
              // The projects field is a Table struct with { id: UID, size: u64 }
              // The id field is a UID which is an object with an id property
              // Extract the string ID from the UID object
              console.log('📦 Projects field structure:', {
                hasFields: !!devhubFields.projects.fields,
                hasId: !!devhubFields.projects.id,
                projectsType: typeof devhubFields.projects,
                projectsValue: devhubFields.projects
              });
              
              let idValue: any;
              if (devhubFields.projects.fields && devhubFields.projects.fields.id) {
                idValue = devhubFields.projects.fields.id;
              } else if (devhubFields.projects.id) {
                idValue = devhubFields.projects.id;
              } else {
                console.error('⚠️ Projects field structure:', devhubFields.projects);
                throw new Error('Projects table structure not recognized - no id field found');
              }
              
              console.log('🔍 Table ID value:', idValue, 'Type:', typeof idValue);
              
              // UID is an object like { id: "0x..." } - extract the string ID
              if (typeof idValue === 'object' && idValue !== null) {
                if (idValue.id) {
                  projectsTableId = String(idValue.id);
                } else if (idValue.objectId) {
                  projectsTableId = String(idValue.objectId);
                } else {
                  // Try to extract any string property that looks like an address
                  const keys = Object.keys(idValue);
                  const possibleId = keys.find(k => 
                    typeof idValue[k] === 'string' && 
                    idValue[k].startsWith('0x')
                  );
                  if (possibleId) {
                    projectsTableId = String(idValue[possibleId]);
                  } else {
                    console.error('⚠️ Cannot extract ID from object:', idValue);
                    throw new Error('Cannot extract table ID - unexpected object structure');
                  }
                }
              } else if (typeof idValue === 'string') {
                projectsTableId = idValue;
              } else {
                console.error('⚠️ Unexpected table ID format:', idValue, 'Type:', typeof idValue);
                throw new Error('Cannot extract table ID - unexpected type');
              }
              
              console.log('🔍 Extracted projects table ID:', projectsTableId, 'Type:', typeof projectsTableId);
              
              // Ensure it's a string and not empty
              if (!projectsTableId || typeof projectsTableId !== 'string') {
                throw new Error(`Invalid table ID: ${projectsTableId} (type: ${typeof projectsTableId})`);
              }
              
              // Now query dynamic fields on the projects table
              console.log('🔍 Querying dynamic fields on table:', projectsTableId);
              const tableDynamicFields = await suiClient.getDynamicFields({
                parentId: projectsTableId as string,
                limit: 200
              });
              
              console.log(`📦 Found ${tableDynamicFields.data?.length || 0} dynamic fields on projects table`);
              
              if (tableDynamicFields.data && tableDynamicFields.data.length > 0) {
                const projectsFromTable: any[] = [];
                
                // Fetch each dynamic field object
                for (const field of tableDynamicFields.data) {
                  try {
                    const fieldObj = await suiClient.getDynamicFieldObject({
                      parentId: projectsTableId,
                      name: field.name
                    });
                    
                    console.log(`🔍 Checking dynamic field:`, field.name, 'Type:', fieldObj.data?.type);
                    
                    if (fieldObj.data && fieldObj.data.content && 'fields' in fieldObj.data.content) {
                      const type = fieldObj.data.type || '';
                      if (type.includes('Project')) {
                        console.log(`✅ Found project via dynamic field:`, field.name);
                        projectsFromTable.push({ data: fieldObj.data });
                      }
                    }
                  } catch (fieldError: any) {
                    console.debug(`⚠️ Error fetching field ${field.name}:`, fieldError?.message || fieldError);
                    continue;
                  }
                }
            
                console.log(`📦 Found ${projectsFromTable.length} projects via table dynamic fields`);
                
                // Map dynamic field projects to our format
                mapped = projectsFromTable
                  .map((item: any) => {
                    const data = item.data;
                    if (!data || !data.content || !('fields' in data.content)) {
                      return null;
                    }
                    
                    // Dynamic field object structure is:
                    // dynamic_field::Field<Name, Value> where Value = Project
                    // So the actual Project struct lives under content.fields.value.fields
                    const container = data.content as any;
                    const valueNode = container.fields?.value ?? container.fields;
                    const fields = (valueNode && valueNode.fields) ? valueNode.fields : valueNode;
                    if (!fields) return null;
                    console.log(`📋 Mapping project (extracted from dynamic field value):`, fields);
                    
                    const title: string = fields.title || 'Untitled Project';
                    const shortSummary: string = fields.short_summary || '';
                    const description: string = fields.description || '';
                    const category: string = fields.category || 'General';
                    const experience: string = fields.experience_level || 'Unknown';
                    const budgetMin: number = Number(fields.budget_min ?? 0);
                    const budgetMax: number = Number(fields.budget_max ?? 0);
                    const timelineWeeks: number = Number(fields.timeline_weeks ?? 0);
                    
                    // Handle required_skills
                    let requiredSkills: string[] = [];
                    if (Array.isArray(fields.required_skills)) {
                      requiredSkills = fields.required_skills.map((s: any) => String(s));
                    }
                    
                    const applicationsStatus: string = fields.applications_status || 'Open';
                    const createdAt: number = Number(fields.creation_timestamp ?? Date.now());
                    
                    // Try to find the object ID from events by matching owner and title
                    const event = events.data?.find((e: any) => {
                      const parsed = e.parsedJson || e;
                      return parsed?.owner === fields.owner && parsed?.title === title;
                    });
                    const objectId = event && event.parsedJson && typeof event.parsedJson === 'object'
                      ? ((event.parsedJson as any)?.project_id || (event.parsedJson as any)?.projectId) 
                      : (fields.id?.id || data.objectId || `table-${String(fields.id || '').slice(-8) || 'unknown'}`);
                    
                    const project: Project = {
                      id: objectId || data.objectId || fields.id?.id || `table-${String(fields.id || '').slice(-8) || 'unknown'}`,
                      title,
                      short_summary: shortSummary,
                      description,
                      category,
                      experience_level: experience,
                      budget_min: isNaN(budgetMin) ? 0 : budgetMin,
                      budget_max: isNaN(budgetMax) ? 0 : budgetMax,
                      timeline_weeks: isNaN(timelineWeeks) ? 0 : timelineWeeks,
                      required_skills: requiredSkills,
                      owner: fields.owner || '',
                      applications_status: applicationsStatus,
                      creation_timestamp: isNaN(createdAt) ? Date.now() : createdAt,
                    };
                    
                    console.log('✅ Mapped project from dynamic field:', project.id, project.title);
                    return project;
                  })
                  .filter(Boolean) as Project[];
            
                console.log(`✅ Successfully mapped ${mapped.length} projects from table`);
                
                // If we got projects from table, skip the rest
                if (mapped.length > 0) {
                  setProjects(mapped);
                  setLoading(false);
                  return;
                }
              }
            } else {
              console.warn('⚠️ Projects table not found in DevHub structure');
            }
          } else {
            console.warn('⚠️ DevHub object has no content');
          }
        } catch (viewError: any) {
          console.error('❌ Error accessing projects via table structure:', viewError?.message || viewError);
          // Continue to fallback methods
        }

        if (ids.length > 0) {
          // Step 2: Projects are stored in a Table inside DevHub as dynamic fields
          // We need to query them using getDynamicFieldObject or getObject by their ID
          // First, try to get objects directly by ID (they should still be accessible even if in a table)
          console.log('📥 Attempting to fetch projects by object ID...');
          const allProjects: any[] = [];
          
          // Try fetching each project by its object ID
          // Projects stored in Table are dynamic fields, but objects with 'key' should still be queryable
          for (const projectObjectId of ids) {
            try {
              console.log(`🔍 Fetching project ${projectObjectId}...`);
              const obj = await suiClient.getObject({
                id: projectObjectId,
                options: { showContent: true, showType: true, showOwner: true }
              });
              
              console.log(`📦 Response for ${projectObjectId}:`, {
                hasData: !!obj.data,
                hasContent: !!obj.data?.content,
                hasFields: !!obj.data?.content && 'fields' in obj.data.content,
                type: obj.data?.type,
                owner: obj.data?.owner,
                error: obj.error
              });
              
              // Check if object exists and has content
              if (obj.data && obj.data.content && ('fields' in obj.data.content)) {
                console.log(`✅ Successfully fetched project ${projectObjectId}:`, obj.data.type);
                allProjects.push({ data: obj.data });
              } else if (obj.data) {
                // Object exists but no content - might be a dynamic field
                console.log(`⚠️ Project ${projectObjectId} exists but has no content. Type:`, obj.data.type, 'Owner:', obj.data.owner);
              } else {
                console.warn(`⚠️ Project ${projectObjectId} returned no data. Error:`, obj.error);
              }
            } catch (error: any) {
              // Check if it's a "not found" error or other issue
              const errorMsg = error?.message || error?.code || String(error);
              console.error(`❌ Error fetching project ${projectObjectId}:`, errorMsg);
              if (errorMsg.includes('not found') || error?.code === 'OBJECT_NOT_FOUND') {
                console.warn(`⚠️ Project ${projectObjectId} not found - may be stored as dynamic field only`);
              }
            }
          }
          
          // If we didn't get any projects, try querying dynamic fields from DevHub
          if (allProjects.length === 0 && ids.length > 0) {
            console.log('🔄 No projects found via direct query, trying dynamic fields from DevHub...');
            try {
              // Get all dynamic fields from DevHub object
              const dynamicFields = await suiClient.getDynamicFields({
                parentId: DEVHUB_OBJECT_ID,
                limit: 200  // Increased limit to catch more fields
              });
              
              console.log(`📦 Found ${dynamicFields.data?.length || 0} dynamic fields on DevHub`);
              console.log('📋 Dynamic field names:', dynamicFields.data?.map((f: any) => f.name));
              
              // Filter for Project type and fetch them
              for (const field of dynamicFields.data || []) {
                try {
                  // The table stores projects with numeric keys (u64)
                  // Check if the field name is a number (project_id)
                  const fieldObj = await suiClient.getDynamicFieldObject({
                    parentId: DEVHUB_OBJECT_ID,
                    name: field.name
                  });
                  
                  console.log(`🔍 Checking dynamic field:`, field.name, 'Type:', fieldObj.data?.type);
                  
                  if (fieldObj.data && fieldObj.data.content) {
                    const type = fieldObj.data.type || '';
                    // Check if this is a Project object
                    if (type.includes('Project') && 'fields' in fieldObj.data.content) {
                      console.log(`✅ Found project via dynamic field:`, field.name);
                      allProjects.push({ data: fieldObj.data });
                    }
                  }
                } catch (fieldError: any) {
                  // Skip errors for individual fields, but log them
                  console.debug(`⚠️ Error fetching field ${field.name}:`, fieldError?.message || fieldError);
                  continue;
                }
              }
            } catch (dynamicError: any) {
              console.error('❌ Error querying dynamic fields:', dynamicError?.message || dynamicError);
            }
          }

          console.log(`📦 Total projects found: ${allProjects.length}`);

          // Map projects to our format
          mapped = allProjects
            .map((item: any) => {
              const obj = item.data || item;
              if (!obj || !obj.content || !('fields' in obj.content)) {
                console.warn('⚠️ Project missing fields:', obj?.objectId);
                return null;
              }
              
              const fields = (obj.content as any).fields || {};
              console.log('📋 Fields for project:', obj.objectId, fields);
              
              // Robust field extraction (matches DashboardProjects mapping)
              const title: string = fields.title || fields.project_title || 'Untitled Project';
              const shortSummary: string = fields.short_summary || fields.shortSummary || '';
              const description: string = fields.description || '';
              const category: string = fields.category || 'General';
              const experience: string = fields.experience_level || fields.experienceLevel || 'Unknown';
              const budgetMin: number = Number(fields.budget_min ?? fields.budgetMin ?? 0);
              const budgetMax: number = Number(fields.budget_max ?? fields.budgetMax ?? 0);
              const timelineWeeks: number = Number(fields.timeline_weeks ?? fields.timelineWeeks ?? 0);
              
              // Handle required_skills - could be array of strings or nested structure
              let requiredSkills: string[] = [];
              if (Array.isArray(fields.required_skills)) {
                requiredSkills = fields.required_skills.map((s: any) => {
                  if (typeof s === 'string') return s;
                  if (s && typeof s === 'object' && 'bytes' in s) {
                    // Handle BCS encoded strings
                    try {
                      return new TextDecoder().decode(new Uint8Array(s.bytes));
                    } catch (e) {
                      return String(s);
                    }
                  }
                  return String(s);
                });
              } else if (Array.isArray((fields as any).skills)) {
                requiredSkills = (fields as any).skills;
              }
              
              const applicationsStatus: string = fields.applications_status || fields.applicationsStatus || 'Open';
              const createdAt: number = Number(fields.creation_timestamp ?? fields.created_at ?? Date.now());

              const project: Project = {
                id: obj.objectId || obj.data?.objectId,
                title,
                short_summary: shortSummary,
                description,
                category,
                experience_level: experience,
                budget_min: isNaN(budgetMin) ? 0 : budgetMin,
                budget_max: isNaN(budgetMax) ? 0 : budgetMax,
                timeline_weeks: isNaN(timelineWeeks) ? 0 : timelineWeeks,
                required_skills: requiredSkills,
                owner: fields.owner || '',
                applications_status: applicationsStatus,
                creation_timestamp: isNaN(createdAt) ? Date.now() : createdAt,
              };
              
              console.log('✅ Mapped project:', project.id, project.title);
              return project;
            })
            .filter(Boolean) as Project[];
          
          console.log('✅ Successfully mapped projects:', mapped.length);
        }

        // Fallback: read projects owned by the shared DevHub object
        if (mapped.length === 0) {
          console.log('🔄 Fallback 1: Querying projects owned by DevHub object...');
          const owned = await suiClient.getOwnedObjects({
            owner: DEVHUB_OBJECT_ID,
            filter: { StructType: `${PACKAGE_ID}::devhub::Project` },
            options: { showContent: true, showType: true },
          });

          mapped = (owned.data || [])
            .map((obj: any) => {
              if (!obj.data || !obj.data.content || !('fields' in obj.data.content)) return null;
              const fields = (obj.data.content as any).fields || {};
              const title: string = fields.title || fields.project_title || 'Untitled Project';
              const shortSummary: string = fields.short_summary || fields.shortSummary || '';
              const description: string = fields.description || '';
              const category: string = fields.category || 'General';
              const experience: string = fields.experience_level || fields.experienceLevel || 'Unknown';
              const budgetMin: number = Number(fields.budget_min ?? fields.budgetMin ?? 0);
              const budgetMax: number = Number(fields.budget_max ?? fields.budgetMax ?? 0);
              const timelineWeeks: number = Number(fields.timeline_weeks ?? fields.timelineWeeks ?? 0);
              const requiredSkills: string[] = Array.isArray(fields.required_skills)
                ? fields.required_skills
                : Array.isArray((fields as any).skills)
                  ? (fields as any).skills
                  : [];
              const applicationsStatus: string = fields.applications_status || fields.applicationsStatus || 'Open';
              const createdAt: number = Number(fields.creation_timestamp ?? fields.created_at ?? Date.now());

              return {
                id: obj.data.objectId,
                title,
                short_summary: shortSummary,
                description,
                category,
                experience_level: experience,
                budget_min: isNaN(budgetMin) ? 0 : budgetMin,
                budget_max: isNaN(budgetMax) ? 0 : budgetMax,
                timeline_weeks: isNaN(timelineWeeks) ? 0 : timelineWeeks,
                required_skills: requiredSkills,
                owner: fields.owner || '',
                applications_status: applicationsStatus,
                creation_timestamp: isNaN(createdAt) ? Date.now() : createdAt,
              } as Project;
            })
            .filter(Boolean) as Project[];
          console.log('🔄 Fallback 1 found:', mapped.length, 'projects');
        }

        // Fallback 2: read projects owned by current user (shows own projects immediately)
        if (mapped.length === 0 && currentAccount?.address) {
          console.log('🔄 Fallback 2: Querying projects owned by current user...');
          const mine = await suiClient.getOwnedObjects({
            owner: currentAccount.address,
            filter: { StructType: `${PACKAGE_ID}::devhub::Project` },
            options: { showContent: true, showType: true },
          });
          const mineMapped = (mine.data || [])
            .map((obj: any) => {
              if (!obj.data || !obj.data.content || !('fields' in obj.data.content)) return null;
              const fields = (obj.data.content as any).fields || {};
              const title: string = fields.title || fields.project_title || 'Untitled Project';
              const shortSummary: string = fields.short_summary || fields.shortSummary || '';
              const description: string = fields.description || '';
              const category: string = fields.category || 'General';
              const experience: string = fields.experience_level || fields.experienceLevel || 'Unknown';
              const budgetMin: number = Number(fields.budget_min ?? fields.budgetMin ?? 0);
              const budgetMax: number = Number(fields.budget_max ?? fields.budgetMax ?? 0);
              const timelineWeeks: number = Number(fields.timeline_weeks ?? fields.timelineWeeks ?? 0);
              const requiredSkills: string[] = Array.isArray(fields.required_skills)
                ? fields.required_skills
                : Array.isArray((fields as any).skills)
                  ? (fields as any).skills
                  : [];
              const applicationsStatus: string = fields.applications_status || fields.applicationsStatus || 'Open';
              const createdAt: number = Number(fields.creation_timestamp ?? fields.created_at ?? Date.now());
              return {
                id: obj.data.objectId,
                title,
                short_summary: shortSummary,
                description,
                category,
                experience_level: experience,
                budget_min: isNaN(budgetMin) ? 0 : budgetMin,
                budget_max: isNaN(budgetMax) ? 0 : budgetMax,
                timeline_weeks: isNaN(timelineWeeks) ? 0 : timelineWeeks,
                required_skills: requiredSkills,
                owner: fields.owner || currentAccount.address,
                applications_status: applicationsStatus,
                creation_timestamp: isNaN(createdAt) ? Date.now() : createdAt,
              } as Project;
            })
            .filter(Boolean) as Project[];
          mapped = mineMapped;
          console.log('🔄 Fallback 2 found:', mapped.length, 'projects');
        }

        // Fallback 3: broad scan of user's objects and filter by type substring
        if (mapped.length === 0 && currentAccount?.address) {
          console.log('🔄 Fallback 3: Broad scan of user objects...');
          const mineAll = await suiClient.getOwnedObjects({
            owner: currentAccount.address,
            options: { showContent: true, showType: true },
            limit: 50,
          });
          const typed = (mineAll.data || []).filter((obj: any) => {
            const t = obj.data?.type as string | undefined;
            return t && t.includes(`${PACKAGE_ID}::devhub::Project`);
          });
          const typedMapped = typed
            .map((obj: any) => {
              const fields = (obj.data?.content as any)?.fields || {};
              const title: string = fields.title || fields.project_title || 'Untitled Project';
              const shortSummary: string = fields.short_summary || fields.shortSummary || '';
              const description: string = fields.description || '';
              const category: string = fields.category || 'General';
              const experience: string = fields.experience_level || fields.experienceLevel || 'Unknown';
              const budgetMin: number = Number(fields.budget_min ?? fields.budgetMin ?? 0);
              const budgetMax: number = Number(fields.budget_max ?? fields.budgetMax ?? 0);
              const timelineWeeks: number = Number(fields.timeline_weeks ?? fields.timelineWeeks ?? 0);
              const requiredSkills: string[] = Array.isArray(fields.required_skills)
                ? fields.required_skills
                : Array.isArray((fields as any).skills)
                  ? (fields as any).skills
                  : [];
              const applicationsStatus: string = fields.applications_status || fields.applicationsStatus || 'Open';
              const createdAt: number = Number(fields.creation_timestamp ?? fields.created_at ?? Date.now());
              return {
                id: obj.data.objectId,
                title,
                short_summary: shortSummary,
                description,
                category,
                experience_level: experience,
                budget_min: isNaN(budgetMin) ? 0 : budgetMin,
                budget_max: isNaN(budgetMax) ? 0 : budgetMax,
                timeline_weeks: isNaN(timelineWeeks) ? 0 : timelineWeeks,
                required_skills: requiredSkills,
                owner: fields.owner || currentAccount.address,
                applications_status: applicationsStatus,
                creation_timestamp: isNaN(createdAt) ? Date.now() : createdAt,
              } as Project;
            }) as Project[];
          mapped = typedMapped;
          console.log('🔄 Fallback 3 found:', mapped.length, 'projects');
        }

        console.log('📊 Final result: Found', mapped.length, 'projects');
        setProjects(mapped);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [suiClient, currentAccount?.address]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || project.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    "Web3",
    "DeFi",
    "NFT",
    "Gaming",
    "Infrastructure",
    "Tools",
  ];

  return (
    <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key="opportunities-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
                    <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Browse Opportunities</h1>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
                      Discover and apply to exciting development opportunities
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/projects/new")}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Create Opportunity</span>
                </motion.button>
              </motion.div>

              {/* Search and Filter Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="space-y-4"
              >
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search opportunities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-card/70 backdrop-blur-xl border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-3 bg-card/70 backdrop-blur-xl border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Filter size={20} />
                    Filters
                  </motion.button>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        filterCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/70 backdrop-blur-xl text-muted-foreground hover:bg-accent border border-border"
                      }`}
                    >
                      {category === "all" ? "All Categories" : category}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Opportunities Grid */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center items-center py-20"
                  >
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </motion.div>
                ) : filteredProjects.length > 0 ? (
                  <motion.div
                    key="opportunities-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <AnimatePresence>
                      {filteredProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ 
                            delay: Math.min(index * 0.05, 0.5),
                            duration: 0.3
                          }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className={`bg-card/70 backdrop-blur-xl border border-border rounded-lg p-6 hover:shadow-lg transition-all ${
                            theme === 'dark' 
                              ? 'hover:border-primary/50' 
                              : 'hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {project.category}
                            </span>
                            {project.applications_status === "Open" ? (
                              <span className="flex items-center gap-1 text-green-500 text-xs">
                                <CheckCircle size={14} />
                                Open
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-500/20 border border-red-500/30 px-2 py-1 rounded-full">
                                <XCircle size={12} />
                                Closed
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">
                            {project.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {project.short_summary || project.description}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign size={16} className="text-primary/70" />
                              <span>
                                {project.budget_min > 0 || project.budget_max > 0
                                  ? `${project.budget_min.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${project.budget_max.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                  : 'Budget not specified'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock size={16} className="text-primary/70" />
                              <span>{project.timeline_weeks} weeks</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users size={16} className="text-primary/70" />
                              <span>{project.experience_level}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.required_skills.slice(0, 3).map((skill, idx) => (
                              <motion.span
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 + idx * 0.02 }}
                                className="px-2 py-1 bg-secondary/50 text-secondary-foreground text-xs rounded"
                              >
                                {skill}
                              </motion.span>
                            ))}
                            {project.required_skills.length > 3 && (
                              <span className="px-2 py-1 text-muted-foreground text-xs">
                                +{project.required_skills.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              View Details
                            </motion.button>
                            <motion.button
                              whileHover={project.owner !== currentAccount?.address ? { scale: 1.05 } : {}}
                              whileTap={project.owner !== currentAccount?.address ? { scale: 0.95 } : {}}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (project.owner === currentAccount?.address) {
                                  return; // Disabled for owner
                                }
                                navigate(`/dashboard-messages?to=${project.owner}`);
                              }}
                              disabled={project.owner === currentAccount?.address}
                              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                project.owner === currentAccount?.address
                                  ? 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50'
                                  : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/80'
                              }`}
                              title={project.owner === currentAccount?.address ? "You are the owner" : "Message Owner"}
                            >
                              <MessageSquare size={16} />
                              <span className="sr-only">{project.owner === currentAccount?.address ? "You are the owner" : "Message Owner"}</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-20"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <FolderKanban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No opportunities found
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {currentAccount
                        ? "Be the first to create an opportunity!"
                        : "Connect your wallet to view and create opportunities"}
                    </p>
                    {currentAccount && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/projects/new")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Plus size={20} />
                        Create Your First Opportunity
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );
};

export default Opportunities;
