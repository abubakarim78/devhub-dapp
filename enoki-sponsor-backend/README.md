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

## Deployment on Render

### Option 1: Using Render Blueprint (Recommended)

1. **Push your code to GitHub** (if not already done)

2. **Go to Render Dashboard**:
   - Visit [render.com](https://render.com) and sign in
   - Click "New +" → "Blueprint"

3. **Connect your repository**:
   - Select your GitHub repository
   - Render will automatically detect the `render.yaml` file at the root of your repository

4. **Configure the service**:
   - Render will use the configuration from `render.yaml`
   - Make sure to set the environment variable `VITE_ENOKI_PRIVATE_API_KEY` in the Render dashboard:
     - Go to your service → Environment tab
     - Add `VITE_ENOKI_PRIVATE_API_KEY` with your Enoki Private API key value

5. **Deploy**:
   - Click "Apply" to deploy
   - Render will build and deploy your service automatically

### Option 2: Manual Setup

1. **Go to Render Dashboard**:
   - Visit [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"

2. **Connect your repository**:
   - Select your GitHub repository
   - Set the **Root Directory** to: `enoki-sponsor-backend`

3. **Configure build settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Set environment variables**:
   - Go to the "Environment" tab
   - Add the following variables:
     - `NODE_ENV`: `production`
     - `VITE_ENOKI_PRIVATE_API_KEY`: Your Enoki Private API key (mark as secret)
     - `PORT`: Leave empty (Render sets this automatically)

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy your service

### After Deployment

1. **Get your service URL**:
   - Render will provide a URL like: `https://enoki-sponsor-backend.onrender.com`
   - You can also set a custom domain in the Render dashboard

2. **Update your frontend**:
   - Update your frontend `.env` file in `frontend/devhub-dapp/.env` with the production backend URLs:
   ```env
   # Backend URL for Enoki sponsorship
   VITE_ENOKI_BACKEND_URL=https://devhub-dapp.onrender.com
   
   # Backend proxy URL for Walrus uploads (avoids CORS issues)
   VITE_WALRUS_PROXY_URL=https://devhub-dapp.onrender.com/api/walrus-upload
   ```
   - **Important**: After updating `.env`, rebuild your frontend for changes to take effect:
     ```bash
     cd frontend/devhub-dapp
     npm run build  # or pnpm build
     ```

3. **Test the deployment**:
   - Visit `https://your-backend-url.onrender.com/health` to verify the service is running
   - You should see: `{"status":"ok","message":"Enoki sponsor service is running"}`

### Notes

- Render automatically provides HTTPS
- The service will sleep after 15 minutes of inactivity on the free tier (wakes up on first request)
- For production, consider upgrading to a paid plan to avoid cold starts
- Monitor logs in the Render dashboard to debug any issues

