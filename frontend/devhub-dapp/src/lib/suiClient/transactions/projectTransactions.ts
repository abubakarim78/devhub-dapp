import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';

// Helper function to create project
export function createProjectTransaction(
  projectData: {
    title: string;
    shortSummary: string;
    description: string;
    category: string;
    experienceLevel: string;
    budgetMin: number;
    budgetMax: number;
    timelineWeeks: number;
    requiredSkills: string[];
    attachmentsCount: number;
    visibility: string;
    applicationsStatus: string;
    devhubMessagesEnabled: boolean;
    attachmentsWalrusBlobIds: string[];
    // New fields from redesigned form
    keyDeliverables?: string;
    complexityLevel?: string;
    paymentModel?: string;
    preferredStartWindow?: string;
    niceToHaveSkills?: string[];
    repoOrSpecLink?: string;
    applicationType?: string;
    finalNotes?: string;
  },
  paymentCoinId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROJECT}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.title))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.shortSummary))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.description))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.category))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.experienceLevel))),
      tx.pure.u64(projectData.budgetMin),
      tx.pure.u64(projectData.budgetMax),
      tx.pure.u64(projectData.timelineWeeks),
      tx.pure.vector('vector<u8>', projectData.requiredSkills.map(skill => Array.from(new TextEncoder().encode(skill)))),
      tx.pure.u64(projectData.attachmentsCount),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.visibility))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.applicationsStatus))),
      tx.pure.bool(projectData.devhubMessagesEnabled),
      tx.pure.vector('vector<u8>', projectData.attachmentsWalrusBlobIds.map(id => Array.from(new TextEncoder().encode(id)))),
      // New parameters
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.keyDeliverables || ''))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.complexityLevel || 'Medium'))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.paymentModel || 'Fixed / Hourly / Milestone'))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.preferredStartWindow || 'Flexible'))),
      tx.pure.vector('vector<u8>', (projectData.niceToHaveSkills || []).map(skill => Array.from(new TextEncoder().encode(skill)))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.repoOrSpecLink || ''))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.applicationType || 'Open applications & proposals'))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.finalNotes || ''))),
      tx.object(paymentCoinId),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Comprehensive PTB function that combines object creation and apply-to-project
// NOTE: Since objects created with transfer::transfer or transfer::share_object
// cannot be referenced in the same transaction, this PTB assumes objects already exist.
// If they don't exist, they must be created first, then this PTB is used.
// 
// For milestones: They require the proposal ID from events, so they're added
// in a separate batched transaction after the proposal is created.
export function applyToProjectPTB(
  options: {
    // Both objects MUST exist (cannot create and use in same PTB)
    userProposalsId: string;
    proposalsByStatusId: string;
    proposalsByStatusSharedVersion: string | number;
    // Project and application data
    projectId: number;
    applicationData: {
      yourRole: string;
      availabilityHrsPerWeek: number;
      startDate: string;
      expectedDurationWeeks: number;
      proposalSummary: string;
      requestedCompensation: number;
      milestonesCount: number;
      githubRepoLink: string;
      onChainAddress: string;
      teamMembers: string[];
      coverLetterWalrusBlobId?: string;
      portfolioWalrusBlobIds: string[];
      opportunityTitle: string;
      proposalTitle: string;
      teamName: string;
      contactEmail: string;
      summary: string;
      budget: number;
      timelineWeeks: number;
      methodology: string;
    };
  }
) {
  const tx = new Transaction();
  tx.setGasBudget(200000000); // Higher budget for the operation

  // Prepare ProposalsByStatus argument (shared object)
  const initialSharedVersion = typeof options.proposalsByStatusSharedVersion === 'string'
    ? Number(options.proposalsByStatusSharedVersion)
    : Number(options.proposalsByStatusSharedVersion);
  
  if (isNaN(initialSharedVersion) || initialSharedVersion <= 0) {
    throw new Error(`Invalid shared version: ${options.proposalsByStatusSharedVersion}`);
  }
  
  const proposalsByStatusArg = tx.sharedObjectRef({
    objectId: options.proposalsByStatusId,
    mutable: true,
    initialSharedVersion: initialSharedVersion
  });

  // Apply to project - single command in PTB
  console.log('📝 Building apply_to_project PTB...');
  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.APPLY_TO_PROJECT}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID), // arg_idx 0: &mut DevHub
      tx.object(options.userProposalsId), // arg_idx 1: &mut UserProposals
      proposalsByStatusArg, // arg_idx 2: &mut ProposalsByStatus
      tx.pure.u64(options.projectId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.yourRole))),
      tx.pure.u64(options.applicationData.availabilityHrsPerWeek),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.startDate))),
      tx.pure.u64(options.applicationData.expectedDurationWeeks),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.proposalSummary))),
      tx.pure.u64(options.applicationData.requestedCompensation),
      tx.pure.u64(options.applicationData.milestonesCount),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.githubRepoLink))),
      tx.pure.address(options.applicationData.onChainAddress),
      tx.pure.vector('vector<u8>', options.applicationData.teamMembers.map(member => Array.from(new TextEncoder().encode(member)))),
      tx.pure.option('vector<u8>', options.applicationData.coverLetterWalrusBlobId ? Array.from(new TextEncoder().encode(options.applicationData.coverLetterWalrusBlobId)) : null),
      tx.pure.vector('vector<u8>', options.applicationData.portfolioWalrusBlobIds.map(id => Array.from(new TextEncoder().encode(id)))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.opportunityTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.proposalTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.teamName))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.contactEmail))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.summary))),
      tx.pure.u64(options.applicationData.budget),
      tx.pure.u64(options.applicationData.timelineWeeks),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(options.applicationData.methodology))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  console.log('✅ PTB built with apply_to_project operation');
  return tx;
}

