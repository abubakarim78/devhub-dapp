module devhub::proposal;

use std::string::{Self, String};
use sui::event;




public struct Milestone has store, copy, drop {
    description: String,
    due_date: u64, // timestamp
    budget: u64,
}

public struct Deliverable has store, copy, drop {
    description: String,
    due_date: u64, // timestamp
    budget_allocation: u64,
}

public struct TeamMember has store, copy, drop {
    name: String,
    sui_address: address,
}

public struct Link has store, copy, drop {
    url: String,
}

public struct Comment has store {
    author_address: address,
    timestamp: u64,
    text: String,
}

public struct File has store, copy, drop {
    name: String,
    file_type: String,
    size_kb: u64,
    url: String,
    walrus_blob_id: Option<String>,
}

// ===== PROPOSAL STRUCTS =====

public struct Proposal has key {
    id: UID,
    opportunity_title: String,
    proposal_title: String,
    team_name: String,
    contact_email: String,
    summary: String,
    budget: u64,
    timeline_weeks: u64,
    status: String,
    created_at: u64,
    last_updated: u64,
    owner_address: address,
    key_deliverables: vector<Deliverable>,
    methodology: String,
    milestones: vector<Milestone>,
    team_members: vector<TeamMember>,
    links: vector<Link>,
    comments: vector<Comment>,
    files: vector<File>,
}

public struct PlatformStatistics has key {
    id: UID,
    total_submitted: u64,
    active_in_review: u64,
    accepted_count: u64,
    rejected_count: u64,
    declined_count: u64,
}

public struct UserProposals has key {
    id: UID,
    owner: address,
    proposals: vector<ID>,
}

public struct ProposalsByStatus has key {
    id: UID,
    draft: vector<ID>,
    in_review: vector<ID>,
    accepted: vector<ID>,
    rejected: vector<ID>,
    declined: vector<ID>,
}

// ===== EVENTS =====

public struct ProposalCreated has copy, drop {
    proposal_id: ID,
    owner_address: address,
}

public struct ProposalStatusUpdate has copy, drop {
    proposal_id: ID,
    new_status: String,
}

// ===== PROPOSAL CREATION =====

public fun create_proposal(
    owner_address: address,
    opportunity_title: String,
    proposal_title: String,
    team_name: String,
    contact_email: String,
    summary: String,
    budget: u64,
    timeline_weeks: u64,
    methodology: String,
    current_time: u64,
    ctx: &mut TxContext,
): Proposal {
    Proposal {
        id: object::new(ctx),
        owner_address,
        status: string::utf8(b"Draft"),
        opportunity_title,
        proposal_title,
        team_name,
        contact_email,
        summary,
        budget,
        timeline_weeks,
        methodology,
        last_updated: current_time,
        created_at: current_time,
        key_deliverables: vector::empty(),
        milestones: vector::empty(),
        team_members: vector::empty(),
        links: vector::empty(),
        comments: vector::empty(),
        files: vector::empty(),
    }
}

// ===== PROPOSAL UPDATES =====

public fun update_proposal_info(
    proposal: &mut Proposal,
    opportunity_title: String,
    proposal_title: String,
    team_name: String,
    contact_email: String,
    summary: String,
    budget: u64,
    timeline_weeks: u64,
    methodology: String,
    current_time: u64,
) {
    proposal.opportunity_title = opportunity_title;
    proposal.proposal_title = proposal_title;
    proposal.team_name = team_name;
    proposal.contact_email = contact_email;
    proposal.summary = summary;
    proposal.budget = budget;
    proposal.timeline_weeks = timeline_weeks;
    proposal.methodology = methodology;
    proposal.last_updated = current_time;
}

public fun add_deliverable(proposal: &mut Proposal, deliverable: Deliverable, current_time: u64) {
    vector::push_back(&mut proposal.key_deliverables, deliverable);
    proposal.last_updated = current_time;
}

public fun add_milestone(proposal: &mut Proposal, milestone: Milestone, current_time: u64) {
    vector::push_back(&mut proposal.milestones, milestone);
    proposal.last_updated = current_time;
}

public fun add_team_member(proposal: &mut Proposal, member: TeamMember, current_time: u64) {
    vector::push_back(&mut proposal.team_members, member);
    proposal.last_updated = current_time;
}

public fun add_link(proposal: &mut Proposal, link: Link, current_time: u64) {
    vector::push_back(&mut proposal.links, link);
    proposal.last_updated = current_time;
}

public fun create_deliverable(description: String, due_date: u64, budget_allocation: u64): Deliverable {
    Deliverable {
        description,
        due_date,
        budget_allocation,
    }
}

public fun create_milestone(description: String, due_date: u64, budget: u64): Milestone {
    Milestone {
        description,
        due_date,
        budget,
    }
}

public fun create_team_member(name: String, sui_address: address): TeamMember {
    TeamMember {
        name,
        sui_address,
    }
}

public fun create_link(url: String): Link {
    Link {
        url,
    }
}

public fun create_file(name: String, file_type: String, size_kb: u64, url: String, walrus_blob_id: Option<String>): File {
    File {
        name,
        file_type,
        size_kb,
        url,
        walrus_blob_id,
    }
}

public fun create_comment(author_address: address, timestamp: u64, text: String): Comment {
    Comment {
        author_address,
        timestamp,
        text,
    }
}

public fun add_comment(proposal: &mut Proposal, comment: Comment, current_time: u64) {
    vector::push_back(&mut proposal.comments, comment);
    proposal.last_updated = current_time;
}

