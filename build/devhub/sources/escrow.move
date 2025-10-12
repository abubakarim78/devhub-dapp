module devhub::escrow {
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;

    // Escrow status
    const FUNDED: vector<u8> = b"Funded";
    const IN_PROGRESS: vector<u8> = b"In Progress";
    const COMPLETED: vector<u8> = b"Completed";
    const DISPUTED: vector<u8> = b"Disputed";
    const CANCELLED: vector<u8> = b"Cancelled";

    // Milestone status
    const PENDING: vector<u8> = b"Pending";
    const RELEASED: vector<u8> = b"Released";

    public struct Milestone has store, copy, drop {
        description: String,
        amount: u64,
        status: String,
    }

    public struct Escrow has key, store {
        id: UID,
        project_id: ID,
        client: address,
        developer: address,
        milestones: vector<Milestone>,
        funds: Balance<SUI>,
        status: String,
    }

    // Events
    public struct EscrowFunded has copy, drop {
        escrow_id: ID,
        amount: u64,
    }

    public struct MilestoneReleased has copy, drop {
        escrow_id: ID,
        milestone_index: u64,
        amount: u64,
    }

    public struct EscrowDisputed has copy, drop {
        escrow_id: ID,
    }

    public struct EscrowCancelled has copy, drop {
        escrow_id: ID,
    }

    public fun create_escrow(
        project_id: ID,
        client: address,
        developer: address,
        milestone_descriptions: vector<vector<u8>>,
        milestone_amounts: vector<u64>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let mut milestones = vector::empty<Milestone>();
        let num_milestones = vector::length(&milestone_descriptions);
        let mut total_amount = 0;
        let mut i = 0;
        while (i < num_milestones) {
            let amount = *vector::borrow(&milestone_amounts, i);
            vector::push_back(&mut milestones, Milestone {
                description: string::utf8(*vector::borrow(&milestone_descriptions, i)),
                amount,
                status: string::utf8(PENDING),
            });
            total_amount = total_amount + amount;
            i = i + 1;
        };

        assert!(coin::value(&payment) >= total_amount, 1); // E_INSUFFICIENT_FUNDS

        let escrow = Escrow {
            id: object::new(ctx),
            project_id,
            client,
            developer,
            milestones,
            funds: coin::into_balance(payment),
            status: string::utf8(FUNDED),
        };

        event::emit(EscrowFunded {
            escrow_id: object::id(&escrow),
            amount: total_amount,
        });

        transfer::share_object(escrow);
    }

    public entry fun release_milestone(
        escrow: &mut Escrow,
        milestone_index: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == escrow.client, 2); // E_NOT_CLIENT
        let milestone = vector::borrow_mut(&mut escrow.milestones, milestone_index);
        assert!(milestone.status == string::utf8(PENDING), 3); // E_MILESTONE_NOT_PENDING

        milestone.status = string::utf8(RELEASED);
        let amount = milestone.amount;
        let payment = coin::from_balance(balance::split(&mut escrow.funds, amount), ctx);
        transfer::public_transfer(payment, escrow.developer);

        event::emit(MilestoneReleased {
            escrow_id: object::id(escrow),
            milestone_index,
            amount,
        });
    }

    public entry fun dispute_escrow(escrow: &mut Escrow, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.client || sender == escrow.developer, 4); // E_NOT_PARTY
        escrow.status = string::utf8(DISPUTED);
        event::emit(EscrowDisputed { escrow_id: object::id(escrow) });
    }

    public entry fun cancel_escrow(escrow: Escrow, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == escrow.client, 2); // E_NOT_CLIENT
        let escrow_id = object::id(&escrow);
        let Escrow { id, project_id: _, client, developer: _, milestones: _, funds, status } = escrow;
        assert!(status == string::utf8(FUNDED), 5); // E_ESCROW_IN_PROGRESS

        let payment = coin::from_balance(funds, ctx);
        transfer::public_transfer(payment, client);

        event::emit(EscrowCancelled { escrow_id });
        object::delete(id);
    }
}
