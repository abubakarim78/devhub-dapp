# Apply Project Field Mapping Verification

## Move Contract Function Signature
```move
public entry fun apply_to_project(
    devhub: &mut DevHub,
    user_proposals: &mut UserProposals,
    proposals_by_status: &mut ProposalsByStatus,
    project_id: u64,
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
    opportunity_title: vector<u8>,
    proposal_title: vector<u8>,
    team_name: vector<u8>,
    contact_email: vector<u8>,
    summary: vector<u8>,
    budget: u64,
    timeline_weeks: u64,
    methodology: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

## Frontend Transaction Arguments (in order)

| # | Move Param | Type | Frontend Arg | Form Field | Status |
|---|-----------|------|--------------|------------|--------|
| 1 | devhub | &mut DevHub | tx.object(DEVHUB_OBJECT_ID) | - | ✅ |
| 2 | user_proposals | &mut UserProposals | tx.object(userProposalsId) | - | ✅ |
| 3 | proposals_by_status | &mut ProposalsByStatus | tx.object(proposalsByStatusId) | - | ✅ |
| 4 | project_id | u64 | tx.pure.u64(projectId) | projectNumberId | ✅ |
| 5 | your_role | vector<u8> | tx.pure.vector('u8', ...yourRole) | form.yourRole | ✅ |
| 6 | availability_hrs_per_week | u64 | tx.pure.u64(availabilityHrsPerWeek) | form.availabilityHrsPerWeek | ✅ |
| 7 | start_date | vector<u8> | tx.pure.vector('u8', ...startDate) | form.startDate | ✅ |
| 8 | expected_duration_weeks | u64 | tx.pure.u64(expectedDurationWeeks) | form.expectedDurationWeeks | ✅ |
| 9 | proposal_summary | vector<u8> | tx.pure.vector('u8', ...proposalSummary) | form.coverNote \|\| form.proposalSummary | ✅ |
| 10 | requested_compensation | u64 | tx.pure.u64(requestedCompensation) | totalBudget \|\| form.requestedCompensation | ✅ |
| 11 | milestones_count | u64 | tx.pure.u64(milestonesCount) | form.milestones.length \|\| form.milestonesCount | ✅ |
| 12 | github_repo_link | vector<u8> | tx.pure.vector('u8', ...githubRepoLink) | form.githubRepoLink | ✅ |
| 13 | on_chain_address | address | tx.pure.address(onChainAddress) | form.onChainAddress | ✅ |
| 14 | team_members | vector<vector<u8>> | tx.pure.vector('vector<u8>', ...teamMembers) | form.teamMembers | ✅ |
| 15 | cover_letter_walrus_blob_id | Option<vector<u8>> | tx.pure.option('vector<u8>', ...coverLetterWalrusBlobId) | form.coverLetterWalrusBlobId | ✅ |
| 16 | portfolio_walrus_blob_ids | vector<vector<u8>> | tx.pure.vector('vector<u8>', ...portfolioWalrusBlobIds) | form.portfolioWalrusBlobIds | ✅ |
| 17 | opportunity_title | vector<u8> | tx.pure.vector('u8', ...opportunityTitle) | form.opportunityTitle \|\| projectData.title | ✅ |
| 18 | proposal_title | vector<u8> | tx.pure.vector('u8', ...proposalTitle) | form.proposalTitle \|\| default | ✅ |
| 19 | team_name | vector<u8> | tx.pure.vector('u8', ...teamName) | form.teamName \|\| "Individual" | ✅ |
| 20 | contact_email | vector<u8> | tx.pure.vector('u8', ...contactEmail) | form.contactEmail \|\| account.address | ✅ |
| 21 | summary | vector<u8> | tx.pure.vector('u8', ...summary) | form.summary \|\| form.coverNote | ✅ |
| 22 | budget | u64 | tx.pure.u64(budget) | form.budget | ✅ |
| 23 | timeline_weeks | u64 | tx.pure.u64(timelineWeeks) | form.timelineWeeks | ✅ |
| 24 | methodology | vector<u8> | tx.pure.vector('u8', ...methodology) | form.methodology \|\| form.coverNote | ✅ |
| 25 | clock | &Clock | tx.object(SUI_CLOCK_OBJECT_ID) | - | ✅ |
| 26 | ctx | &mut TxContext | (implicit) | - | ✅ |

## Field Population Notes

### Fields with Defaults/Fallbacks:
- **opportunityTitle**: Uses project title if not set in form
- **proposalTitle**: Defaults to "Proposal for {projectTitle}" if not set
- **teamName**: Defaults to "Individual" if not set
- **contactEmail**: Uses account address if not set
- **summary**: Falls back to coverNote/proposalSummary if not set
- **methodology**: Falls back to coverNote/proposalSummary if not set

### Fields that may be empty but are handled:
- **coverLetterWalrusBlobId**: Optional, can be null
- **teamMembers**: Can be empty array
- **portfolioWalrusBlobIds**: Can be empty array
- **githubRepoLink**: Can be empty string

## Verification Checklist

- [x] All 26 parameters are present in transaction
- [x] Parameter order matches Move contract exactly
- [x] All types match (u64, vector<u8>, address, Option, etc.)
- [x] All required fields have fallback values
- [x] Optional fields are handled correctly (Option type)
- [x] String fields are encoded to vector<u8> correctly
- [x] Clock object is included
- [x] Transaction context is implicit (handled by SDK)

## Potential Issues Fixed

1. ✅ Added default values for opportunityTitle, proposalTitle, teamName, contactEmail, summary, methodology
2. ✅ Ensured all fields are non-empty strings (empty strings are valid for vector<u8>)
3. ✅ Verified parameter order matches Move contract
4. ✅ Confirmed all types are correctly encoded

