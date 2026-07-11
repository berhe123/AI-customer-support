import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import * as customerController from './customer.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', customerController.listCustomers);
router.get('/:id', customerController.getCustomer);

export default router;
