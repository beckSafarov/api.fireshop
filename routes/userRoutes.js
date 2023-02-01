import express from 'express';
const router = express.Router();
import {
  authUser,
  createShippingAddress,
  getOneUser,
  logout,
  me,
  signUser,
  updateShippingAddress,
  updateUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
// import cartRoutes from './cartRoutes';

// main
router.route('/').post(signUser);

// user info related
router.route('/me').get(me);
router.route('/profile').get(protect, getOneUser).put(protect, updateUser);
router
  .route('/shippingaddress')
  .post(protect, createShippingAddress)
  .put(protect, updateShippingAddress);

//auth related
router.route('/login').post(authUser);
router.route('/logout').put(protect, logout);

export default router;
