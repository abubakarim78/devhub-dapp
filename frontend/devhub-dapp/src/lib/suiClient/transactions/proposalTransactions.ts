import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';

// Helper function to create proposal
export function createProposalTransaction(
  proposalData: {
    opportunityTitle: string;
    proposalTitle: string;
    teamName: string;
    contactEmail: string;
    summary: string;
    budget: number;
    timelineWeeks: number;
    methodology: string;
  }
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CREATE_PROPOSAL}`,
    arguments: [
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.opportunityTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.proposalTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.teamName))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.contactEmail))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.summary))),
      tx.pure.u64(proposalData.budget),
      tx.pure.u64(proposalData.timelineWeeks),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.methodology))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to edit proposal
export function editProposalTransaction(
  proposalId: string,
  proposalData: {
    opportunityTitle: string;
    proposalTitle: string;
    teamName: string;
    contactEmail: string;
    summary: string;
    budget: number;
    timelineWeeks: number;
    methodology: string;
  }
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.EDIT_PROPOSAL}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.opportunityTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.proposalTitle))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.teamName))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.contactEmail))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.summary))),
      tx.pure.u64(proposalData.budget),
      tx.pure.u64(proposalData.timelineWeeks),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(proposalData.methodology))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add deliverable
export function addDeliverableTransaction(
  proposalId: string,
  description: string,
  dueDate: number,
  budgetAllocation: number
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_DELIVERABLE}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(description))),
      tx.pure.u64(dueDate),
      tx.pure.u64(budgetAllocation),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add team member
export function addTeamMemberTransaction(
  proposalId: string,
  name: string,
  suiAddress: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_TEAM_MEMBER}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))),
      tx.pure.address(suiAddress),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add link
export function addLinkTransaction(
  proposalId: string,
  url: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_LINK}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(url))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to submit proposal
export function submitProposalTransaction(
  proposalId: string,
  platformStatisticsId: string,
  proposalsByStatusId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.SUBMIT_PROPOSAL}`,
    arguments: [
      tx.object(proposalId),
      tx.object(platformStatisticsId),
      tx.object(proposalsByStatusId),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to update proposal status
export function updateProposalStatusTransaction(
  proposalId: string,
  platformStatisticsId: string,
  proposalsByStatusId: string,
  newStatus: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_PROPOSAL_STATUS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.object(proposalId),
      tx.object(platformStatisticsId),
      tx.object(proposalsByStatusId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(newStatus))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add discussion comment
export function addDiscussionCommentTransaction(
  proposalId: string,
  text: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_DISCUSSION_COMMENT}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(text))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add attachment to proposal
export function addAttachmentToProposalTransaction(
  proposalId: string,
  name: string,
  fileType: string,
  sizeKb: number,
  url: string,
  walrusBlobId?: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_ATTACHMENT_TO_PROPOSAL}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(fileType))),
      tx.pure.u64(sizeKb),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(url))),
      tx.pure.option('vector<u8>', walrusBlobId ? Array.from(new TextEncoder().encode(walrusBlobId)) : null),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add milestone to proposal
export function addMilestoneToProposalTransaction(
  proposalId: string,
  description: string,
  dueDate: number,
  budget: number
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_MILESTONE_TO_PROPOSAL}`,
    arguments: [
      tx.object(proposalId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(description))),
      tx.pure.u64(dueDate),
      tx.pure.u64(budget),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

