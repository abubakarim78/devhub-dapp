import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Contract configuration
// Package ID - Updated after upgrade (Version 3 on-chain, VERSION = 2 in code)
export const PACKAGE_ID = '0x5ea66000fe623041b4231cd641aa7e1ba6781a52cfebb1cbc3e9dbcdfdb585c2';
// Previous Package IDs - kept for reference
export const PREVIOUS_PACKAGE_ID_V2 = '0x23aa50e2202d3d6b90378998f9a74a067ff6f475ce1dd4e4de6f7e773d0e2dbd';
export const PREVIOUS_PACKAGE_ID_V1 = '0x43096e49e837fdf621305180a32f20c8ce8526583dbd363d05aeb852cb3693cb';
// DevHub shared object ID - persists across upgrades
export const DEVHUB_OBJECT_ID = '0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40';
// UpgradeCap ID - persists across upgrades (same ID, updated version)
export const UPGRADE_CAP_ID = '0x44537dc5782da090b1981af922dbddc8ef1a3c4213066f28864e78b430cd6d36';
// AdminCap ID - needed for migrations
export const ADMIN_CAP_ID = '0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c';
// LocalStorage keys for upgrade management
export const UPGRADE_CAP_ID_KEY = 'devhub_upgrade_cap_id';
export const ADMIN_CAP_ID_KEY = 'devhub_admin_cap_id';
// ConnectionStore is a shared object - we'll query for it dynamically
export const CONNECTION_STORE_ID = ''; // Will be fetched dynamically
export const PLATFORM_FEE = 100_000_000; // 0.1 SUI in MIST
export const PROJECT_POSTING_FEE = 200_000_000; // 0.2 SUI in MIST
export const MIN_GAS_BALANCE = 100_000_000; // 0.1 SUI in MIST - minimum for gas

// Initialize Sui client with messaging SDK
// Using a CORS-enabled RPC endpoint for browser compatibility
// Set VITE_SUI_RPC_URL in .env file to use a CORS-enabled endpoint
// Alternative endpoints: https://testnet.sui.chainbase.online/v1
const RPC_URL = import.meta.env.VITE_SUI_RPC_URL || getFullnodeUrl('testnet');

export const suiClient = new SuiClient({
  url: RPC_URL,
  mvr: {
    overrides: {
      packages: {
        '@local-pkg/sui-stack-messaging': '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d',
      },
    },
  },
}) as any; // Type assertion to handle compatibility issues

