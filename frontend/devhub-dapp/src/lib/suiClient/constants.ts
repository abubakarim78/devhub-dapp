import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Contract configuration
export const PACKAGE_ID = '0x25aedeaa9e734753ca0ee96b5a7ebbdd88ddcc67b1bdd373e908a4b9d87bbbbf';
export const DEVHUB_OBJECT_ID = '0xc46150ba438f351dfdb4c42aeb588fce0f58b282e50e9f5809555977c79ca94d';
// ConnectionStore is a shared object - we'll query for it dynamically
export const CONNECTION_STORE_ID = ''; // Will be fetched dynamically
export const PLATFORM_FEE = 100_000_000; // 0.1 SUI in MIST
export const PROJECT_POSTING_FEE = 200_000_000; // 0.2 SUI in MIST
export const MIN_GAS_BALANCE = 100_000_000; // 0.1 SUI in MIST - minimum for gas

// Initialize Sui client with messaging SDK
// Note: Due to version compatibility issues, we'll use a simpler approach
export const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
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
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::connections::ConnectionStoreCreated`
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