// Batch function to add multiple milestones in a single PTB
export function addMilestonesPTB(
  proposalId: string,
  milestones: Array<{
    description: string;
    dueDate: number; // timestamp
    budget: number;
  }>
) {
  const tx = new Transaction();
  tx.setGasBudget(100000000 * milestones.length); // Budget based on number of milestones

  console.log(`📝 Building PTB to add ${milestones.length} milestone(s)...`);
  
  // Add all milestones in sequence
  milestones.forEach((milestone, index) => {
    if (milestone.description.trim()) {
      tx.moveCall({
        target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_MILESTONE_TO_PROPOSAL}`,
        arguments: [
          tx.object(proposalId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(milestone.description))),
          tx.pure.u64(milestone.dueDate),
          tx.pure.u64(milestone.budget),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
      console.log(`  Added milestone ${index + 1}/${milestones.length} to PTB`);
    }
  });

  console.log(`✅ PTB built with ${milestones.length} milestone operation(s)`);
  return tx;
}

// Helper function to apply to project
// Note: This function now accepts an optional sharedVersion for proposalsByStatusId
// If not provided, the SDK will try to auto-detect, but explicit version helps with type resolution
export function applyToProjectTransaction(
  userProposalsId: string,
  proposalsByStatusId: string,
  projectId: number,
  applicationData: {
    yourRole: string;
    availabilityHrsPerWeek: number;
    startDate: string;
    expectedDurationWeeks: number;
    proposalSummary: string;
    requestedCompensation: number;
    milestonesCount: number;
    githubRepoLink: string;
    onChainAddress: string;
    teamMembers: string[];
    coverLetterWalrusBlobId?: string;
    portfolioWalrusBlobIds: string[];
    opportunityTitle: string;
    proposalTitle: string;
    teamName: string;
    contactEmail: string;
    summary: string;
    budget: number;
    timelineWeeks: number;
    methodology: string;
  },
  proposalsByStatusSharedVersion?: string | number
) {
  const tx = new Transaction();

  // Set a gas budget to avoid dry run issues
  tx.setGasBudget(100000000); // 0.1 SUI in MIST

  // CRITICAL FIX: arg_idx 2 (proposals_by_status) MUST use sharedObjectRef
  // The Move function expects: proposals_by_status: &mut ProposalsByStatus
  // ProposalsByStatus is a shared object (created with transfer::share_object)
  // Using tx.object() causes TypeMismatch because the SDK can't auto-detect shared objects for dynamic IDs
  // We MUST use tx.sharedObjectRef() with the initialSharedVersion
  // 
  // Argument order in Move function:
  // 0: devhub: &mut DevHub
  // 1: user_proposals: &mut UserProposals
  // 2: proposals_by_status: &mut ProposalsByStatus <- THIS ONE (shared object)
  
  if (!proposalsByStatusSharedVersion) {
    throw new Error('proposalsByStatusSharedVersion is required for apply_to_project (arg_idx 2)');
  }
  
  const initialSharedVersion = typeof proposalsByStatusSharedVersion === 'string' 
    ? Number(proposalsByStatusSharedVersion) 
    : Number(proposalsByStatusSharedVersion);
  
  if (isNaN(initialSharedVersion) || initialSharedVersion <= 0) {
    throw new Error(`Invalid shared version for proposalsByStatus: ${proposalsByStatusSharedVersion} (converted to: ${initialSharedVersion})`);
  }
  
  console.log('🔧 Building sharedObjectRef for proposalsByStatus (arg_idx 2):', {
    objectId: proposalsByStatusId,
    initialSharedVersion,
    type: typeof initialSharedVersion,
    mutable: true,
    rawVersion: proposalsByStatusSharedVersion
  });
  
  // CRITICAL: The order of creating arguments matters for shared objects!
  // We need to create the sharedObjectRef BEFORE other object references
  // to ensure it gets the correct input index
  const proposalsByStatusArg = tx.sharedObjectRef({ 
    objectId: proposalsByStatusId, 
    mutable: true,
    initialSharedVersion: initialSharedVersion 
  });
  
  console.log('✅ Created sharedObjectRef:', {
    argType: proposalsByStatusArg.type,
    isInput: proposalsByStatusArg.$kind === 'Input',
    inputIndex: proposalsByStatusArg.Input,
    fullObject: JSON.stringify(proposalsByStatusArg),
    objectId: proposalsByStatusId,
    initialSharedVersion: initialSharedVersion
  });
  
  // Verify the sharedObjectRef was created correctly
  if (proposalsByStatusArg.$kind !== 'Input') {
    throw new Error('sharedObjectRef did not create an Input reference');
  }
  
  if (proposalsByStatusArg.type !== 'object') {
    throw new Error(`sharedObjectRef type is ${proposalsByStatusArg.type}, expected 'object'`);
  }

  // Build all arguments with detailed logging
  const arg0_devhub = tx.object(DEVHUB_OBJECT_ID);
  const arg1_userProposals = tx.object(userProposalsId);
  
  console.log('📋 Detailed Transaction Arguments Analysis:');
  console.log('  arg_idx 0 (devhub):', {
    type: '&mut DevHub',
    objectId: DEVHUB_OBJECT_ID,
    argType: arg0_devhub.type,
    isInput: arg0_devhub.$kind === 'Input',
    inputIndex: arg0_devhub.Input
  });
  
  console.log('  arg_idx 1 (user_proposals):', {
    type: '&mut UserProposals',
    objectId: userProposalsId,
    argType: arg1_userProposals.type,
    isInput: arg1_userProposals.$kind === 'Input',
    inputIndex: arg1_userProposals.Input
  });
  
  console.log('  arg_idx 2 (proposals_by_status):', {
    type: '&mut ProposalsByStatus',
    objectId: proposalsByStatusId,
    initialSharedVersion: initialSharedVersion,
    mutable: true,
    argType: proposalsByStatusArg.type,
    isInput: proposalsByStatusArg.$kind === 'Input',
    inputIndex: proposalsByStatusArg.Input,
    isSharedRef: true,
    fullArg: JSON.stringify(proposalsByStatusArg, null, 2)
  });
  
  // Log all pure arguments
  const pureArgs = [
    { idx: 3, name: 'project_id', type: 'u64', value: projectId },
    { idx: 4, name: 'your_role', type: 'vector<u8>', value: applicationData.yourRole, length: applicationData.yourRole.length },
    { idx: 5, name: 'availability_hrs_per_week', type: 'u64', value: applicationData.availabilityHrsPerWeek },
    { idx: 6, name: 'start_date', type: 'vector<u8>', value: applicationData.startDate, length: applicationData.startDate.length },
    { idx: 7, name: 'expected_duration_weeks', type: 'u64', value: applicationData.expectedDurationWeeks },
    { idx: 8, name: 'proposal_summary', type: 'vector<u8>', value: applicationData.proposalSummary.substring(0, 50) + '...', length: applicationData.proposalSummary.length },
    { idx: 9, name: 'requested_compensation', type: 'u64', value: applicationData.requestedCompensation },
    { idx: 10, name: 'milestones_count', type: 'u64', value: applicationData.milestonesCount },
    { idx: 11, name: 'github_repo_link', type: 'vector<u8>', value: applicationData.githubRepoLink, length: applicationData.githubRepoLink.length },
    { idx: 12, name: 'on_chain_address', type: 'address', value: applicationData.onChainAddress },
    { idx: 13, name: 'team_members', type: 'vector<vector<u8>>', value: applicationData.teamMembers, count: applicationData.teamMembers.length },
    { idx: 14, name: 'cover_letter_walrus_blob_id', type: 'Option<vector<u8>>', value: applicationData.coverLetterWalrusBlobId || null },
    { idx: 15, name: 'portfolio_walrus_blob_ids', type: 'vector<vector<u8>>', value: applicationData.portfolioWalrusBlobIds, count: applicationData.portfolioWalrusBlobIds.length },
    { idx: 16, name: 'opportunity_title', type: 'vector<u8>', value: applicationData.opportunityTitle, length: applicationData.opportunityTitle.length },
    { idx: 17, name: 'proposal_title', type: 'vector<u8>', value: applicationData.proposalTitle, length: applicationData.proposalTitle.length },
    { idx: 18, name: 'team_name', type: 'vector<u8>', value: applicationData.teamName, length: applicationData.teamName.length },
    { idx: 19, name: 'contact_email', type: 'vector<u8>', value: applicationData.contactEmail, length: applicationData.contactEmail.length },
    { idx: 20, name: 'summary', type: 'vector<u8>', value: applicationData.summary.substring(0, 50) + '...', length: applicationData.summary.length },
    { idx: 21, name: 'budget', type: 'u64', value: applicationData.budget },
    { idx: 22, name: 'timeline_weeks', type: 'u64', value: applicationData.timelineWeeks },
    { idx: 23, name: 'methodology', type: 'vector<u8>', value: applicationData.methodology.substring(0, 50) + '...', length: applicationData.methodology.length },
    { idx: 24, name: 'clock', type: '&Clock', value: SUI_CLOCK_OBJECT_ID }
  ];
  
  console.log('  Pure arguments (arg_idx 3-24):');
  pureArgs.forEach(arg => {
    console.log(`    arg_idx ${arg.idx} (${arg.name}):`, {
      expectedType: arg.type,
      value: arg.value,
      ...(arg.length !== undefined && { length: arg.length }),
      ...(arg.count !== undefined && { count: arg.count })
    });
  });
  
  console.log('📊 Total arguments count:', 25, '(0-24)');
  console.log('📊 Object arguments:', 4, '(devhub, user_proposals, proposals_by_status, clock)');
  console.log('📊 Pure arguments:', 21);

  // Build all arguments array
  const moveCallArgs = [
    arg0_devhub, // arg_idx 0: &mut DevHub (shared object, but constant ID works with tx.object)
    arg1_userProposals, // arg_idx 1: &mut UserProposals (owned object)
    proposalsByStatusArg, // arg_idx 2: &mut ProposalsByStatus (shared object - MUST use sharedObjectRef)
      tx.pure.u64(projectId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.yourRole))),
      tx.pure.u64(applicationData.availabilityHrsPerWeek),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.startDate))),
      tx.pure.u64(applicationData.expectedDurationWeeks),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.proposalSummary))),
      tx.pure.u64(applicationData.requestedCompensation),
      tx.pure.u64(applicationData.milestonesCount),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.githubRepoLink))),
      tx.pure.address(applicationData.onChainAddress),
      tx.pure.vector('vector<u8>', applicationData.teamMembers.map(member => Array.from(new TextEncoder().encode(member)))),
      tx.pure.option('vector<u8>', applicationData.coverLetterWalrusBlobId ? Array.from(new TextEncoder().encode(applicationData.coverLetterWalrusBlobId)) : null),
      tx.pure.vector('vector<u8>', applicationData.portfolioWalrusBlobIds.map(id => Array.from(new TextEncoder().encode(id)))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.opportunityTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.proposalTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.teamName))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.contactEmail))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.summary))),
      tx.pure.u64(applicationData.budget),
      tx.pure.u64(applicationData.timelineWeeks),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(applicationData.methodology))),
      tx.object(SUI_CLOCK_OBJECT_ID), // arg_idx 24: &Clock
    ];
  
  // Log final arguments array
  console.log('📦 Final Arguments Array:', {
    totalArgs: moveCallArgs.length,
    argTypes: moveCallArgs.map((arg, idx) => ({
      idx,
      type: 'type' in arg ? arg.type : 'unknown',
      isInput: arg.$kind === 'Input',
      inputIndex: arg.$kind === 'Input' ? arg.Input : undefined,
      isSharedRef: idx === 2 ? true : false
    }))
  });
  
  // Validate arg_idx 2 is a shared object reference
  const arg2 = moveCallArgs[2];
  if (arg2.$kind !== 'Input' || ('type' in arg2 && arg2.type !== 'object')) {
    console.error('❌ CRITICAL: arg_idx 2 is not a valid Input object!', arg2);
    throw new Error('arg_idx 2 (proposals_by_status) must be a shared object reference');
  }
  
  console.log('✅ All arguments validated. Building moveCall...');
  
  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.APPLY_TO_PROJECT}`,
    arguments: moveCallArgs,
  });
  
  // Log transaction structure and inputs in detail
  try {
    const txData = (tx as any).blockData;
    console.log('📄 Transaction Structure:', {
      hasBlockData: !!txData,
      commandsCount: txData?.transactions?.length || 0,
      gasBudget: txData?.gasConfig?.budget || 'not set',
      inputsCount: txData?.inputs?.length || 0,
      firstCommand: txData?.transactions?.[0] ? {
        kind: txData.transactions[0].kind,
        target: txData.transactions[0].MoveCall?.package || txData.transactions[0].MoveCall?.module || 'unknown',
        function: txData.transactions[0].MoveCall?.function,
        argumentsCount: txData.transactions[0].MoveCall?.arguments?.length || 0
      } : null
    });
    
    // Log ALL inputs in detail - this is critical for debugging
    if (txData?.inputs) {
      console.log('📥 ALL Transaction Inputs (before serialization):', txData.inputs.map((input: any, idx: number) => {
        const result: any = {
          inputIndex: idx,
          type: input.type || 'unknown',
          rawInput: input // Include raw input for debugging
        };
        
        if (input.type === 'object') {
          if (input.value) {
            result.objectType = input.value.objectType;
            result.objectId = input.value.objectId;
            if (input.value.objectType === 'sharedObject') {
              result.initialSharedVersion = input.value.initialSharedVersion;
              result.mutable = input.value.mutable;
              result.isSharedObject = true;
            } else {
              result.version = input.value.version;
              result.digest = input.value.digest;
            }
          } else {
            // Direct object reference
            result.objectId = input.objectId;
            result.objectType = input.objectType;
            if (input.objectType === 'sharedObject') {
              result.initialSharedVersion = input.initialSharedVersion;
              result.mutable = input.mutable;
              result.isSharedObject = true;
            }
          }
        } else if (input.type === 'pure') {
          result.valueType = typeof input.value;
          result.value = input.value;
        }
        
        return result;
      }));
      
      // Specifically check for proposalsByStatusId
      const proposalsByStatusInputIdx = txData.inputs.findIndex((input: any) => {
        if (input.type !== 'object') return false;
        const objectId = input.value?.objectId || input.objectId;
        return objectId === proposalsByStatusId;
      });
      console.log('🔍 ProposalsByStatus Input Search:', {
        proposalsByStatusId,
        foundAtIndex: proposalsByStatusInputIdx,
        inputAtThatIndex: proposalsByStatusInputIdx >= 0 ? txData.inputs[proposalsByStatusInputIdx] : null
      });
    }
    
    // Log the first command's arguments and map them to inputs
    if (txData?.transactions?.[0]?.MoveCall?.arguments) {
      const args = txData.transactions[0].MoveCall.arguments;
      console.log('📋 MoveCall Arguments -> Input Mapping:');
      args.forEach((arg: any, argIdx: number) => {
        const argInfo: any = {
          argIndex: argIdx,
          argType: typeof arg
        };
        
        // Check if it's an Input reference
        if (arg && typeof arg === 'object' && 'Input' in arg) {
          const inputIdx = arg.Input;
          argInfo.isInput = true;
          argInfo.inputIndex = inputIdx;
          
          // Get the actual input
          if (txData.inputs && txData.inputs[inputIdx]) {
            const actualInput = txData.inputs[inputIdx];
            argInfo.actualInputType = actualInput.type;
            if (actualInput.type === 'object') {
              if (actualInput.value) {
                argInfo.actualObjectType = actualInput.value.objectType;
                argInfo.actualObjectId = actualInput.value.objectId;
                if (actualInput.value.objectType === 'sharedObject') {
                  argInfo.actualInitialSharedVersion = actualInput.value.initialSharedVersion;
                  argInfo.actualMutable = actualInput.value.mutable;
                }
              } else {
                argInfo.actualObjectType = actualInput.objectType;
                argInfo.actualObjectId = actualInput.objectId;
              }
            }
          }
        } else {
          argInfo.isPure = true;
          argInfo.value = arg;
        }
        
        console.log(`  arg_idx ${argIdx}:`, argInfo);
      });
    }
  } catch (e) {
    console.warn('⚠️ Could not inspect transaction structure:', e);
  }

  return tx;
}

// Helper function to open applications
export function openApplicationsTransaction(projectId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.OPEN_APPLICATIONS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(projectId),
    ],
  });

  return tx;
}

