import { Request, Response } from 'express';
import { client } from '../data/DB';

// Helper: determine user id column name in orders row
function getOrderUserId(orderRow: any): number | null {
  if (orderRow.user_id) return orderRow.user_id;
  if (orderRow.userid) return orderRow.userid;
  if (orderRow.customer_id) return orderRow.customer_id;
  if (orderRow.userId) return orderRow.userId;
  return null;
}

export const getOrderEligibility = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  console.log('[getOrderEligibility] Checking eligibility for order:', orderId);

  try {
    const orderQuery = 'SELECT * FROM orders WHERE orderid = $1';
    const orderResult = await client.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      console.log('[getOrderEligibility] Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    console.log('[getOrderEligibility] Order found:', {
      orderid: order.orderid,
      orderstatus: order.orderstatus,
      status: order.status,
      delivered_date: order.delivered_date,
      cancelled_date: order.cancelled_date
    });

    // ✅ FIX: Declare normalizedStatus FIRST
    const normalizedStatus = (order.orderstatus || order.status || '').toLowerCase().trim();
    console.log('[getOrderEligibility] Normalized status:', normalizedStatus);

    // ✅ CHECK: Block if return already requested
    const requestQuery = 'SELECT * FROM return_cancel_requests WHERE order_id = $1';
    const requestResult = await client.query(requestQuery, [orderId]);

    if (requestResult.rows.length > 0) {
      console.log('[getOrderEligibility] Request already exists for order:', orderId);
      return res.json({
        eligible: false,
        reason: 'A request has already been submitted for this order'
      });
    }

    // ✅ CHECK: Block if status is return_requested or returned
    if (normalizedStatus === 'return_requested') {
      console.log('[getOrderEligibility] Order status is return_requested');
      return res.json({
        eligible: false,
        reason: 'Return request already submitted for this order'
      });
    }

    if (normalizedStatus === 'returned') {
      console.log('[getOrderEligibility] Order already returned');
      return res.json({
        eligible: false,
        reason: 'Order has already been returned'
      });
    }

    // ✅ CHECK: Delivered orders can be returned
    if (normalizedStatus === 'delivered') {
      const deliveredDate = order.delivered_date ? new Date(order.delivered_date) : null;

      console.log('[getOrderEligibility] Order is delivered, checking return window');
      console.log('[getOrderEligibility] Delivered date:', deliveredDate);

      if (!deliveredDate) {
        console.log('[getOrderEligibility] No delivered_date found');
        return res.json({
          eligible: false,
          reason: 'Delivered date missing'
        });
      }

      const returnWindow = 7; // days
      const eligibilityDate = new Date(deliveredDate.getTime() + returnWindow * 24 * 60 * 60 * 1000);
      const now = new Date();

      console.log('[getOrderEligibility] Return window check:', {
        deliveredDate: deliveredDate.toISOString(),
        eligibilityDate: eligibilityDate.toISOString(),
        now: now.toISOString(),
        expired: now > eligibilityDate
      });

      if (now > eligibilityDate) {
        return res.json({
          eligible: false,
          reason: 'Return window has expired (7 days from delivery)'
        });
      }

      console.log('[getOrderEligibility] Order is eligible for return');
      return res.json({ eligible: true, type: 'return' });
    }

    // ✅ CHECK: Cancelled orders are not eligible
    if (normalizedStatus === 'cancelled') {
      console.log('[getOrderEligibility] Order is already cancelled');
      return res.json({
        eligible: false,
        reason: 'Order is already cancelled'
      });
    }

    // ✅ All other statuses (confirmed, pending, etc.) are eligible for cancellation
    console.log('[getOrderEligibility] Order is eligible for cancellation');
    return res.json({ eligible: true, type: 'cancel' });

  } catch (error) {
    console.error('[getOrderEligibility] Error:', error);
    res.status(500).json({ error: 'Failed to check order eligibility' });
  }
};

