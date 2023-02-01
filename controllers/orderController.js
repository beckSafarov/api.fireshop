import asyncHandler from 'express-async-handler'
import { orderQueryHandler } from '../helpers/helpers.js'
import Order from '../models/orderModel.js'
import User from '../models/userModel.js'
import mongoose from 'mongoose'

//@desc  Create new order
//@route post /api/orders/addorder
//@desc  Private, need authorization
export const addOrderItems = asyncHandler(async (req, res) => {
  const {
    paymentMethod,
    paymentResult,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt,
  } = req.body

  if (req.user.cartItems.length === 0 || !paymentResult || !paymentMethod) {
    res.status(400)
    throw new Error('Insufficient data')
  }

  const order = new Order({
    orderItems: req.user.cartItems,
    user: req.user._id,
    shippingAddress: req.user.shippingAddress,
    paymentMethod,
    paymentResult,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: true,
    paidAt,
  })

  // adding the items as purchased items to the user
  req.user.cartItems.forEach((i) =>
    req.user.purchased.push({ _id: i._id, date: paidAt })
  )

  // removing the purchased item from the cart of the user
  req.user.cartItems = []
  await req.user.save()

  const createdOrder = await order.save()

  res.status(200).json({ createdOrder })
})

//@desc  Get order
//@route GET /api/orders/:id
//@desc  Public
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  )

  if (!order) {
    res.status(404)
    throw new Error('Order not found with the provided id')
  }

  res.status(200).json({ order })
})

//@desc  Update order delivery status
//@route PUT /api/orders/:id
//@desc  Private && Admin only
export const updateOrderDeliveryStatus = asyncHandler(async (req, res) => {
  const deliveryStatus = req.body.deliveryStatus || 'Received'
  const isDelivered = deliveryStatus === 'Delivered'

  const deliveredAt = isDelivered ? new Date() : undefined
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { deliveryStatus, isDelivered, deliveredAt },
    {
      new: true,
      runValidators: true,
    }
  )

  if (isDelivered) {
    const user = await User.findById(order.user)
    user.purchased.forEach((i) => {
      if (order.paidAt) {
        if (i.date.toString() === order.paidAt.toString()) {
          i.isDelivered = true
        }
      } else {
        i.isDelivered = true
        i.paidAt = i.date
      }
    })
    await user.save()
  }

  if (!order) {
    res.status(404)
    throw new Error('Order not found with the provided id')
  }

  res.status(200).json({ order })
})

//@desc  Get all orders for admin
//@route GET /api/orders
//@desc  Private && Admin only
export const getAllOrders = asyncHandler(async (req, res) => {
  const { filter, sort } = orderQueryHandler(req.query)
  if (req.query.user) {
    const user = await User.find({
      name: {
        $regex: req.query.user,
        $options: 'i',
      },
    })
    filter.user = user[0]._id
  }

  // console.log({ ...sort })
  console.log(req.query)

  const orders = await Order.find({ ...filter })
    .sort({ ...sort })
    .populate('user', 'id name')
  res.status(200).json({ orders })
})

//@desc  Get all orders for a user
//@route GET /api/orders/myorders
//@desc  Private, need authorization
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })

  res.status(200).json({ orders })
})

//@desc  Add order to purchased items
//@route POST /api/orders/movetopurchased
//@desc  Private && Admin only
export const ordersToPurchased = asyncHandler(async (req, res) => {
  const allOrders = await Order.find({ isDelivered: false })

  try {
    allOrders.forEach(async (order) => {
      const user = await User.findById(order.user)
      if (!user.purchased) user.purchased = []
      order.orderItems.forEach((item) => {
        user.purchased.push({
          _id: item._id,
          date: order.paidAt,
        })
      })
      user.save()
    })

    res.status(200).json({
      success: true,
      message: 'check out the compass, purchased items should have been added',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    })
  }
})