// Contract function names
export const CONTRACT_FUNCTIONS = {
  // Card functions
  CREATE_CARD: 'create_card',
  UPDATE_CARD: 'update_card',
  DELETE_CARD: 'delete_card',
  ACTIVATE_CARD: 'activate_card',
  DEACTIVATE_CARD: 'deactivate_card',
  UPDATE_AVATAR_WALRUS_BLOB: 'update_avatar_walrus_blob',
  ADD_SKILL: 'add_skill',
  REMOVE_SKILL: 'remove_skill',
  ADD_REVIEW: 'add_review',
  TRACK_PROFILE_VIEW: 'track_profile_view_entry', // Using entry wrapper to call the public function
  TRACK_CONTACT_CLICK: 'track_contact_click',
  UPDATE_WORK_PREFERENCES: 'update_work_preferences',
  UPDATE_SOCIAL_LINKS: 'update_social_links',
  UPDATE_LANGUAGES: 'update_languages',
  UPDATE_FEATURED_PROJECTS: 'update_featured_projects',
  VERIFY_PROFESSIONAL: 'verify_professional',
  UNVERIFY_PROFESSIONAL: 'unverify_professional',

  // Project functions
  CREATE_PROJECT: 'create_project',
  UPDATE_PROJECT: 'update_project',
  APPLY_TO_PROJECT: 'apply_to_project',
  OPEN_APPLICATIONS: 'open_applications',
  CLOSE_APPLICATIONS: 'close_applications',
  UPDATE_PROJECT_STATUS: 'update_project_status',
  ADD_ATTACHMENT: 'add_attachment',
  REMOVE_ATTACHMENT: 'remove_attachment',
  UPDATE_APPLICATION_STATUS: 'update_application_status',

  // Proposal functions
  CREATE_PROPOSAL: 'create_proposal',
  EDIT_PROPOSAL: 'edit_proposal',
  ADD_DELIVERABLE: 'add_deliverable',
  ADD_TEAM_MEMBER: 'add_team_member',
  ADD_LINK: 'add_link',
  SUBMIT_PROPOSAL: 'submit_proposal',
  UPDATE_PROPOSAL_STATUS: 'update_proposal_status',
  ADD_DISCUSSION_COMMENT: 'add_discussion_comment',
  ADD_ATTACHMENT_TO_PROPOSAL: 'add_attachment_to_proposal',
  ADD_MILESTONE_TO_PROPOSAL: 'add_milestone_to_proposal',

  // Messaging functions
  START_CONVERSATION: 'start_conversation',
  SEND_MESSAGE: 'send_message',
  MARK_AS_READ: 'mark_as_read',

  // New channel management functions for SDK compatibility
  CREATE_CHANNEL: 'create_channel',
  SEND_MESSAGE_TO_CHANNEL: 'send_message_to_channel',
  ADD_MEMBER_TO_CHANNEL: 'add_member_to_channel',
  REMOVE_MEMBER_FROM_CHANNEL: 'remove_member_from_channel',

  // Connection functions
  CREATE_CONNECTION_STORE: 'create_connection_store',
  SEND_CONNECTION_REQUEST: 'send_connection_request',
  ACCEPT_CONNECTION_REQUEST: 'accept_connection_request',
  DECLINE_CONNECTION_REQUEST: 'decline_connection_request',
  UPDATE_CONNECTION_PREFERENCES: 'update_connection_preferences',
  UPDATE_CONNECTION_STATUS: 'update_connection_status',

  // Admin functions
  GRANT_ADMIN_ROLE: 'grant_admin_role',
  REVOKE_ADMIN_ROLE: 'revoke_admin_role',
  WITHDRAW_PLATFORM_FEES: 'withdraw_platform_fees',
  CHANGE_PLATFORM_FEE: 'change_platform_fee',
  IS_ADMIN: 'is_admin',
  IS_SUPER_ADMIN: 'is_super_admin',

  // Upgrade functions
  MIGRATE: 'migrate',
  GET_VERSION: 'get_version',
  GET_ADMIN_CAP_ID: 'get_admin_cap_id',
  GET_PACKAGE_VERSION: 'get_package_version',

  // View functions
  GET_CARD_INFO: 'get_card_info',
  GET_CARD_SKILLS: 'get_card_skills',
  GET_CARD_REVIEWS: 'get_card_reviews',
  GET_CARD_COUNT: 'get_card_count',
  GET_PROJECT_INFO: 'get_project_info',
  GET_PROJECT_APPLICATIONS: 'get_project_applications',
  GET_PROJECT_COUNT: 'get_project_count',
  GET_SUPER_ADMIN: 'get_super_admin',
  GET_ADMINS: 'get_admins',
  GET_PLATFORM_FEE_BALANCE: 'get_platform_fee_balance',
  GET_PLATFORM_FEE: 'get_platform_fee',
  GET_PROJECT_POSTING_FEE: 'get_project_posting_fee',
  GET_PLATFORM_STATS: 'get_platform_stats',
  GET_DETAILED_ANALYTICS: 'get_detailed_analytics',
  GET_WORK_PREFERENCES: 'get_work_preferences',
  GET_SOCIAL_LINKS: 'get_social_links',
  GET_LANGUAGES: 'get_languages',
  GET_CONVERSATION_MESSAGES: 'get_conversation_messages',
  GET_CONNECTIONS: 'get_connections',
  IS_CONNECTED: 'is_connected',
  GET_PROPOSAL_DETAILS: 'get_proposal_details',
  GET_USER_PROPOSALS: 'get_user_proposals',
  GET_PROPOSALS_BY_STATUS: 'get_proposals_by_status',
  GET_PLATFORM_STATISTICS: 'get_platform_statistics',

  // Search functions
  SEARCH_CARDS_BY_SKILL: 'search_cards_by_skill',
  SEARCH_CARDS_BY_LOCATION: 'search_cards_by_location',
  SEARCH_CARDS_BY_WORK_TYPE: 'search_cards_by_work_type',
  SEARCH_CARDS_BY_NICHE: 'search_cards_by_niche',
  SEARCH_PROJECTS_BY_SKILL: 'search_projects_by_skill',
  GET_AVAILABLE_DEVELOPERS: 'get_available_developers',
  GET_OPEN_PROJECTS: 'get_open_projects',
  GET_UI_UX_DESIGNERS: 'get_ui_ux_designers',
  GET_CONTENT_CREATORS: 'get_content_creators',
  GET_DEVOPS_PROFESSIONALS: 'get_devops_professionals',
  GET_PROJECT_MANAGERS: 'get_project_managers',
  GET_COMMUNITY_MANAGERS: 'get_community_managers',
  GET_DEVELOPMENT_DIRECTORS: 'get_development_directors',
  GET_PRODUCT_MANAGERS: 'get_product_managers',
  GET_MARKETING_SPECIALISTS: 'get_marketing_specialists',
  GET_BUSINESS_ANALYSTS: 'get_business_analysts',
  GET_CUSTOM_NICHES: 'get_custom_niches',
  GET_ALL_NICHES_IN_USE: 'get_all_niches_in_use',
  GET_AVAILABLE_NICHES: 'get_available_niches',
  IS_CUSTOM_NICHE: 'is_custom_niche',

  // Object creation functions
  CREATE_PLATFORM_STATISTICS: 'create_platform_statistics',
  CREATE_PROPOSALS_BY_STATUS: 'create_proposals_by_status',
  CREATE_USER_PROPOSALS_OBJECT: 'create_user_proposals_object',
};

