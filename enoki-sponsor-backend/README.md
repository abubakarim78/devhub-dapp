# Enoki Sponsored Transactions Backend

This backend service handles sponsored transactions for Enoki zkLogin users using the Private API key.

## Setup

1. **Create a `.env` file in the backend directory:**
   ```bash
   cd enoki-sponsor-backend
   touch .env
   ```

2. **Add your environment variables to `.env`:**
   ```env
   VITE_ENOKI_PRIVATE_API_KEY=your_enoki_api_key_here
   PORT=3001
   ```

3. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

4. **Run the server in development mode:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Run the server in production mode:**
   ```bash
   npm run build
   npm start
   # or
   pnpm build
   pnpm start
   ```

## Environment Variables

Create a `.env` file in the `enoki-sponsor-backend/` directory:

```env
# Enoki Private API Key (get this from your Enoki dashboard)
VITE_ENOKI_PRIVATE_API_KEY=your_enoki_api_key_here

# Server Port (default: 3001)
PORT=3001
```

**Important:**
- ✅ Create a **separate** `.env` file in the `enoki-sponsor-backend/` directory
- ✅ Do **NOT** put the Private API key in the frontend `.env` file
- ✅ The frontend `.env` is in `frontend/devhub-dapp/.env` (for Public API key)
- ✅ The backend `.env` is in `enoki-sponsor-backend/.env` (for Private API key)

## API Endpoints

### GET `/health`

Health check endpoint to verify the service is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Enoki sponsor service is running"
}
```

### POST `/api/sponsor-transaction`

Sponsors a transaction using Enoki's Private API.

**Request Body:**
```json
{
  "transactionKindBytes": "base64_encoded_transaction_bytes",
  "sender": "0x...",
  "allowedMoveCallTargets": ["package::module::function"],
  "allowedAddresses": ["0x..."],
  "network": "testnet"
}
```

**Response:**
```json
{
  "success": true,
  "bytes": "base64_encoded_sponsored_transaction",
  "digest": "transaction_digest"
}
```

### POST `/api/execute-transaction`

Executes a sponsored transaction after it has been signed.

**Request Body:**
```json
{
  "digest": "transaction_digest",
  "signature": "base64_encoded_signature"
}
```

**Response:**
```json
{
  "success": true,
  "result": { ... }
}
```

## Security Notes

- ⚠️ **Never expose the Private API key to the frontend**
- ⚠️ **Add authentication/authorization to your API endpoints**
- ⚠️ **Use HTTPS in production**
- ⚠️ **Rate limit your endpoints to prevent abuse**
- ⚠️ **Validate and sanitize all input**

## Integration with Frontend

Update your frontend `.env` file:
```env
VITE_ENOKI_BACKEND_URL=http://localhost:3001
```

In production, use your production backend URL:
```env
VITE_ENOKI_BACKEND_URL=https://your-backend-domain.com
```

