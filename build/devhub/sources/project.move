module devhub::project {
    use std::string::{Self, String};
    use sui::object::{ID, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::event;

    // Project types
    const FREELANCE: vector<u8> = b"Freelance";
    const CONTRACT: vector<u8> = b"Contract";
    const PART_TIME: vector<u8> = b"Part-time";
    const FULL_TIME: vector<u8> = b"Full-time";

    // Application status
    const PENDING: vector<u8> = b"Pending";
    const ACCEPTED: vector<u8> = b"Accepted";
    const REJECTED: vector<u8> = b"Rejected";
    const SHORTLISTED: vector<u8> = b"Shortlisted";

    public struct Project has key, store {
        id: UID,
        client: address,
        title: String,
        description: String,
        skills: vector<String>,
        budget: u64,
        timeline: String, // e.g., "3 months"
        milestones: vector<String>,
        project_type: String,
        // Hashes of off-chain files
        file_hashes: vector<String>,
        // Walrus blob IDs for project files
        walrus_file_blob_ids: vector<String>,
        applications: vector<ID>,
    }

    public struct Application has key, store {
        id: UID,
        project_id: ID,
        dev_card_id: ID,
        applicant: address,
        cover_letter_hash: String,
        proposed_timeline: String,
        bid_amount: u64,
        portfolio_references: vector<String>,
        status: String,
        // Walrus blob ID for cover letter file
        cover_letter_walrus_blob_id: Option<String>,
        // Walrus blob IDs for portfolio reference files
        portfolio_walrus_blob_ids: vector<String>,
    }

    // Events
    public struct ProjectCreated has copy, drop {
        project_id: ID,
        client: address,
        title: String,
    }

    public struct ApplicationSubmitted has copy, drop {
        application_id: ID,
        project_id: ID,
        applicant: address,
    }

    public fun create_project(
        client: address,
        title: vector<u8>,
        description: vector<u8>,
        skills: vector<vector<u8>>,
        budget: u64,
        timeline: vector<u8>,
        milestones: vector<vector<u8>>,
        project_type: vector<u8>,
        file_hashes: vector<vector<u8>>,
        walrus_file_blob_ids: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let mut skills_str = vector::empty<String>();
        let num_skills = vector::length(&skills);
        let mut i = 0;
        while (i < num_skills) {
            vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&skills, i)));
            i = i + 1;
        };

        let mut milestones_str = vector::empty<String>();
        let num_milestones = vector::length(&milestones);
        let mut j = 0;
        while (j < num_milestones) {
            vector::push_back(&mut milestones_str, string::utf8(*vector::borrow(&milestones, j)));
            j = j + 1;
        };

        let mut file_hashes_str = vector::empty<String>();
        let num_hashes = vector::length(&file_hashes);
        let mut k = 0;
        while (k < num_hashes) {
            vector::push_back(&mut file_hashes_str, string::utf8(*vector::borrow(&file_hashes, k)));
            k = k + 1;
        };

        let mut walrus_blob_ids_str = vector::empty<String>();
        let num_walrus_blobs = vector::length(&walrus_file_blob_ids);
        let mut l = 0;
        while (l < num_walrus_blobs) {
            vector::push_back(&mut walrus_blob_ids_str, string::utf8(*vector::borrow(&walrus_file_blob_ids, l)));
            l = l + 1;
        };

        let project = Project {
            id: object::new(ctx),
            client,
            title: string::utf8(title),
            description: string::utf8(description),
            skills: skills_str,
            budget,
            timeline: string::utf8(timeline),
            milestones: milestones_str,
            project_type: string::utf8(project_type),
            file_hashes: file_hashes_str,
            walrus_file_blob_ids: walrus_blob_ids_str,
            applications: vector::empty<ID>(),
        };

        event::emit(ProjectCreated {
            project_id: object::id(&project),
            client,
            title: project.title,
        });

        transfer::transfer(project, client);
    }

    public entry fun apply_to_project(
        project: &mut Project,
        dev_card_id: ID,
        cover_letter_hash: vector<u8>,
        proposed_timeline: vector<u8>,
        bid_amount: u64,
        portfolio_references: vector<vector<u8>>,
        cover_letter_walrus_blob_id: Option<vector<u8>>,
        portfolio_walrus_blob_ids: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let applicant = tx_context::sender(ctx);

        let mut portfolio_refs_str = vector::empty<String>();
        let num_refs = vector::length(&portfolio_references);
        let mut i = 0;
        while (i < num_refs) {
            vector::push_back(&mut portfolio_refs_str, string::utf8(*vector::borrow(&portfolio_references, i)));
            i = i + 1;
        };

        // Process Walrus blob IDs
        let cover_letter_blob_id = if (std::option::is_some(&cover_letter_walrus_blob_id)) {
            std::option::some(string::utf8(*std::option::borrow(&cover_letter_walrus_blob_id)))
        } else {
            std::option::none()
        };

        let mut portfolio_blob_ids_str = vector::empty<String>();
        let num_portfolio_blobs = vector::length(&portfolio_walrus_blob_ids);
        let mut j = 0;
        while (j < num_portfolio_blobs) {
            vector::push_back(&mut portfolio_blob_ids_str, string::utf8(*vector::borrow(&portfolio_walrus_blob_ids, j)));
            j = j + 1;
        };

        let application = Application {
            id: object::new(ctx),
            project_id: object::id(project),
            dev_card_id,
            applicant,
            cover_letter_hash: string::utf8(cover_letter_hash),
            proposed_timeline: string::utf8(proposed_timeline),
            bid_amount,
            portfolio_references: portfolio_refs_str,
            status: string::utf8(PENDING),
            cover_letter_walrus_blob_id: cover_letter_blob_id,
            portfolio_walrus_blob_ids: portfolio_blob_ids_str,
        };

        vector::push_back(&mut project.applications, object::id(&application));

        event::emit(ApplicationSubmitted {
            application_id: object::id(&application),
            project_id: object::id(project),
            applicant,
        });

        transfer::transfer(application, applicant);
    }
}