export const createReturnRequest = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason, comments } = req.body;

  console.log('[createReturnRequest] Creating return for order:', orderId);

  try {
    const orderQuery = 'SELECT * FROM orders WHERE orderid = $1';
    const orderResult = await client.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const status = (order.orderstatus || order.status || '').toLowerCase().trim();

    console.log('[createReturnRequest] Order status:', status);

    // ✅ VALIDATION: Only delivered orders can be returned
    if (status !== 'delivered') {
      return res.status(400).json({ error: 'Order is not eligible for return' });
    }

    // ✅ VALIDATION: Check for existing return request
    const existing = await client.query(
      'SELECT 1 FROM return_cancel_requests WHERE order_id=$1 AND request_type=$2',
      [orderId, 'return']
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Return request already submitted' });
    }

    // ✅ INSERT: Create return request
    const insertQuery = `
      INSERT INTO return_cancel_requests (order_id, request_type, reason, comments, request_date)
      VALUES ($1, 'return', $2, $3, NOW())
      RETURNING request_id
    `;
    const insertRes = await client.query(insertQuery, [orderId, reason, comments]);

    // ✅ UPDATE: Set orderstatus to return_requested
    const updateQuery = 'UPDATE orders SET orderstatus = $1 WHERE orderid = $2 RETURNING *';
    const updated = await client.query(updateQuery, ['return_requested', orderId]);

    console.log('[createReturnRequest] Return request created successfully');

    res.json({
      message: 'Return request submitted successfully',
      requestId: insertRes.rows[0].request_id,
      order: updated.rows[0]
    });
  } catch (error) {
    console.error('[createReturnRequest] Error:', error);
    res.status(500).json({ error: 'Failed to submit return request' });
  }
};

export const createCancelRequest = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason, comments } = req.body;

  console.log('[createCancelRequest] Creating cancel for order:', orderId);

  try {
    const orderQuery = 'SELECT * FROM orders WHERE orderid = $1';
    const orderResult = await client.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const status = (order.orderstatus || order.status || '').toLowerCase().trim();

    console.log('[createCancelRequest] Order status:', status);

    if (status === 'delivered' || status === 'cancelled') {
      return res.status(400).json({ error: 'Order is not eligible for cancellation' });
    }

    // prevent duplicates
    const existing = await client.query(
      'SELECT 1 FROM return_cancel_requests WHERE order_id=$1 AND request_type=$2',
      [orderId, 'cancel']
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Cancel request already submitted' });
    }

    const insertQuery = `
      INSERT INTO return_cancel_requests (order_id, request_type, reason, comments, request_date)
      VALUES ($1, 'cancel', $2, $3, NOW())
      RETURNING request_id
    `;
    const insertRes = await client.query(insertQuery, [orderId, reason, comments]);

    // ✅ FIX: Update both orderstatus and cancelled_date
    const updateQuery = `
      UPDATE orders 
      SET orderstatus = $1, cancelled_date = NOW() 
      WHERE orderid = $2 
      RETURNING *
    `;
    const updated = await client.query(updateQuery, ['Cancelled', orderId]);

    console.log('[createCancelRequest] Cancel request created successfully');

    res.json({
      message: 'Cancel request submitted successfully',
      requestId: insertRes.rows[0].request_id,
      order: updated.rows[0]
    });
  } catch (error) {
    console.error('[createCancelRequest] Error:', error);
    res.status(500).json({ error: 'Failed to submit cancel request' });
  }
};

export const markAsDelivered = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  console.log('[markAsDelivered] Request received for orderId:', orderId);

  try {
    const orderQuery = 'SELECT * FROM orders WHERE orderid = $1';
    const orderResult = await client.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      console.log('[markAsDelivered] Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const currentStatus = (order.orderstatus || order.status || '').toLowerCase().trim();

    console.log('[markAsDelivered] Current order status:', currentStatus);

    // ✅ BLOCK: Cannot mark as delivered if cancelled or return requested
    if (currentStatus === 'cancelled') {
      return res.status(400).json({ error: 'Cannot mark a cancelled order as delivered' });
    }

    if (currentStatus === 'return_requested') {
      return res.status(400).json({ error: 'Cannot mark as delivered - return request pending' });
    }

    if (currentStatus === 'returned') {
      return res.status(400).json({ error: 'Cannot mark as delivered - order already returned' });
    }

    if (currentStatus === 'delivered') {
      return res.status(400).json({ error: 'Order already marked delivered' });
    }

    // ✅ UPDATE: Set both orderstatus and delivered_date
    const updateQuery = `
      UPDATE orders 
      SET orderstatus = $1, delivered_date = NOW() 
      WHERE orderid = $2 
      RETURNING *
    `;
    const updated = await client.query(updateQuery, ['Delivered', orderId]);

    console.log('[markAsDelivered] Order updated successfully:', updated.rows[0]);

    res.json({
      message: 'Order marked as delivered',
      order: updated.rows[0]
    });
  } catch (error) {
    console.error('[markAsDelivered] Error:', error);
    res.status(500).json({ error: 'Failed to mark order as delivered' });
  }
};