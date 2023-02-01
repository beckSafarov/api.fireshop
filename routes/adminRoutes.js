// URL: /api/admin/
import express from 'express';
const router = express.Router();
import {
  removeUser,
  getAllUsers,
  getUserById,
  updateUserById,
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/auth.js';

router.use('/', protect, isAdmin);

router.route('/users').get(getAllUsers);

router
  .route('/users/:id')
  .get(getUserById)
  .put(updateUserById)
  .delete(removeUser);

export default router;