// Get or find connection store ID
export async function getConnectionStoreId(): Promise<string | null> {
  try {
    console.log('Querying for ConnectionStore objects...');
    console.log('Using package ID:', PACKAGE_ID);

    // Check if we have a stored ConnectionStore ID
    const storedId = localStorage.getItem('devhub_connection_store_id');
    if (storedId) {
      console.log('Found stored ConnectionStore ID:', storedId);
      try {
        const obj = await suiClient.getObject({
          id: storedId,
          options: { showType: true },
        });
        const type = obj.data?.type || '';
        if (typeof type === 'string' && type.includes('::connections::ConnectionStore')) {
          return storedId;
        }
        console.warn('Stored ConnectionStore ID is invalid type:', type, 'clearing cache');
        localStorage.removeItem('devhub_connection_store_id');
      } catch (e) {
        console.warn('Failed to validate stored ConnectionStore ID, clearing cache', e);
        localStorage.removeItem('devhub_connection_store_id');
      }
    }

    // Try to query for ConnectionStoreCreated events
    try {
      const currentPackageId = getCurrentPackageId();
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${currentPackageId}::connections::ConnectionStoreCreated`
        },
        limit: 1,
        order: 'descending'
      });

      console.log('ConnectionStoreCreated events:', events);

      if (events.data && events.data.length > 0) {
        const eventData = events.data[0].parsedJson as any;
        if (eventData && eventData.store_id) {
          console.log('Found ConnectionStore ID from events:', eventData.store_id);
          // Store it for future use
          storeConnectionStoreId(eventData.store_id);
          return eventData.store_id;
        }
      }
    } catch (eventError) {
      console.log('Error querying ConnectionStoreCreated events:', eventError);
    }

    console.log('No ConnectionStore found - will be created if needed');
    return null;
  } catch (error) {
    console.error('Error finding connection store:', error);
    return null;
  }
}

// Store connection store ID
export function storeConnectionStoreId(storeId: string): void {
  localStorage.setItem('devhub_connection_store_id', storeId);
  console.log('Stored ConnectionStore ID:', storeId);
}

// ===== UPGRADE CAP MANAGEMENT =====

/**
 * Get the UpgradeCap ID (prefers localStorage, falls back to constant)
 */
export function getUpgradeCapId(): string {
  const stored = localStorage.getItem(UPGRADE_CAP_ID_KEY);
  return stored || UPGRADE_CAP_ID;
}

/**
 * Store the UpgradeCap ID in localStorage
 */
export function storeUpgradeCapId(upgradeCapId: string): void {
  localStorage.setItem(UPGRADE_CAP_ID_KEY, upgradeCapId);
  console.log('Stored UpgradeCap ID:', upgradeCapId);
}

/**
 * Get the AdminCap ID (prefers localStorage, falls back to constant)
 */
export function getAdminCapId(): string {
  const stored = localStorage.getItem(ADMIN_CAP_ID_KEY);
  return stored || ADMIN_CAP_ID;
}

/**
 * Store the AdminCap ID in localStorage
 */
export function storeAdminCapId(adminCapId: string): void {
  localStorage.setItem(ADMIN_CAP_ID_KEY, adminCapId);
  console.log('Stored AdminCap ID:', adminCapId);
}

/**
 * Update the package ID after an upgrade
 */
export function updatePackageId(newPackageId: string): void {
  console.log('Package upgraded to:', newPackageId);
  localStorage.setItem('devhub_package_id', newPackageId);
}

/**
 * Get the current package ID (from localStorage if updated, otherwise default)
 */
export function getCurrentPackageId(): string {
  const stored = localStorage.getItem('devhub_package_id');
  const packageId = stored || PACKAGE_ID;
  
  // Safety check: if stored package ID matches a known old package ID, use current one
  if (stored === PREVIOUS_PACKAGE_ID_V1 || stored === PREVIOUS_PACKAGE_ID_V2) {
    console.warn(`⚠️ Detected old package ID in localStorage (${stored}), using current package ID: ${PACKAGE_ID}`);
    // Optionally auto-update to prevent future issues
    updatePackageId(PACKAGE_ID);
    return PACKAGE_ID;
  }
  
  return packageId;
}

/**
 * Initialize upgrade info from publish transaction
 * Call this after publishing to store all IDs
 */
export function initializeUpgradeInfo(
  upgradeCapId?: string,
  adminCapId?: string,
  packageId?: string,
  devhubObjectId?: string
): void {
  if (upgradeCapId) storeUpgradeCapId(upgradeCapId);
  if (adminCapId) storeAdminCapId(adminCapId);
  if (packageId) updatePackageId(packageId);
  console.log('Upgrade info initialized:', {
    upgradeCapId: upgradeCapId || UPGRADE_CAP_ID,
    adminCapId: adminCapId || ADMIN_CAP_ID,
    packageId: packageId || PACKAGE_ID,
    devhubObjectId: devhubObjectId || DEVHUB_OBJECT_ID,
  });
}

