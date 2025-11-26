module devhub::project;

use std::string::{Self, String};
use sui::event;


// ===== PROJECT STRUCTS =====

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
    visibility: String,
    applications_status: String,
    devhub_messages_enabled: bool,
    creation_timestamp: u64,
    attachments_walrus_blob_ids: vector<String>,
    // New fields from redesigned form
    key_deliverables: String,
    complexity_level: String,
    payment_model: String,
    preferred_start_window: String,
    nice_to_have_skills: vector<String>,
    repo_or_spec_link: String,
    application_type: String,
    final_notes: String,
}

public struct ProjectApplication has key, store {
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
    proposal_id: Option<ID>,
}

// ===== EVENTS =====

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

// ===== PROJECT CREATION =====

public fun create_project(
    owner: address,
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
    visibility: String,
    applications_status: String,
    devhub_messages_enabled: bool,
    attachments_walrus_blob_ids: vector<String>,
    key_deliverables: String,
    complexity_level: String,
    payment_model: String,
    preferred_start_window: String,
    nice_to_have_skills: vector<String>,
    repo_or_spec_link: String,
    application_type: String,
    final_notes: String,
    current_time: u64,
    ctx: &mut TxContext,
): Project {
    Project {
        id: object::new(ctx),
        title,
        short_summary,
        description,
        category,
        experience_level,
        budget_min,
        budget_max,
        timeline_weeks,
        required_skills,
        attachments_count,
        owner,
        visibility,
        applications_status,
        devhub_messages_enabled,
        creation_timestamp: current_time,
        attachments_walrus_blob_ids,
        key_deliverables,
        complexity_level,
        payment_model,
        preferred_start_window,
        nice_to_have_skills,
        repo_or_spec_link,
        application_type,
        final_notes,
    }
}

// ===== PROJECT UPDATES =====

public fun update_project_info(
    project: &mut Project,
    title: String,
    short_summary: String,
    description: String,
    category: String,
    experience_level: String,
    budget_min: u64,
    budget_max: u64,
    timeline_weeks: u64,
    required_skills: vector<String>,
    applications_status: String,
) {
    project.title = title;
    project.short_summary = short_summary;
    project.description = description;
    project.category = category;
    project.experience_level = experience_level;
    project.budget_min = budget_min;
    project.budget_max = budget_max;
    project.timeline_weeks = timeline_weeks;
    project.required_skills = required_skills;
    project.applications_status = applications_status;
}

public fun set_applications_status(project: &mut Project, status: String) {
    project.applications_status = status;
}

public fun add_attachment(project: &mut Project, blob_id: String) {
    vector::push_back(&mut project.attachments_walrus_blob_ids, blob_id);
    project.attachments_count = project.attachments_count + 1;
}

public fun remove_attachment(project: &mut Project, blob_id: String) {
    let mut i = 0;
    while (i < vector::length(&project.attachments_walrus_blob_ids)) {
        if (*vector::borrow(&project.attachments_walrus_blob_ids, i) == blob_id) {
            vector::remove(&mut project.attachments_walrus_blob_ids, i);
            project.attachments_count = project.attachments_count - 1;
            return
        };
        i = i + 1;
    };
}

// ===== APPLICATION CREATION =====

public fun create_application(
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
    cover_letter_walrus_blob_id: Option<String>,
    portfolio_walrus_blob_ids: vector<String>,
    proposal_id: Option<ID>,
    current_time: u64,
    ctx: &mut TxContext,
): ProjectApplication {
    ProjectApplication {
        id: object::new(ctx),
        project_id,
        applicant_address,
        your_role,
        availability_hrs_per_week,
        start_date,
        expected_duration_weeks,
        proposal_summary,
        requested_compensation,
        milestones_count,
        github_repo_link,
        on_chain_address,
        team_members,
        application_status: string::utf8(b"Pending"),
        submission_timestamp: current_time,
        cover_letter_walrus_blob_id,
        portfolio_walrus_blob_ids,
        proposal_id,
    }
}

// ===== VIEW FUNCTIONS =====

public fun get_owner(project: &Project): address { project.owner }
public fun get_title(project: &Project): String { project.title }
public fun get_applications_status(project: &Project): String { project.applications_status }
public fun get_required_skills(project: &Project): &vector<String> { &project.required_skills }
public fun get_project_info(project: &Project): &Project { project }
public fun get_application_details(application: &ProjectApplication): &ProjectApplication { application }

public fun get_application_portfolio_blobs(application: &ProjectApplication): &vector<String> {
    &application.portfolio_walrus_blob_ids
}

public fun get_application_cover_letter_blob(application: &ProjectApplication): &Option<String> {
    &application.cover_letter_walrus_blob_id
}

// ===== EVENTS =====

public fun emit_project_created(project_id: ID, owner: address, title: String) {
    event::emit(ProjectCreated { project_id, owner, title });
}

public fun emit_application_submitted(application_id: ID, project_id: ID, applicant: address) {
    event::emit(ApplicationSubmitted { application_id, project_id, applicant });
}

