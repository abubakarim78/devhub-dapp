# CORS Error Fix

## Problem

The Sui RPC endpoint `https://fullnode.testnet.sui.io/` doesn't allow CORS requests from browsers, causing errors like:
```
Access to fetch at 'https://fullnode.testnet.sui.io/' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

## Solutions

### Option 1: Use a CORS-Enabled RPC Endpoint (Recommended)

Update your `.env` file with a CORS-enabled RPC endpoint:

```bash
# In frontend/devhub-dapp/.env
VITE_SUI_RPC_URL=https://testnet.sui.chainbase.online/v1
```

Or use another public RPC endpoint that supports CORS:
- `https://sui-testnet-endpoint.blockvision.org/v1`
- `https://testnet.sui.chainbase.online/v1`
- Or any other public Sui RPC endpoint that supports CORS

### Option 2: Use a CORS Proxy

If you need to use the official endpoint, set up a CORS proxy:

```bash
# In frontend/devhub-dapp/.env
VITE_SUI_RPC_URL=https://cors-anywhere.herokuapp.com/https://fullnode.testnet.sui.io
```

**Note:** Public CORS proxies may have rate limits or require authentication.

### Option 3: Use dapp-kit's useSuiClient Hook

For React components, use the `useSuiClient()` hook from `@mysten/dapp-kit` instead of the direct client:

```typescript
import { useSuiClient } from '@mysten/dapp-kit';

function MyComponent() {
  const client = useSuiClient();
  
  // Use client instead of suiClient from constants
  const result = await client.devInspectTransactionBlock({...});
}
```

### Option 4: Run a Local Proxy Server

Create a simple proxy server to handle CORS:

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

app.use('/api', createProxyMiddleware({
  target: 'https://fullnode.testnet.sui.io',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}));

app.listen(3001);
```

Then use: `VITE_SUI_RPC_URL=http://localhost:3001/api`

## Quick Fix

1. Create `.env` file in `frontend/devhub-dapp/`:
   ```bash
   VITE_SUI_RPC_URL=https://testnet.sui.chainbase.online/v1
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

The code has been updated to read from `VITE_SUI_RPC_URL` environment variable, falling back to the default if not set.
