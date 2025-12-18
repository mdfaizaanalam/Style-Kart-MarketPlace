import { Request, Response } from 'express';
import { client as pool } from '../data/DB';

export const markAsDelivered = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const parsedOrderId = parseInt(orderId, 10);

  if (isNaN(parsedOrderId)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    const updatedOrder = await pool.query(
      'UPDATE orders SET status = $1, delivery_date = $2 WHERE orderid = $3 RETURNING *',
      ['Delivered', new Date(), parsedOrderId]
    );

    if (updatedOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(updatedOrder.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
