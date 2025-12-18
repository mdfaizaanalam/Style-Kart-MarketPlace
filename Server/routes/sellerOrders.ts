import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import authenticateSeller from '../middleware/authenticateSeller';

const router = express.Router();

/* =========================================
   GET ALL ORDERS FOR SELLER'S PRODUCTS
========================================= */
router.get('/orders/:sellerId', authenticateSeller, async (req: Request, res: Response) => {
  const { sellerId } = req.params;
  console.log('[SELLER ORDERS] Fetching orders for seller:', sellerId);

  try {
    const query = `
      SELECT 
        o.orderid,
        o.userid,
        o.totalamount as totalprice,
        o.orderstatus as status,
        pay.paymentmethod as payment_method,
        pay.paymentstatus as payment_status,
        o.createdat as order_date,
        o.delivered_date,
        o.cancelled_date,
        o.cancellation_reason,
        u.username,
        u.email as user_email,
        json_agg(
          json_build_object(
            'productid', p.productid,
            'title', p.title,
            'price', p.price,
            'discount', p.discount,
            'quantity', oi.quantity,
            'imglink', pi.imglink
          )
        ) as products
      FROM orders o
      JOIN users u ON o.userid = u.userid
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      LEFT JOIN payments pay ON o.orderid = pay.orderid
      LEFT JOIN productimages pi ON p.productid = pi.productid AND pi.isprimary = true
      WHERE p.seller_id = $1
      GROUP BY o.orderid, u.userid, u.username, u.email, pay.paymentmethod, pay.paymentstatus
      ORDER BY o.createdat DESC
    `;
    
    const result = await client.query(query, [sellerId]);
    console.log(`[SELLER ORDERS] Found ${result.rows.length} orders`);
    
    res.status(200).json({
      success: true,
      orders: result.rows
    });
  } catch (error: any) {
    console.error('[SELLER ORDERS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
});

/* =========================================
   GET CANCEL REQUESTS FOR SELLER
========================================= */
router.get('/cancel-requests/:sellerId', authenticateSeller, async (req: Request, res: Response) => {
  const { sellerId } = req.params;
  
  try {
    const query = `
      SELECT 
        rcr.request_id,
        rcr.order_id,
        rcr.request_type,
        rcr.reason,
        rcr.comments,
        rcr.request_date,
        rcr.status as request_status,
        o.orderid,
        o.totalamount as totalprice,
        o.orderstatus as status,
        u.username,
        u.email as user_email,
        json_agg(
          json_build_object(
            'productid', p.productid,
            'title', p.title,
            'price', p.price,
            'imglink', pi.imglink
          )
        ) as products
      FROM return_cancel_requests rcr
      JOIN orders o ON rcr.order_id = o.orderid
      JOIN users u ON o.userid = u.userid
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      LEFT JOIN productimages pi ON p.productid = pi.productid AND pi.isprimary = true
      WHERE rcr.request_type = 'cancel' AND p.seller_id = $1
      GROUP BY rcr.request_id, o.orderid, u.userid, u.username, u.email, rcr.status
      ORDER BY rcr.request_date DESC
    `;
    
    const result = await client.query(query, [sellerId]);
    
    res.status(200).json({
      success: true,
      cancelRequests: result.rows
    });
  } catch (error: any) {
    console.error('[SELLER CANCEL REQUESTS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancel requests',
      details: error.message
    });
  }
});

/* =========================================
   GET RETURN REQUESTS FOR SELLER
========================================= */
router.get('/return-requests/:sellerId', authenticateSeller, async (req: Request, res: Response) => {
  const { sellerId } = req.params;
  
  try {
    const query = `
      SELECT 
        rr.request_id,
        rr.order_id,
        rr.product_id,
        rr.reason,
        rr.comments,
        rr.status as request_status,
        rr.request_date,
        o.orderid,
        o.totalamount as totalprice,
        o.orderstatus as status,
        u.username,
        u.email as user_email,
        p.title as product_title,
        p.price as product_price,
        pi.imglink as product_image
      FROM return_requests rr
      JOIN orders o ON rr.order_id = o.orderid
      JOIN users u ON o.userid = u.userid
      JOIN products p ON rr.product_id = p.productid
      JOIN orderitems oi ON o.orderid = oi.orderid AND oi.productid = p.productid
      LEFT JOIN productimages pi ON p.productid = pi.productid AND pi.isprimary = true
      WHERE p.seller_id = $1
      ORDER BY rr.request_date DESC
    `;
    
    const result = await client.query(query, [sellerId]);
    
    res.status(200).json({
      success: true,
      returnRequests: result.rows
    });
  } catch (error: any) {
    console.error('[SELLER RETURN REQUESTS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch return requests',
      details: error.message
    });
  }
});

