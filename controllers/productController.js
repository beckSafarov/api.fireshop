import asyncHandler from 'express-async-handler'
import Product from '../models/productModel.js'
import Order from '../models/orderModel.js'

//@desc  Fetch all products
//@route GET /api/products
//@desc  Public
export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10
  const page = Number(req.query.pageNumber) || 1
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {}

  const count = await Product.countDocuments({ ...keyword })
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1))

  if (!products || products.length < 1) {
    if (req.query.keyword) {
      res.status(400)
      throw new Error(`No result found for ${req.query.keyword}`)
    }
    throw new Error('Could not get the products')
  }
  res.json({ products, page, pages: Math.ceil(count / pageSize) })
})

//@desc  Fetch all products
//@route GET /api/products/top
//@desc  Public
export const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3)
  res.status(200).json({ products })
})

//@desc  Fetch a single products
//@route GET /api/products/:id
//@desc  Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)

  if (!product) {
    res.status(400)
    throw new Error(`Product not found!`)
  }

  res.status(200).json({ success: true, data: product })
})

//@desc  Add product
//@route POST /api/products
//@desc  Private/Admin
export const addProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'New Product',
    price: 0,
    user: req.user._id,
    image: '/images/sample.jpg',
    brand: 'No Brand',
    category: 'No Category',
    countInStock: 0,
    numReviews: 0,
    description: 'Lorem ipsum dolor',
  })

  await product.save()
  res.status(201).json(product)
})

//@desc  Update product
//@route PUT /api/products/:id
//@desc  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!product) {
    res.status(404)
    throw new Error('No such product found!')
  }
  res.status(200).json({ product })
})

//@desc  Add new review
//@route POST /api/products/:id/reviews
//@desc  Private
export const addProductReview = asyncHandler(async (req, res) => {
  // req.body = {rating, comment};
  const { rating, comment } = req.body
  const valuesSent = rating && comment

  const product = valuesSent && (await Product.findById(req.params.id))

  const gotItDelivered = product
    ? await Order.find({
        user: req.user._id,
        isDelivered: true,
        'orderItems._id': `${product._id}`,
      })
    : null

  const alreadyReviewed = product
    ? product.reviews.find((r) => r.user.toString() === req.user._id.toString())
    : null

  const error = !valuesSent
    ? 'Insufficient data'
    : !product
    ? 'No such product found'
    : gotItDelivered.length === 0
    ? 'Only customers who got the product delivered can write a review'
    : alreadyReviewed
    ? 'Only one review per product is allowed per user!'
    : null

  if (error) {
    res.status(400)
    throw new Error(error)
  }

  product.reviews.push({
    name: req.user.name,
    rating: Number(rating),
    comment: comment,
    user: req.user._id,
    createdAt: new Date(),
  })

  product.numReviews = product.reviews.length

  product.rating =
    product.reviews.reduce((t, c) => c.rating + t, 0) / product.reviews.length

  await product.save()

  res.status(200).json({ message: 'Review added successfully' })
})

//@desc  Update a review
//@route PUT /api/products/:id/reviews
//@desc  Private
export const updateReview = asyncHandler(async (req, res) => {
  // req.body = {rating, comment}
  const { rating, comment } = req.body
  const valuesSent = rating && comment
  const product = valuesSent ? await Product.findById(req.params.id) : null
  const revs = product ? product.reviews : []

  if (valuesSent) {
    const rev = revs.find((r) => r.user.toString() === req.user._id.toString())
    rev.comment = req.body.comment
    rev.rating = req.body.rating
    rev.updatedAt = new Date()
  }

  const error = !valuesSent
    ? 'Insufficient details'
    : !product
    ? 'No such product found'
    : null
  if (error) {
    res.status(404)
    throw new Error(error)
  }

  product.rating =
    product.reviews.reduce((t, c) => c.rating + t, 0) / product.reviews.length

  await product.save()

  res.status(200).json({ reviews: product.reviews })
})

//@desc  Delete product
//@route DELETE /api/products/:id
//@desc  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const id = req.params.id

  const delProduct = await Product.findByIdAndDelete(id)
  if (!delProduct) {
    res.status(404)
    throw new Error('No such product found')
  }

  res.status(200).json({
    success: true,
    message: `${delProduct.name} has been deleted`,
  })
})
