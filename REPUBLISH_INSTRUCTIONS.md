# Republishing Package and Fixing Package ID Mismatch

## Issue
The `ProposalsByStatus` object was created with a different package ID than the current one, causing a `TypeMismatch` error.

## Solution Steps

### 1. Republish the Package

```bash
cd /home/abu78/Desktop/suiProjects/devhub-dapp
sui client publish --gas-budget 100000000
```

After publishing, you'll get a new package ID. Copy it.

### 2. Update PACKAGE_ID in suiClient.ts

Update the `PACKAGE_ID` constant in `frontend/devhub-dapp/src/lib/suiClient.ts`:

```typescript
export const PACKAGE_ID = 'YOUR_NEW_PACKAGE_ID_HERE';
```

### 3. Recreate ProposalsByStatus Object

After updating the package ID, you need to recreate the `ProposalsByStatus` object. This can be done through:
- The frontend (if you have a UI for creating it)
- Or by calling the `create_proposals_by_status` function directly

### 4. Update DEVHUB_OBJECT_ID (if needed)

If the `DevHub` object was also recreated, update `DEVHUB_OBJECT_ID` in `suiClient.ts` as well.

### 5. Clear Local Storage

Clear any cached object IDs in localStorage:
- Open browser console
- Run: `localStorage.removeItem("devhub_proposals_by_status_id")`
- Run: `localStorage.removeItem("devhub_user_proposals_id")` (if needed)

### 6. Test

Try submitting an application again. The package ID mismatch error should be resolved.

## Alternative: Use Old Package ID

If you want to keep using the old package ID temporarily:

1. Update `PACKAGE_ID` in `suiClient.ts` to match the object's package ID:
   ```typescript
   export const PACKAGE_ID = '0x062cae9b2c24b650d85bd62b1dd002eda3eb6dbaebc2f5c1ecd22e65fb418a20';
   ```

2. Note: This is only a temporary solution. You should republish and recreate objects for consistency.

