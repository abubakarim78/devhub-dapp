# 🔐 Seal Key Server Setup Guide

This guide will help you set up Seal key servers for full message decryption in your DevHub dApp.

## 📋 Prerequisites

1. **Seal CLI installed**: `cargo install seal-cli`
2. **Sui CLI configured**: Connected to testnet with funded address
3. **Node.js dependencies**: All frontend dependencies installed

## 🚀 Quick Setup

### Step 1: Install Seal CLI (if not already installed)
```bash
cargo install seal-cli
```

### Step 2: Run the Setup Script
```bash
cd /home/abu78/Desktop/suiProjects/devhub-dapp
./setup-key-servers.sh
```

This script will:
- Generate a master key for the key server
- Register the key server on Sui testnet
- Start the key server on `http://localhost:2024`

### Step 3: Update Frontend Configuration
After the key server is running, update the key server object IDs in your frontend:

1. Copy the key server object ID from the setup script output
2. Update `frontend/devhub-dapp/src/lib/sealClient.ts`:
```typescript
const TESTNET_KEY_SERVERS = [
  '0x<YOUR_KEY_SERVER_OBJECT_ID>', // Replace with actual ID
  '0x<YOUR_SECOND_KEY_SERVER_OBJECT_ID>' // Optional second server
];
```

## 🔧 Manual Setup (Alternative)

If the automated script doesn't work, follow these manual steps:

### 1. Generate Master Key
```bash
cargo run --bin seal-cli genkey
# Copy the Master key and Public key values
```

### 2. Register Key Server
```bash
sui client call \
  --function create_and_transfer_v1 \
  --module key_server \
  --package 0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682 \
  --args "DevHubKeyServer" "https://localhost:2024" 0 <MASTER_PUBKEY> \
  --gas-budget 100000000
```

### 3. Start Key Server
```bash
MASTER_KEY=<MASTER_KEY> CONFIG_PATH=key-server-config.yaml cargo run --bin key-server
```

## 🧪 Testing the Setup

1. **Start your frontend**: `npm run dev`
2. **Send a test message**: Try sending an encrypted message
3. **Check decryption**: Messages should now show the actual content instead of placeholders

## 📊 Monitoring

- **Key Server Health**: `curl http://localhost:2024/health`
- **Metrics**: `curl http://localhost:9184`
- **Logs**: Check the terminal where the key server is running

## 🔒 Security Notes

- **Development Only**: This setup is for development/testing
- **Production**: Use proper key management and secure hosting for production
- **Key Storage**: Keep your master key secure and never commit it to version control

## 🐛 Troubleshooting

### Key Server Won't Start
- Check if port 2024 is available
- Verify Sui CLI is configured correctly
- Ensure you have a funded address

### Decryption Still Shows Placeholders
- Verify key server is running: `curl http://localhost:2024/health`
- Check browser console for errors
- Ensure key server object IDs are updated in the frontend

### Transaction Fails
- Check your Sui address has enough gas
- Verify you're connected to testnet
- Try increasing gas budget

## 📚 Next Steps

Once the key server is running:
1. Test sending and receiving encrypted messages
2. Verify messages are properly decrypted
3. Consider setting up multiple key servers for redundancy
4. Plan for production deployment with proper security measures

## 🆘 Support

If you encounter issues:
1. Check the key server logs
2. Verify all prerequisites are met
3. Ensure your Sui address is funded
4. Check that the Seal package IDs are correct