/* =========================================
   MARK ORDER AS DELIVERED (SELLER ACTION)
========================================= */
router.put('/orders/:orderId/mark-delivered', authenticateSeller, async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { sellerId } = req.body;
  
  try {
    // Verify the order contains products from this seller
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM orderitems oi
      JOIN products p ON oi.productid = p.productid
      WHERE oi.orderid = $1 AND p.seller_id = $2
    `;
    
    const verifyResult = await client.query(verifyQuery, [orderId, sellerId]);
    
    if (verifyResult.rows[0].count === '0') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this order'
      });
    }
    
    // Update order status
    const updateQuery = `
      UPDATE orders 
      SET orderstatus = 'delivered',
          delivered_date = NOW()
      WHERE orderid = $1
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [orderId]);
    
    res.status(200).json({
      success: true,
      message: 'Order marked as delivered',
      order: result.rows[0]
    });
  } catch (error: any) {
    console.error('[MARK AS DELIVERED] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark order as delivered',
      details: error.message
    });
  }
});

/* =========================================
   UPDATE CANCEL REQUEST STATUS (APPROVE/REJECT)
========================================= */
router.put('/cancel-requests/:requestId', authenticateSeller, async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { status, sellerId } = req.body; // status: 'approved' or 'rejected'
  
  try {
    // If approved, also update the order status
    if (status === 'approved') {
      const cancelQuery = `
        UPDATE return_cancel_requests 
        SET status = $1
        WHERE request_id = $2
        RETURNING order_id
      `;
      
      const cancelResult = await client.query(cancelQuery, [status, requestId]);
      const orderId = cancelResult.rows[0]?.order_id;
      
      if (orderId) {
        await client.query(
          `UPDATE orders SET orderstatus = 'cancelled', cancelled_date = NOW() WHERE orderid = $1`,
          [orderId]
        );
      }
    } else {
      await client.query(
        `UPDATE return_cancel_requests SET status = $1 WHERE request_id = $2`,
        [status, requestId]
      );
    }
    
    res.status(200).json({
      success: true,
      message: `Cancel request ${status}`
    });
  } catch (error: any) {
    console.error('[UPDATE CANCEL REQUEST] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cancel request',
      details: error.message
    });
  }
});

/* =========================================
   UPDATE RETURN REQUEST STATUS (APPROVE/REJECT/PROCESSING)
========================================= */
router.put('/return-requests/:id', authenticateSeller, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // "Approved", "Rejected", "Processing"
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Update return request status
      const updateResult = await client.query(
        'UPDATE return_requests SET status = $1, request_status = $1 WHERE request_id = $2 RETURNING *',
        [status, id]
      );
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false,
          error: 'Return request not found' 
        });
      }
      
      const returnRequest = updateResult.rows[0];
      console.log('[RETURN REQUEST] Updated:', returnRequest);
      
      // If approved, update order status to "Returned"
      if (status === 'Approved') {
        // First, get the payment method from the order
        const orderQuery = `
          SELECT o.orderid, pay.paymentmethod 
          FROM orders o
          LEFT JOIN payments pay ON o.orderid = pay.orderid
          WHERE o.orderid = $1
        `;
        const orderResult = await client.query(orderQuery, [returnRequest.order_id]);
        
        if (orderResult.rows.length > 0) {
          const paymentMethod = orderResult.rows[0].paymentmethod || '';
          const isOnlinePayment = ['Card', 'card', 'Online', 'online', 'UPI', 'upi'].includes(paymentMethod);
          
          // Update order status
          await client.query(
            `UPDATE orders 
             SET orderstatus = 'Returned'
             WHERE orderid = $1`,
            [returnRequest.order_id]
          );
          
          // Update payment status
          const newPaymentStatus = isOnlinePayment ? 'Payment Refunded' : 'Return Completed';
          await client.query(
            `UPDATE payments 
             SET paymentstatus = $1
             WHERE orderid = $2`,
            [newPaymentStatus, returnRequest.order_id]
          );
          
          console.log(`[RETURN APPROVED] Order ${returnRequest.order_id} status updated to "Returned"`);
          console.log(`[RETURN APPROVED] Payment status updated to "${newPaymentStatus}"`);
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      res.status(200).json({ 
        success: true, 
        message: `Return request ${status.toLowerCase()}`,
        returnRequest: updateResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[RETURN REQUEST TRANSACTION ERROR]', err);
      throw err;
    }
  } catch (error: any) {
    console.error('[RETURN REQUEST ERROR]', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update return request',
      details: error.message
    });
  }
});

export default router;