public fun add_file(proposal: &mut Proposal, file: File, current_time: u64) {
    vector::push_back(&mut proposal.files, file);
    proposal.last_updated = current_time;
}

public fun set_status(proposal: &mut Proposal, status: String, current_time: u64) {
    proposal.status = status;
    proposal.last_updated = current_time;
}

// ===== STATISTICS UPDATES =====

public fun increment_total_submitted(stats: &mut PlatformStatistics) {
    stats.total_submitted = stats.total_submitted + 1;
}

public fun increment_active_in_review(stats: &mut PlatformStatistics) {
    stats.active_in_review = stats.active_in_review + 1;
}

public fun decrement_active_in_review(stats: &mut PlatformStatistics) {
    stats.active_in_review = stats.active_in_review - 1;
}

public fun increment_accepted_count(stats: &mut PlatformStatistics) {
    stats.accepted_count = stats.accepted_count + 1;
}

public fun increment_rejected_count(stats: &mut PlatformStatistics) {
    stats.rejected_count = stats.rejected_count + 1;
}

public fun increment_declined_count(stats: &mut PlatformStatistics) {
    stats.declined_count = stats.declined_count + 1;
}

// ===== STATUS TRACKING =====

public fun add_to_draft(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    vector::push_back(&mut status_tracker.draft, proposal_id);
}

public fun remove_from_draft(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    remove_id_from_vector(&mut status_tracker.draft, &proposal_id);
}

public fun add_to_in_review(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    vector::push_back(&mut status_tracker.in_review, proposal_id);
}

public fun remove_from_in_review(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    remove_id_from_vector(&mut status_tracker.in_review, &proposal_id);
}

public fun add_to_accepted(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    vector::push_back(&mut status_tracker.accepted, proposal_id);
}

public fun add_to_rejected(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    vector::push_back(&mut status_tracker.rejected, proposal_id);
}

public fun add_to_declined(status_tracker: &mut ProposalsByStatus, proposal_id: ID) {
    vector::push_back(&mut status_tracker.declined, proposal_id);
}

fun remove_id_from_vector(vec: &mut vector<ID>, id: &ID) {
    let mut i = 0;
    let len = vector::length(vec);
    let mut found = false;
    while (i < len && !found) {
        if (vector::borrow(vec, i) == id) {
            found = true;
        } else {
            i = i + 1;
        }
    };
    if (found) {
        vector::remove(vec, i);
    };
}

// ===== USER PROPOSALS =====

public fun add_user_proposal(user_proposals: &mut UserProposals, proposal_id: ID) {
    vector::push_back(&mut user_proposals.proposals, proposal_id);
}

// ===== VIEW FUNCTIONS =====

public fun get_owner(proposal: &Proposal): address { proposal.owner_address }
public fun get_status(proposal: &Proposal): String { proposal.status }
public fun get_proposal_details(proposal: &Proposal): &Proposal { proposal }

public fun get_user_proposals(user_proposals: &UserProposals): &vector<ID> {
    &user_proposals.proposals
}

public fun get_proposals_by_status(proposals_by_status: &ProposalsByStatus, status: vector<u8>): &vector<ID> {
    let status_str = string::utf8(status);
    if (status_str == string::utf8(b"Draft")) {
        &proposals_by_status.draft
    } else if (status_str == string::utf8(b"InReview")) {
        &proposals_by_status.in_review
    } else if (status_str == string::utf8(b"Accepted")) {
        &proposals_by_status.accepted
    } else if (status_str == string::utf8(b"Rejected")) {
        &proposals_by_status.rejected
    } else {
        &proposals_by_status.declined
    }
}

public fun get_platform_statistics(stats: &PlatformStatistics): (u64, u64, u64, u64, u64) {
    (
        stats.total_submitted,
        stats.active_in_review,
        stats.accepted_count,
        stats.rejected_count,
        stats.declined_count,
    )
}

// ===== OBJECT CREATION =====

public fun create_platform_statistics(ctx: &mut TxContext): PlatformStatistics {
    PlatformStatistics {
        id: object::new(ctx),
        total_submitted: 0,
        active_in_review: 0,
        accepted_count: 0,
        rejected_count: 0,
        declined_count: 0,
    }
}

public fun create_proposals_by_status(ctx: &mut TxContext): ProposalsByStatus {
    ProposalsByStatus {
        id: object::new(ctx),
        draft: vector::empty(),
        in_review: vector::empty(),
        accepted: vector::empty(),
        rejected: vector::empty(),
        declined: vector::empty(),
    }
}

public fun create_user_proposals(owner: address, ctx: &mut TxContext): UserProposals {
    UserProposals {
        id: object::new(ctx),
        owner,
        proposals: vector::empty(),
    }
}

// ===== ENTRY FUNCTIONS FOR OBJECT CREATION =====

public  fun create_and_share_platform_statistics(ctx: &mut TxContext) {
    transfer::share_object(create_platform_statistics(ctx));
}

public  fun create_and_share_proposals_by_status(ctx: &mut TxContext) {
    transfer::share_object(create_proposals_by_status(ctx));
}

public  fun create_and_transfer_user_proposals(ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    transfer::transfer(create_user_proposals(sender, ctx), sender);
}

public fun transfer_proposal(proposal: Proposal, recipient: address) {
    transfer::transfer(proposal, recipient);
}

// ===== EVENTS =====

public fun emit_proposal_created(proposal_id: ID, owner_address: address) {
    event::emit(ProposalCreated { proposal_id, owner_address });
}

public fun emit_proposal_status_update(proposal_id: ID, new_status: String) {
    event::emit(ProposalStatusUpdate { proposal_id, new_status });
}

