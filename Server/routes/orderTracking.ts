import express, { Request, Response } from 'express';
import { client } from '../data/DB';

const router = express.Router();

// Get Order Status with Tracking History
router.get('/status/:orderId', async (req: Request, res: Response) => {
    const { orderId } = req.params;
    
    try {
        const orderQuery = `
            SELECT o.*, 
                   p.title as product_title,
                   pi.imglink,
                   s.storename as seller_name,
                   a.addressline1, a.city, a.state, a.postalcode
            FROM orders o
            LEFT JOIN products p ON o.productid = p.productid
            LEFT JOIN productimages pi ON p.productid = pi.productid
            LEFT JOIN sellers s ON p.seller_id = s.sellerid
            LEFT JOIN addresses a ON o.addressid = a.addressid
            WHERE o.orderid = $1
        `;
        const order = await client.query(orderQuery, [orderId]);
        
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const historyQuery = `
            SELECT * FROM order_status_history 
            WHERE orderid = $1 
            ORDER BY updated_at ASC
        `;
        const history = await client.query(historyQuery, [orderId]);
        
        const currentStatus = order.rows[0].status || 'Ordered';
        
        res.json({
            order: order.rows[0],
            statusHistory: history.rows,
            trackingSteps: [
                { step: 1, status: 'Ordered', completed: true, date: order.rows[0].createdat },
                { step: 2, status: 'Shipped', completed: ['Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus), date: order.rows[0].shipped_at },
                { step: 3, status: 'Out for Delivery', completed: ['Out for Delivery', 'Delivered'].includes(currentStatus), date: order.rows[0].out_for_delivery_at },
                { step: 4, status: 'Delivered', completed: currentStatus === 'Delivered', date: order.rows[0].delivered_at }
            ]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order status' });
    }
});

// Update Order Status (Seller/Admin)
router.put('/update-status', async (req: Request, res: Response) => {
    const { orderId, status, message } = req.body;
    
    const validStatuses = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        let updateQuery = 'UPDATE orders SET status = $1';
        const params: any[] = [status];
        
        if (status === 'Shipped') {
            updateQuery += ', shipped_at = CURRENT_TIMESTAMP, expected_delivery = CURRENT_DATE + INTERVAL \'5 days\'';
        } else if (status === 'Out for Delivery') {
            updateQuery += ', out_for_delivery_at = CURRENT_TIMESTAMP';
        } else if (status === 'Delivered') {
            updateQuery += ', delivered_at = CURRENT_TIMESTAMP';
        }
        
        updateQuery += ', updatedat = CURRENT_TIMESTAMP WHERE orderid = $2';
        params.push(orderId);
        
        await client.query(updateQuery, params);
        
        const historyQuery = `
            INSERT INTO order_status_history (orderid, status, message)
            VALUES ($1, $2, $3)
        `;
        await client.query(historyQuery, [orderId, status, message || `Order ${status.toLowerCase()}`]);
        
        res.json({ message: 'Order status updated successfully', status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Get User Orders with Tracking
router.get('/user/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
        const query = `
            SELECT o.*, 
                   p.title as product_title, 
                   pi.imglink,
                   s.storename as seller_name
            FROM orders o
            LEFT JOIN products p ON o.productid = p.productid
            LEFT JOIN productimages pi ON p.productid = pi.productid
            LEFT JOIN sellers s ON p.seller_id = s.sellerid
            WHERE o.userid = $1
            ORDER BY o.createdat DESC
        `;
        const result = await client.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

export default router;