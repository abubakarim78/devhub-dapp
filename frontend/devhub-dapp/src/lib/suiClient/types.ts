export interface DevCardData {
  id: number;
  owner: string;
  name: string;
  niche: string;
  about?: string;
  description: string;
  imageUrl: string;
  avatarWalrusBlobId?: string;
  skills: SkillLevel[];
  yearsOfExperience: number;
  technologies: string;
  workPreferences: WorkPreferences;
  contact: string;
  socialLinks: SocialLinks;
  portfolio: string;
  featuredProjects: FeaturedProject[];
  languages: string[];
  openToWork: boolean;
  isActive: boolean;
  verified: boolean;
  reviews: Review[];
  createdAt: number;
  lastUpdated: number;
  analytics: ProfileAnalytics;
}

export interface SkillLevel {
  skill: string;
  proficiency: number; // 1-10 scale
  yearsExperience: number;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  personalWebsite?: string;
}

export interface WorkPreferences {
  workTypes: string[];
  hourlyRate?: number;
  locationPreference: string;
  availability: string;
}

export interface ProfileAnalytics {
  totalViews: number;
  profileViews: number;
  contactClicks: number;
  projectApplications: number;
  totalReviews: number;
  averageRating: number;
  lastViewReset: number;
}

export interface Review {
  reviewer: string;
  rating: number; // 1-5
  review_text?: string;
  timestamp: number;
}

export interface FeaturedProject {
  title: string;
  description: string;
  source: string;
  thumbnail: string;
}

export interface Project {
  id: string;
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
  owner: string;
  visibility: string;
  applicationsStatus: string;
  devhubMessagesEnabled: boolean;
  creationTimestamp: number;
  attachmentsWalrusBlobIds: string[];
  // New fields from redesigned form
  keyDeliverables: string;
  complexityLevel: string;
  paymentModel: string;
  preferredStartWindow: string;
  niceToHaveSkills: string[];
  repoOrSpecLink: string;
  applicationType: string;
  finalNotes: string;
}

export interface ProjectApplication {
  id: string;
  // Numeric project index in DevHub.projects table (used on-chain)
  projectId: string;
  // Optional on-chain Project ID object (for reference / debug)
  projectObjectId?: string;
  applicantAddress: string;
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
  applicationStatus: string;
  submissionTimestamp: number;
  coverLetterWalrusBlobId?: string;
  portfolioWalrusBlobIds: string[];
  proposalId?: string;
}

export interface Proposal {
  id: string;
  opportunityTitle: string;
  proposalTitle: string;
  teamName: string;
  contactEmail: string;
  summary: string;
  budget: number;
  timelineWeeks: number;
  status: string;
  createdAt: number;
  lastUpdated: number;
  ownerAddress: string;
  keyDeliverables: Deliverable[];
  methodology: string;
  milestones: Milestone[];
  teamMembers: TeamMember[];
  links: Link[];
  comments: Comment[];
  files: File[];
}

export interface Milestone {
  description: string;
  dueDate: number;
  budget: number;
}

export interface Deliverable {
  description: string;
  dueDate: number;
  budgetAllocation: number;
}

export interface TeamMember {
  name: string;
  suiAddress: string;
}

export interface Link {
  url: string;
}

export interface Comment {
  authorAddress: string;
  timestamp: number;
  text: string;
}

export interface File {
  name: string;
  fileType: string;
  sizeKb: number;
  url: string;
  walrusBlobId?: string;
}

export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  messages: Message[];
}

export interface Message {
  sender: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  key?: Uint8Array; // Add key for decryption
}

export interface Connection {
  user: string;
  status: string;
  notificationsEnabled: boolean;
  profileShared: boolean;
  messagesAllowed: boolean;
}

export interface ConnectionRequest {
  id: string;
  from: string;
  to: string;
  introMessage: string;
  sharedContext: string;
  isPublic: boolean;
  status: string;
}

export interface PlatformStatistics {
  totalSubmitted: number;
  activeInReview: number;
  acceptedCount: number;
  rejectedCount: number;
  declinedCount: number;
}

export interface UserProposals {
  owner: string;
  proposals: string[];
}

export interface ProposalsByStatus {
  draft: string[];
  inReview: string[];
  accepted: string[];
  rejected: string[];
  declined: string[];
}

