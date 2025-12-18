import express from 'express';
import { markAsDelivered } from '../controller/delivery-controller';

const router = express.Router();

router.post('/:orderId/deliver', markAsDelivered);

export default router;
