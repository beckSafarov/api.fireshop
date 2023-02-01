import asyncHandler from 'express-async-handler'
import User from '../models/userModel.js'
import Product from '../models/productModel.js'
import bcrypt from 'bcryptjs'
import { sendToken } from '../utils/sendToken.js'
import { joinDuplicateObjects } from '../helpers/helpers.js'

const isAvailable = asyncHandler(async (item) => {
  const product = await Product.findById(item._id)
  const error = !product
    ? `No order was found with the id of ${item._id}}`
    : product.countInStock < item.qty
    ? `Not enough products in stock. In stock: ${product.countInStock}, you require: ${qty}`
    : null

  return { product, error }
})

//@desc  add a cart item
//@route POST /api/users/cartitems
//@desc  Private, need authorization
export const addCartItem = asyncHandler(async (req, res) => {
  const { _id, qty } = req.body
  const user = req.user
  if (!_id || !qty) {
    res.status(404)
    throw new Error(`Insufficient data`)
  }

  const { product, error } = await isAvailable({ _id, qty })

  if (error) {
    res.status(404)
    throw new Error(error)
  }

  req.body.countInStock = product.countInStock

  const { more, cartItems } = await user.addCartItem({
    ...product._doc,
    qty: req.body.qty,
  })

  product.countInStock -= qty
  await user.save()
  await product.save()

  res.status(200).json({
    success: true,
    message: `You added ${qty} ${more} ${product.name}(s) to your shopping cart`,
    cartItems: cartItems,
  })
})

//@desc  add many cart items in an array
//@route POST /api/users/cartitems/many
//@desc  Private, need authorization
export const addMany = asyncHandler(async (req, res) => {
  const { user } = req
  let cart = user.cartItems
  const addedItems = req.body || []
  for (let item of addedItems) {
    const { product, error } = await isAvailable(item)

    if (error) {
      res.status(404)
      throw new Error(error)
    }

    // add items to cart
    cart.push({ ...product._doc, qty: item.qty })
    product.countInStock -= item.qty
    product.save()
  }
  user.cartItems = joinDuplicateObjects(cart)
  user.save()

  res.status(200).json({
    success: true,
    cartItems: user.cartItems,
  })
})

//@desc  add many cart items in an array
//@route PUT /api/users/cartitems/qty
//@desc  Private, need authorization
export const updateQty = asyncHandler(async (req, res) => {
  const cart = req.user.cartItems
  const { _id, qty } = req.body
  for (let i = 0; i < cart.length; i++) {
    if (cart[i]._id === _id) {
      cart[i].qty = qty
      break
    }
  }

  req.user.cartItems = cart
  req.user.save()
  res.status(200).json({
    success: true,
    cartItems: req.user.cartItems,
  })
})

//@desc  add many cart items in an array
//@route PUT /api/users/cartitems/many
//@desc  Private, need authorization
export const updateItemQts = asyncHandler(async (req, res) => {
  // {41423:2, 23433:3, ....};
  const qts = req.body
  const cartItems = req.user.cartItems
  Object.keys(qts).forEach((id) => {
    for (let i = 0; i < cartItems.length; i++) {
      if (cartItems[i]._id === id) {
        cartItems[i].qty = qts[id]
        break
      }
    }
  })

  req.user.cartItems = cartItems
  req.user.save()
  res.status(200).json({
    success: true,
    cartItems: req.user.cartItems,
  })
})

//@desc  get all items from cart
//@route GET /api/users/cartitems
//@desc  Private, need authorization
export const getAllCartItems = asyncHandler(async (req, res) => {
  const { cartItems } = await User.findById(req.user._id)
  res.status(200).json({ cartItems })
})

//@desc  remove an item from cart
//@route DELETE /api/users/cartitems/:id
//@desc  Private, need authorization
export const removeCartItem = asyncHandler(async (req, res) => {
  const itemId = req.params.id
  const response = await User.find({
    _id: req.user.id,
    'cartItems._id': itemId,
  })

  const user = response[0]
  if (!user) {
    res.status(400)
    throw new Error(`Seems like invalid id`)
  }

  // add the quantity of the deleting product to the countInStock of the item
  const product = await Product.findById(itemId)
  const productObj = user.cartItems.find((product) => product._id === itemId)
  product.countInStock += productObj.qty
  await product.save()

  user.removeCartItem(itemId)
  await user.save()
  res.status(200).json({
    success: true,
    message: `Item ${itemId} removed from cart`,
    cartItems: user.cartItems,
  })
})

//@desc  flush cart items
//@route DELETE /api/users/cartitems/
//@query /?destroy=true
//@desc  Private, need authorization
export const flushCartItems = asyncHandler(async (req, res) => {
  let product
  let destroy = req.query.destroy
  if (!destroy) {
    req.user.cartItems.forEach(async (item) => {
      product = await Product.findById(item._id)
      product.countInStock += item.qty
      product.save()
    })
  }

  req.user.cartItems = []
  await req.user.save()
  res.status(200).json({
    success: true,
    cartItems: req.user.cartItems,
  })
})
