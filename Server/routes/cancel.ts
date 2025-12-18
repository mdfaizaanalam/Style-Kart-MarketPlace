import express, { Request, Response } from "express";
import { client } from "../data/DB";

const router = express.Router();

// =========================
// CANCEL ORDER
// =========================
router.post("/", async (req: Request, res: Response) => {
  const { orderId, reason, message } = req.body;

  const parsedOrderId = parseInt(orderId, 10);

  if (isNaN(parsedOrderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  if (!reason) {
    return res.status(400).json({ success: false, message: "Reason is required" });
  }

  try {
    // 1. Check order exists
    const orderRes = await client.query(
      "SELECT * FROM orders WHERE orderid = $1",
      [parsedOrderId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orderRes.rows[0];
    const currentStatus = (order.orderstatus || order.status || '').toLowerCase().trim();

    // 2. ✅ BLOCK: Cannot cancel if delivered, return_requested, or returned
    if (currentStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a delivered order. Please request a return instead."
      });
    }

    if (currentStatus === 'return_requested') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel - return request already submitted"
      });
    }

    if (currentStatus === 'returned') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel - order already returned"
      });
    }

    if (currentStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled"
      });
    }

    // 3. ✅ UPDATE: Set orderstatus to Cancelled
    const cancellationReason = message ? `${reason}: ${message}` : reason;
    await client.query(
      `UPDATE orders 
        SET orderstatus = 'Cancelled', cancelled_date = NOW(), cancellation_reason = $1 
        WHERE orderid = $2`,
      [cancellationReason, parsedOrderId]
    );

    return res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
