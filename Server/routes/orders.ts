import express from 'express';
import authenticateToken from '../middleware/header_auth';
import {
  getOrderEligibility,
  createReturnRequest,
  createCancelRequest,
  markAsDelivered,
} from '../controller/orders';

const router = express.Router();

// ✅ ALL order actions MUST be authenticated
router.get('/:orderId/eligibility', authenticateToken, getOrderEligibility);
router.post('/:orderId/return-request', authenticateToken, createReturnRequest);
router.post('/:orderId/cancel-request', authenticateToken, createCancelRequest);
router.put('/:orderId/mark-delivered', authenticateToken, markAsDelivered);

export default router;
