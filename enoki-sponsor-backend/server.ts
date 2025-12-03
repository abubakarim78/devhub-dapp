import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import { EnokiClient } from '@mysten/enoki';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

// Middleware

app.use(cors());

app.use(express.json());

// Raw body parser for Walrus binary uploads
app.use(
  '/api/walrus-upload',
  express.raw({ type: 'application/octet-stream', limit: '15mb' }),
);

interface SponsorTransactionRequest {

    transactionKindBytes: string;

    sender: string;

    allowedMoveCallTargets?: string[];

    allowedAddresses?: string[];

    network?: 'testnet' | 'mainnet' | 'devnet';

}

interface ExecuteTransactionRequest {

    digest: string;

    signature: string;

}

// Initialize Enoki client

if (!process.env.VITE_ENOKI_PRIVATE_API_KEY) {

    throw new Error('VITE_ENOKI_PRIVATE_API_KEY environment variable is not set');

}

const enokiClient = new EnokiClient({

    apiKey: process.env.VITE_ENOKI_PRIVATE_API_KEY,

});

// Health check endpoint

app.get('/health', (req: Request, res: Response) => {

    res.json({ status: 'ok', message: 'Enoki sponsor service is running' });

});

// Sponsor transaction endpoint

app.post('/api/sponsor-transaction', async (req: Request<object, object, SponsorTransactionRequest>, res: Response) => {

    try {

        const { transactionKindBytes, sender, allowedMoveCallTargets, allowedAddresses, network } = req.body;

        console.log(req.body)

        // Validation

        if (!transactionKindBytes || !sender) {

            return res.status(400).json({ 

                error: 'Missing required fields: transactionKindBytes, sender' 

            });

        }

        // Default values

        const targetNetwork = network || 'testnet';

        const defaultAllowedTargets = allowedMoveCallTargets;

        const defaultAllowedAddresses = allowedAddresses || [sender];

        console.log(`Sponsoring transaction for ${sender} on ${targetNetwork}`);

        // Create sponsored transaction

        const sponsored = await enokiClient.createSponsoredTransaction({

            network: targetNetwork,

            transactionKindBytes,

            sender,

            allowedMoveCallTargets: defaultAllowedTargets,

            allowedAddresses: defaultAllowedAddresses,

        });

        res.json({

            success: true,

            bytes: sponsored.bytes,

            digest: sponsored.digest,

        });

    } catch (error) {

        console.error('Error sponsoring transaction:', error);

        res.status(500).json({ 

            error: 'Failed to sponsor transaction',

            details: error instanceof Error ? error.message : 'Unknown error'

        });

    }

})

// Execute sponsored transaction endpoint

app.post('/api/execute-transaction', async (req: Request<object, object, ExecuteTransactionRequest>, res: Response) => {

    try {

        const { digest, signature } = req.body;

        // Validation

        if (!digest || !signature) {

            return res.status(400).json({ 

                error: 'Missing required fields: digest, signature' 

            });

        }

        console.log(`Executing sponsored transaction with digest: ${digest}`);

        // Execute the sponsored transaction

        const result = await enokiClient.executeSponsoredTransaction({

            digest,

            signature,

        });

        res.json({

            success: true,

            result,

        });

    } catch (error) {

        console.error('Error executing transaction:', error);

        res.status(500).json({ 

            error: 'Failed to execute transaction',

            details: error instanceof Error ? error.message : 'Unknown error'

        });

    }

});

// Walrus upload proxy endpoint to avoid browser CORS issues
app.put('/api/walrus-upload', async (req: Request, res: Response) => {
    try {
        const userAddress = typeof req.query.userAddress === 'string'
            ? req.query.userAddress
            : undefined;
        const epochs = typeof req.query.epochs === 'string'
            ? req.query.epochs
            : '5';

        const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-01.tududes.com';

        let uploadUrl = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`;
        if (userAddress) {
            uploadUrl += `&send_object_to=${encodeURIComponent(userAddress)}`;
        }

        const walrusResponse = await axios.put(uploadUrl, req.body, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            timeout: 60000,
        });

        return res.status(walrusResponse.status).json(walrusResponse.data);
    } catch (error: any) {
        console.error('Error uploading to Walrus via proxy:', error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                (error.response?.data as any)?.message || error.message || 'Unknown Walrus error';

            return res.status(status).json({
                error: 'Failed to upload to Walrus',
                details: message,
            });
        }

        return res.status(500).json({
            error: 'Failed to upload to Walrus',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Error handling middleware

app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {

    console.error('Unhandled error:', err);

    res.status(500).json({ error: 'Internal server error' });

});

// Start server

app.listen(PORT, () => {

    console.log(`🚀 Enoki sponsor service running on port ${PORT}`);

    console.log(`📍 Health check: http://localhost:${PORT}/health`);

});

// Graceful shutdown

process.on('SIGTERM', () => {

    console.log('Received SIGTERM, shutting down gracefully');

    process.exit(0);

});

process.on('SIGINT', () => {

    console.log('Received SIGINT, shutting down gracefully');

    process.exit(0);

});

