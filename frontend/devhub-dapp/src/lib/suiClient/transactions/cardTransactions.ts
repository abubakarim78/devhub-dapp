import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS, getCurrentPackageId } from '../constants';

// Helper function to create transaction block for card creation
export function createCardTransaction(
  cardData: {
    name: string;
    niche: string;
    customNiche?: string;
    imageUrl: string;
    yearsOfExperience: number;
    technologies: string;
    portfolio: string;
    about: string;
    featuredProjects: string[];
    contact: string;
    github: string;
    linkedin: string;
    twitter: string;
    personalWebsite: string;
    workTypes: string[];
    hourlyRate: number | null;
    locationPreference: string;
    availability: string;
    languages: string[];
    avatarWalrusBlobId: string | null;
  },
  paymentCoinId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.CREATE_CARD}`,
    arguments: [
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.niche))),
      tx.pure.option('vector<u8>', cardData.customNiche ? Array.from(new TextEncoder().encode(cardData.customNiche)) : null),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.imageUrl))),
      tx.pure.u8(cardData.yearsOfExperience),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.technologies))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.portfolio))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.about))),
      tx.pure.vector('string', cardData.featuredProjects),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.contact))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.github))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.linkedin))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.twitter))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.personalWebsite))),
      tx.pure.vector('string', cardData.workTypes),
      tx.pure.option('u64', cardData.hourlyRate),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.locationPreference))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.availability))),
      tx.pure.vector('string', cardData.languages),
      tx.pure.option(
        'vector<u8>',
        cardData.avatarWalrusBlobId
          ? Array.from(new TextEncoder().encode(cardData.avatarWalrusBlobId))
          : null
      ),
      tx.object(paymentCoinId),
      tx.object(SUI_CLOCK_OBJECT_ID),
      tx.object(DEVHUB_OBJECT_ID),
    ],
  });
  return tx;
}

// Helper function to delete user's card
export function deleteCardTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.DELETE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

// Helper function to update card
export function updateCardTransaction(
  cardId: number,
  cardData: {
    name: string;
    niche: string;
    customNiche?: string;
    about: string;
    imageUrl: string;
    technologies: string;
    contact: string;
    portfolio: string;
    featuredProjects: string[];
    languages: string[];
    openToWork: boolean;
    yearsOfExperience: number;
    workTypes: string[];
    hourlyRate: number | null;
    locationPreference: string;
    availability: string;
    github: string;
    linkedin: string;
    twitter: string;
    personalWebsite: string;
  }
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.niche))),
      tx.pure.option('vector<u8>', cardData.customNiche ? Array.from(new TextEncoder().encode(cardData.customNiche)) : null),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.about))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.imageUrl))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.technologies))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.contact))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.portfolio))),
      tx.pure.vector('string', cardData.featuredProjects),
      tx.pure.vector('string', cardData.languages),
      tx.pure.bool(cardData.openToWork),
      tx.pure.u8(cardData.yearsOfExperience),
      tx.pure.vector('string', cardData.workTypes),
      tx.pure.option('u64', cardData.hourlyRate),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.locationPreference))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.availability))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.github))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.linkedin))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.twitter))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(cardData.personalWebsite))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to update avatar Walrus blob
export function updateAvatarWalrusBlobTransaction(
  cardId: number,
  newBlobId: string | null
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_AVATAR_WALRUS_BLOB}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.option('vector<u8>', newBlobId ? Array.from(new TextEncoder().encode(newBlobId)) : null),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to activate card
export function activateCardTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ACTIVATE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

// Helper function to deactivate card
export function deactivateCardTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.DEACTIVATE_CARD}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

// Helper function to add skill
export function addSkillTransaction(
  cardId: number,
  skillName: string,
  proficiency: number,
  yearsExp: number
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_SKILL}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(skillName))),
      tx.pure.u8(proficiency),
      tx.pure.u8(yearsExp),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to remove skill
export function removeSkillTransaction(
  cardId: number,
  skillIndex: number
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.REMOVE_SKILL}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.u64(skillIndex),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to add review
export function addReviewTransaction(
  cardId: number,
  rating: number,
  reviewText?: string
) {
  const tx = new Transaction();

  // Convert review text to Option<String>
  const hasReviewText = reviewText && reviewText.trim().length > 0;

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.ADD_REVIEW}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.u8(rating),
      hasReviewText
        ? tx.pure.option('string', reviewText.trim())
        : tx.pure.option('string', null),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to track profile view
export function trackProfileViewTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.TRACK_PROFILE_VIEW}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to track contact click
export function trackContactClickTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.TRACK_CONTACT_CLICK}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

// Helper function to update work preferences
export function updateWorkPreferencesTransaction(
  cardId: number,
  workTypes: string[],
  hourlyRate: number | null,
  locationPreference: string,
  availability: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_WORK_PREFERENCES}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.vector('string', workTypes),
      tx.pure.option('u64', hourlyRate),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(locationPreference))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(availability))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to update social links
export function updateSocialLinksTransaction(
  cardId: number,
  github: string,
  linkedin: string,
  twitter: string,
  personalWebsite: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_SOCIAL_LINKS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(github))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(linkedin))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(twitter))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(personalWebsite))),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to update languages
export function updateLanguagesTransaction(
  cardId: number,
  languages: string[]
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_LANGUAGES}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.vector('string', languages),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to update featured projects
export function updateFeaturedProjectsTransaction(
  cardId: number,
  featuredProjects: string[]
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UPDATE_FEATURED_PROJECTS}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
      tx.pure.vector('string', featuredProjects),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

// Helper function to verify professional
export function verifyProfessionalTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.VERIFY_PROFESSIONAL}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

// Helper function to unverify professional
export function unverifyProfessionalTransaction(cardId: number) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${getCurrentPackageId()}::devhub::${CONTRACT_FUNCTIONS.UNVERIFY_PROFESSIONAL}`,
    arguments: [
      tx.object(DEVHUB_OBJECT_ID),
      tx.pure.u64(cardId),
    ],
  });

  return tx;
}

