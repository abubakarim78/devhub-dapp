module devhub::project {
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::option::{Self, Option};

    // Application Status
    const OPEN: vector<u8> = b"Open";
    const CLOSED: vector<u8> = b"Closed";

    // Application Status for applicants
    const PENDING: vector<u8> = b"Pending";

    // Milestone Status
    const MILESTONE_PENDING: vector<u8> = b"Pending";

    // Errors
    const E_NOT_OWNER: u64 = 0;
    const E_APPLICATIONS_NOT_OPEN: u64 = 1;
    const E_APPLICATIONS_ALREADY_OPEN: u64 = 2;
    const E_APPLICATIONS_ALREADY_CLOSED: u64 = 3;

    public struct Project has key, store {
        id: UID,
        title: String,
        short_summary: String,
        description: String,
        category: String,
        experience_level: String,
        budget_min: u64,
        budget_max: u64,
        timeline_weeks: u64,
        required_skills: vector<String>,
        attachments_count: u64,
        owner: address,
        escrow_enabled: bool,
        visibility: String,
        applications_status: String,
        devhub_messages_enabled: bool,
        creation_timestamp: u64,
        attachments_walrus_blob_ids: vector<String>,
    }

    public struct Application has key, store {
        id: UID,
        project_id: ID,
        applicant_address: address,
        your_role: String,
        availability_hrs_per_week: u64,
        start_date: String,
        expected_duration_weeks: u64,
        proposal_summary: String,
        requested_compensation: u64,
        milestones_count: u64,
        github_repo_link: String,
        on_chain_address: address,
        team_members: vector<String>,
        application_status: String,
        submission_timestamp: u64,
        cover_letter_walrus_blob_id: Option<String>,
        portfolio_walrus_blob_ids: vector<String>,
    }

    public struct Milestone has key, store {
        id: UID,
        project_id: ID,
        title: String,
        description: String,
        estimated_duration_weeks: u64,
        status: String,
    }

    // Events
    public struct ProjectCreated has copy, drop {
        project_id: ID,
        owner: address,
        title: String,
    }

    public struct ApplicationSubmitted has copy, drop {
        application_id: ID,
        project_id: ID,
        applicant: address,
    }

    public entry fun create_project(
        title: vector<u8>,
        short_summary: vector<u8>,
        description: vector<u8>,
        category: vector<u8>,
        experience_level: vector<u8>,
        budget_min: u64,
        budget_max: u64,
        timeline_weeks: u64,
        required_skills: vector<vector<u8>>,
        attachments_count: u64,
        escrow_enabled: bool,
        visibility: vector<u8>,
        applications_status: vector<u8>,
        devhub_messages_enabled: bool,
        attachments_walrus_blob_ids: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let mut skills_str = vector::empty<String>();
        let num_skills = vector::length(&required_skills);
        let mut i = 0;
        while (i < num_skills) {
            vector::push_back(&mut skills_str, string::utf8(*vector::borrow(&required_skills, i)));
            i = i + 1;
        };

        let mut blob_ids_str = vector::empty<String>();
        let num_blobs = vector::length(&attachments_walrus_blob_ids);
        let mut i = 0;
        while (i < num_blobs) {
            vector::push_back(&mut blob_ids_str, string::utf8(*vector::borrow(&attachments_walrus_blob_ids, i)));
            i = i + 1;
        };

        let project = Project {
            id: object::new(ctx),
            title: string::utf8(title),
            short_summary: string::utf8(short_summary),
            description: string::utf8(description),
            category: string::utf8(category),
            experience_level: string::utf8(experience_level),
            budget_min,
            budget_max,
            timeline_weeks,
            required_skills: skills_str,
            attachments_count,
            owner,
            escrow_enabled,
            visibility: string::utf8(visibility),
            applications_status: string::utf8(applications_status),
            devhub_messages_enabled,
            creation_timestamp: clock::timestamp_ms(clock),
            attachments_walrus_blob_ids: blob_ids_str,
        };

        event::emit(ProjectCreated {
            project_id: object::id(&project),
            owner,
            title: project.title,
        });

        transfer::transfer(project, owner);
    }

    public entry fun apply_to_project(
        project: &mut Project,
        your_role: vector<u8>,
        availability_hrs_per_week: u64,
        start_date: vector<u8>,
        expected_duration_weeks: u64,
        proposal_summary: vector<u8>,
        requested_compensation: u64,
        milestones_count: u64,
        github_repo_link: vector<u8>,
        on_chain_address: address,
        team_members: vector<vector<u8>>,
        cover_letter_walrus_blob_id: Option<vector<u8>>,
        portfolio_walrus_blob_ids: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(project.applications_status == string::utf8(OPEN), E_APPLICATIONS_NOT_OPEN);
        let applicant = tx_context::sender(ctx);

        let mut team_members_str = vector::empty<String>();
        let num_members = vector::length(&team_members);
        let mut i = 0;
        while (i < num_members) {
            vector::push_back(&mut team_members_str, string::utf8(*vector::borrow(&team_members, i)));
            i = i + 1;
        };

        let cover_letter_blob_id = if (option::is_some(&cover_letter_walrus_blob_id)) {
            option::some(string::utf8(*option::borrow(&cover_letter_walrus_blob_id)))
        } else {
            option::none()
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
            applicant_address: applicant,
            your_role: string::utf8(your_role),
            availability_hrs_per_week,
            start_date: string::utf8(start_date),
            expected_duration_weeks,
            proposal_summary: string::utf8(proposal_summary),
            requested_compensation,
            milestones_count,
            github_repo_link: string::utf8(github_repo_link),
            on_chain_address,
            team_members: team_members_str,
            application_status: string::utf8(PENDING),
            submission_timestamp: clock::timestamp_ms(clock),
            cover_letter_walrus_blob_id: cover_letter_blob_id,
            portfolio_walrus_blob_ids: portfolio_blob_ids_str,
        };

        event::emit(ApplicationSubmitted {
            application_id: object::id(&application),
            project_id: object::id(project),
            applicant,
        });

        transfer::transfer(application, applicant);
    }

    public entry fun open_applications(project: &mut Project, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == project.owner, E_NOT_OWNER);
        assert!(project.applications_status != string::utf8(OPEN), E_APPLICATIONS_ALREADY_OPEN);
        project.applications_status = string::utf8(OPEN);
    }

    public entry fun close_applications(project: &mut Project, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == project.owner, E_NOT_OWNER);
        assert!(project.applications_status != string::utf8(CLOSED), E_APPLICATIONS_ALREADY_CLOSED);
        project.applications_status = string::utf8(CLOSED);
    }

    public entry fun add_milestone(
        project: &Project,
        title: vector<u8>,
        description: vector<u8>,
        estimated_duration_weeks: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == project.owner, E_NOT_OWNER);
        let milestone = Milestone {
            id: object::new(ctx),
            project_id: object::id(project),
            title: string::utf8(title),
            description: string::utf8(description),
            estimated_duration_weeks,
            status: string::utf8(MILESTONE_PENDING),
        };
        transfer::transfer(milestone, project.owner);
    }

    public entry fun update_milestone_status(
        milestone: &mut Milestone,
        status: vector<u8>,
        _ctx: &mut TxContext
    ) {
        milestone.status = string::utf8(status);
    }

    public entry fun add_attachment(
        project: &mut Project,
        blob_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == project.owner, E_NOT_OWNER);
        vector::push_back(&mut project.attachments_walrus_blob_ids, string::utf8(blob_id));
        project.attachments_count = project.attachments_count + 1;
    }

    public entry fun remove_attachment(
        project: &mut Project,
        blob_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == project.owner, E_NOT_OWNER);
        let blob_id_str = string::utf8(blob_id);
        let mut i = 0;
        while (i < vector::length(&project.attachments_walrus_blob_ids)) {
            if (*vector::borrow(&project.attachments_walrus_blob_ids, i) == blob_id_str) {
                vector::remove(&mut project.attachments_walrus_blob_ids, i);
                project.attachments_count = project.attachments_count - 1;
                return
            };
            i = i + 1;
        };
    }

    public fun get_project_details(project: &Project): &Project {
        project
    }

    public fun get_application_details(application: &Application): &Application {
        application
    }

    public fun get_milestone_details(milestone: &Milestone): &Milestone {
        milestone
    }
}