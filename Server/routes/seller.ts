import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateSeller from '../middleware/authenticateSeller';

const router = express.Router();

// ✅ Use consistent JWT_SECRET
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY || 'myothertestsecret';

/* =========================================
   SELLER LOGIN
   ========================================= */
router.post('/login', async (req: Request, res: Response) => {
  console.log('[SELLER LOGIN] Request received:', { email: req.body.email });
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const query = 'SELECT * FROM sellers WHERE email = $1';
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const seller = result.rows[0];
    console.log('[SELLER LOGIN] Seller found:', { seller_id: seller.seller_id });

    const validPassword = await bcrypt.compare(password, seller.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        seller_id: seller.seller_id,
        email: seller.email,
        role: 'seller'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('[SELLER LOGIN] Login successful, token generated');

    return res.status(200).json({
      message: 'Login successful',
      seller: {
        seller_id: seller.seller_id,
        name: seller.name,
        email: seller.email,
        storename: seller.storename,
        verified: seller.verified
      },
      token
    });
  } catch (error: any) {
    console.error('[SELLER LOGIN] Error:', error);
    return res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
});


/* =========================================
   SELLER REGISTRATION
   ========================================= */
router.post('/register', async (req: Request, res: Response) => {
  console.log('[SELLER REGISTER] Request received:', { email: req.body.email });
  try {
    const { name, email, password, storename, description } = req.body;

    // Validate required fields
    if (!name || !email || !password || !storename) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Name, email, password, and store name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if seller already exists
    const checkQuery = 'SELECT * FROM sellers WHERE email = $1';
    const existingResult = await client.query(checkQuery, [email]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        details: 'A seller account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new seller - USE join_date NOT createdat
    const insertQuery = `
      INSERT INTO sellers (name, email, password, storename, description, verified, join_date)
      VALUES ($1, $2, $3, $4, $5, false, CURRENT_DATE)
      RETURNING seller_id, name, email, storename, verified
    `;

    const insertResult = await client.query(insertQuery, [
      name,
      email,
      hashedPassword,
      storename,
      description || ''
    ]);

    const newSeller = insertResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        seller_id: newSeller.seller_id,
        email: newSeller.email,
        role: 'seller'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('[SELLER REGISTER] Registration successful:', {
      seller_id: newSeller.seller_id
    });

    return res.status(201).json({
      message: 'Registration successful',
      seller: {
        seller_id: newSeller.seller_id,
        name: newSeller.name,
        email: newSeller.email,
        storename: newSeller.storename,
        verified: newSeller.verified
      },
      token
    });

  } catch (error: any) {
    console.error('[SELLER REGISTER] Error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
});



/* =========================================
   GET DASHBOARD STATS
   ========================================= */
router.get('/dashboard/stats', authenticateSeller, async (req: Request, res: Response) => {
  console.log('[DASHBOARD STATS] Request for seller:', req.seller?.seller_id);
  try {
    const sellerId = req.seller?.seller_id;

    // Total orders - FIX: Use totalamount instead of total
    const ordersQuery = `
      SELECT 
        COUNT(DISTINCT o.orderid) as total_orders,
        SUM(CASE WHEN o.orderstatus = 'pending' OR o.orderstatus = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.orderstatus = 'confirmed' OR o.orderstatus = 'Confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN o.orderstatus = 'delivered' OR o.orderstatus = 'Delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN o.orderstatus = 'cancelled' OR o.orderstatus = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders o
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      WHERE p.seller_id = $1
    `;
    const ordersResult = await client.query(ordersQuery, [sellerId]);

    // Total revenue - FIX: Use totalamount and correct payment status check
    const revenueQuery = `
      SELECT COALESCE(SUM(o.totalamount::numeric), 0) as total_revenue
      FROM orders o
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      JOIN payments pay ON o.orderid = pay.orderid
      WHERE p.seller_id = $1 
        AND (pay.paymentstatus = 'Confirmed' OR pay.paymentstatus = 'Pending')
    `;
    const revenueResult = await client.query(revenueQuery, [sellerId]);

    // Total products
    const productsQuery = 'SELECT COUNT(*) as total_products FROM products WHERE seller_id = $1';
    const productsResult = await client.query(productsQuery, [sellerId]);

    // Return requests
    // Return requests - FIX: Check for all pending statuses
    const returnsQuery = `
  SELECT COUNT(*) as return_requests
  FROM return_requests rr
  JOIN products p ON rr.product_id = p.productid
  WHERE p.seller_id = $1 
    AND (rr.status = 'Pending' OR rr.status = 'pending' OR rr.status IS NULL)
`;

    const returnsResult = await client.query(returnsQuery, [sellerId]);

    const stats = {
      totalOrders: parseInt(ordersResult.rows[0]?.total_orders) || 0,
      pendingOrders: parseInt(ordersResult.rows[0]?.pending_orders) || 0,
      confirmedOrders: parseInt(ordersResult.rows[0]?.confirmed_orders) || 0,
      deliveredOrders: parseInt(ordersResult.rows[0]?.delivered_orders) || 0,
      cancelledOrders: parseInt(ordersResult.rows[0]?.cancelled_orders) || 0,
      totalRevenue: parseFloat(revenueResult.rows[0]?.total_revenue) || 0,
      totalProducts: parseInt(productsResult.rows[0]?.total_products) || 0,
      returnRequests: parseInt(returnsResult.rows[0]?.return_requests) || 0
    };

    console.log('[DASHBOARD STATS] Stats:', stats);
    res.status(200).json(stats);
  } catch (error: any) {
    console.error('[DASHBOARD STATS] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      details: error.message
    });
  }
});


/* =========================================
   GET SELLER ORDERS
   ========================================= */
router.get('/orders', authenticateSeller, async (req: Request, res: Response) => {
  console.log('[GET ORDERS] Request for seller:', req.seller?.seller_id);
  try {
    const sellerId = req.seller?.seller_id;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = 'WHERE p.seller_id = $1';
    const params: any[] = [sellerId];

    if (status !== 'all') {
      params.push(status);
      whereClause += ` AND COALESCE(o.orderstatus, o.status) = $${params.length}`;
    }

    const query = `
      SELECT DISTINCT
        o.orderid,
        o.userid,
        o.total as totalprice,
        COALESCE(o.orderstatus, o.status) as status,
        o.paymenttype as payment_method,
        COALESCE(o.paymentstatus, 'pending') as payment_status,
        o.orderdate as order_date,
        o.delivered_date,
        o.cancelled_date,
        o.cancellation_reason,
        u.username,
        u.email as user_email,
        u.phone_no as user_phone
      FROM orders o
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      JOIN users u ON o.userid = u.userid
      ${whereClause}
      ORDER BY o.orderdate DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await client.query(query, params);

    // Count total
    const countQuery = `
      SELECT COUNT(DISTINCT o.orderid) as total
      FROM orders o
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, params.slice(0, status !== 'all' ? 2 : 1));

    console.log(`[GET ORDERS] Found ${result.rows.length} orders`);

    res.status(200).json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit as string))
    });
  } catch (error: any) {
    console.error('[GET ORDERS] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
});

