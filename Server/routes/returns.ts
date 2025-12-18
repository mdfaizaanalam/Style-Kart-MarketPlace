import express, { Request, Response } from 'express';
import { createReturnRequest } from '../controller/returns-controller';
import { client as pool } from '../data/DB';

const router = express.Router();

router.post('/', createReturnRequest);

router.post('/eligibility', async (req: Request, res: Response) => {
    const { orderId, productId } = req.body;

    try {
        const query = `
            SELECT EXISTS (
                SELECT 1
                FROM orderitems
                WHERE orderid = $1 AND productid = $2
            )
        `;
        const result = await pool.query(query, [orderId, productId]);
        const isEligible = result.rows[0].exists;

        if (isEligible) {
            res.json({ eligible: true });
        } else {
            res.json({ eligible: false, message: 'Product not in order' });
        }
    } catch (error) {
        console.error('Eligibility check error:', error);
        res.status(500).json({ eligible: false, message: 'Server error' });
    }
});

export default router;
