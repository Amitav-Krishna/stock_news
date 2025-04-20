import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { stockSymbol } = req.query;

        if (!stockSymbol) {
            return res.status(400).json({ error: 'Stock symbol is required' });
        }

        try {
            // Fetch stock data from TimescaleDB or external APIs
            const stockData = await axios.get(`http://localhost:5000/stocks/${stockSymbol}`);
            return res.status(200).json(stockData.data);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch stock data' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
