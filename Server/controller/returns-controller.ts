import { Request, Response } from 'express';
import { client as pool } from '../data/DB';

export const createReturnRequest = async (req: Request, res: Response) => {
  const { order_id, product_id, reason } = req.body;

  if (!order_id || !product_id || !reason) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newReturnRequest = await pool.query(
      'INSERT INTO return_requests (order_id, product_id, reason) VALUES ($1, $2, $3) RETURNING *',
      [order_id, product_id, reason]
    );

    res.status(201).json(newReturnRequest.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