/* =========================================
   MARK ORDER AS DELIVERED
   ========================================= */
router.put('/orders/:orderId/deliver', authenticateSeller, async (req: Request, res: Response) => {
  console.log('[MARK DELIVERED] Order:', req.params.orderId);
  try {
    const sellerId = req.seller?.seller_id;
    const { orderId } = req.params;

    // Verify seller owns this order
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM orderitems oi
      JOIN products p ON oi.productid = p.productid
      WHERE oi.orderid = $1 AND p.seller_id = $2
    `;
    const verifyResult = await client.query(verifyQuery, [orderId, sellerId]);

    if (parseInt(verifyResult.rows[0].count) === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updateQuery = `
      UPDATE orders
      SET orderstatus = 'delivered',
          status = 'delivered',
          delivered_date = NOW()
      WHERE orderid = $1
      RETURNING *
    `;
    const result = await client.query(updateQuery, [orderId]);

    console.log('[MARK DELIVERED] Success');
    res.status(200).json({
      message: 'Order marked as delivered',
      order: result.rows[0]
    });
  } catch (error: any) {
    console.error('[MARK DELIVERED] Error:', error);
    res.status(500).json({
      error: 'Failed to mark as delivered',
      details: error.message
    });
  }
});

/* =========================================
   GET MY PRODUCTS
   ========================================= */
router.get('/my-products', authenticateSeller, async (req: Request, res: Response) => {
  console.log('[GET MY PRODUCTS] Request for seller:', req.seller?.seller_id);
  try {
    const sellerId = req.seller?.seller_id;
    const { page = 1, limit = 40 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const query = `
      SELECT 
        p.productid,
        p.title,
        p.description,
        p.price,
        p.discount,
        p.stock,
        p.category,
        p.tags,
        pi.imglink,
        p.createdat
      FROM products p
      LEFT JOIN productimages pi ON p.productid = pi.productid AND pi.isprimary = true
      WHERE p.seller_id = $1
      ORDER BY p.createdat DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await client.query(query, [sellerId, limit, offset]);

    const countQuery = 'SELECT COUNT(*) as total FROM products WHERE seller_id = $1';
    const countResult = await client.query(countQuery, [sellerId]);

    console.log(`[GET MY PRODUCTS] Found ${result.rows.length} products`);

    res.status(200).json({
      products: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page as string),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit as string))
    });
  } catch (error: any) {
    console.error('[GET MY PRODUCTS] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

/* =========================================
   GET CANCEL REQUESTS
   ========================================= */
router.get('/cancel-requests', authenticateSeller, async (req: Request, res: Response) => {
  try {
    const sellerId = req.seller?.seller_id;

    const query = `
      SELECT 
        rcr.request_id,
        rcr.order_id,
        rcr.reason,
        rcr.comments,
        rcr.request_date,
        rcr.status as request_status,
        o.orderid,
        o.total as totalprice,
        COALESCE(o.orderstatus, o.status) as order_status,
        u.username,
        u.email as user_email
      FROM return_cancel_requests rcr
      JOIN orders o ON rcr.order_id = o.orderid
      JOIN users u ON o.userid = u.userid
      JOIN orderitems oi ON o.orderid = oi.orderid
      JOIN products p ON oi.productid = p.productid
      WHERE rcr.request_type = 'cancel' AND p.seller_id = $1
      GROUP BY rcr.request_id, o.orderid, u.userid, u.username, u.email
      ORDER BY rcr.request_date DESC
    `;
    const result = await client.query(query, [sellerId]);

    res.status(200).json({
      success: true,
      cancelRequests: result.rows
    });
  } catch (error: any) {
    console.error('[CANCEL REQUESTS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancel requests',
      details: error.message
    });
  }
});

/* =========================================
   GET RETURN REQUESTS
   ========================================= */
router.get('/return-requests', authenticateSeller, async (req: Request, res: Response) => {
  try {
    const sellerId = req.seller?.seller_id;

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
        o.total as totalprice,
        COALESCE(o.orderstatus, o.status) as order_status,
        u.username,
        u.email as user_email,
        p.title as product_title,
        p.price as product_price,
        pi.imglink as product_image
      FROM return_requests rr
      JOIN orders o ON rr.order_id = o.orderid
      JOIN users u ON o.userid = u.userid
      JOIN products p ON rr.product_id = p.productid
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
    console.error('[RETURN REQUESTS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch return requests',
      details: error.message
    });
  }
});


