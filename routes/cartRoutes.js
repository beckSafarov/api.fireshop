import express from 'express';
const router = express.Router();
import {
  addCartItem,
  addMany,
  flushCartItems,
  getAllCartItems,
  removeCartItem,
  updateItemQts,
  updateQty,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

router.use('/', protect);

router.route('/').get(getAllCartItems).post(addCartItem).delete(flushCartItems);

router.route('/many').post(addMany).put(updateItemQts);
router.route('/qty').put(updateQty);
router.route('/:id').delete(removeCartItem);

export default router;