// Helper function to close applications
export function closeApplicationsTransaction(projectId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CLOSE_APPLICATIONS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(projectId),
    ],
  });

  return tx;
}

// Helper function to update project status
export function updateProjectStatusTransaction(
  projectId: number,
  newStatus: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_PROJECT_STATUS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(projectId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newStatus))),
    ],
  });

  return tx;
}

// Helper function to update project
export function updateProjectTransaction(
  projectId: number,
  projectData: {
    title: string;
    shortSummary: string;
    description: string;
    category: string;
    experienceLevel: string;
    budgetMin: number;
    budgetMax: number;
    timelineWeeks: number;
    requiredSkills: string[];
    applicationsStatus: string;
  }
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_PROJECT}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(projectId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.title))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.shortSummary))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.description))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.category))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.experienceLevel))),
      tx.pure.u64(projectData.budgetMin),
      tx.pure.u64(projectData.budgetMax),
      tx.pure.u64(projectData.timelineWeeks),
      tx.pure.vector('vector<u8>', projectData.requiredSkills.map(skill => Array.from(new TextEncoder().encode(skill)))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(projectData.applicationsStatus))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add attachment to project
export function addAttachmentToProjectTransaction(
  projectId: string,
  blobId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_ATTACHMENT}`,
    arguments: [
      tx.object(projectId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(blobId))),
    ],
  });

  return tx;
}

// Helper function to remove attachment from project
export function removeAttachmentFromProjectTransaction(
  projectId: string,
  blobId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.REMOVE_ATTACHMENT}`,
    arguments: [
      tx.object(projectId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(blobId))),
    ],
  });

  return tx;
}

// Helper function to update a project application status (called by project owner)
export function updateApplicationStatusTransaction(
  projectId: number,
  applicantAddress: string,
  newStatus: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_APPLICATION_STATUS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(projectId),
      tx.pure.address(applicantAddress),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newStatus))),
    ],
  });

  return tx;
}