/* =========================================
   GET SELLER PRODUCTS
   ========================================= */
router.get('/products/:sellerId', authenticateSeller, async (req: Request, res: Response) => {
  const { sellerId } = req.params;

  try {
    const query = `
      SELECT 
        p.productid,
        p.title,
        p.description,
        p.price,
        p.discount,
        p.stock,
        p.category,
        p.tags,
        pi.imglink,
        p.createdat
      FROM products p
      LEFT JOIN productimages pi ON p.productid = pi.productid AND pi.isprimary = true
      WHERE p.seller_id = $1
      ORDER BY p.createdat DESC
    `;

    const result = await client.query(query, [sellerId]);

    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GET SELLER PRODUCTS] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});


/* =========================================
   APPROVE RETURN REQUEST
   ========================================= */
router.put('/orders/:orderId/approve-return', authenticateSeller, async (req: Request, res: Response) => {
  console.log('[APPROVE RETURN] Order:', req.params.orderId);
  try {
    const sellerId = req.seller?.seller_id;
    const { orderId } = req.params;

    // Verify seller owns this order
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM orderitems oi
      JOIN products p ON oi.productid = p.productid
      WHERE oi.orderid = $1 AND p.seller_id = $2
    `;
    const verifyResult = await client.query(verifyQuery, [orderId, sellerId]);

    if (parseInt(verifyResult.rows[0].count) === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update order status to "Returned"
    const updateQuery = `
      UPDATE orders
      SET orderstatus = 'Returned',
          status = 'Returned'
      WHERE orderid = $1
      RETURNING *
    `;
    const result = await client.query(updateQuery, [orderId]);

    // TODO: Process refund here (if applicable)

    console.log('[APPROVE RETURN] Success');
    res.status(200).json({
      message: 'Return approved successfully',
      order: result.rows[0]
    });
  } catch (error: any) {
    console.error('[APPROVE RETURN] Error:', error);
    res.status(500).json({
      error: 'Failed to approve return',
      details: error.message
    });
  }
});



export default router;
