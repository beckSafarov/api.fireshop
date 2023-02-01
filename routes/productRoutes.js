import express from 'express'
const router = express.Router()
import {
  addProduct,
  addProductReview,
  deleteProduct,
  getProductById,
  getProducts,
  getTopProducts,
  updateProduct,
  updateReview,
} from '../controllers/productController.js'
import { protect, isAdmin } from '../middleware/auth.js'

router.route('/').get(getProducts).post(protect, isAdmin, addProduct)
router.get('/top', getTopProducts)
router
  .route('/:id')
  .get(getProductById)
  .put(protect, isAdmin, updateProduct)
  .delete(protect, isAdmin, deleteProduct)



router
  .route('/:id/reviews')
  .post(protect, addProductReview)
  .put(protect, updateReview)

export default router
