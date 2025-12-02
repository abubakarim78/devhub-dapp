# Enoki Sponsored Transactions Backend

This backend service handles sponsored transactions for Enoki zkLogin users using the Private API key.

## Setup

1. **Create a `.env` file in the backend directory:**
   ```bash
   cd backend
   touch .env
   ```

2. **Add your environment variables to `backend/.env`:**
   ```env
   ENOKI_PRIVATE_API_KEY=your_private_api_key_here
   PORT=3001
   ```

3. **Install dependencies:**
   ```bash
   npm install express axios dotenv
   # or
   pnpm add express axios dotenv
   ```

4. **Update the backend code to load `.env` file:**
   Add this at the top of `enoki-sponsor-api.example.js`:
   ```javascript
   require('dotenv').config();
   ```

5. **Run the server:**
   ```bash
   node enoki-sponsor-api.example.js
   ```

## Environment Variables

Create a `.env` file in the `backend/` directory (separate from frontend `.env`):

```env
# Backend .env file (backend/.env)
ENOKI_PRIVATE_API_KEY=your_private_api_key_here
PORT=3001
```

**Important:**
- ✅ Create a **separate** `.env` file in the `backend/` directory
- ✅ Do **NOT** put the Private API key in the frontend `.env` file
- ✅ The frontend `.env` is in `frontend/devhub-dapp/.env` (for Public API key)
- ✅ The backend `.env` is in `backend/.env` (for Private API key)

## API Endpoints

### POST `/api/enoki/sponsor`

Sponsors a transaction using Enoki's Private API.

**Request Body:**
```json
{
  "transactionBlockKindBytes": "base64_encoded_transaction_bytes",
  "zkloginJwt": "jwt_token_from_enoki_wallet",
  "network": "testnet"
}
```

**Response:**
```json
{
  "transactionBytes": "base64_encoded_sponsored_transaction",
  "digest": "transaction_digest"
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

