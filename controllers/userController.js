import asyncHandler from 'express-async-handler'
import User from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import { sendToken } from '../utils/sendToken.js'
import jwt from 'jsonwebtoken'

//@desc  Get one user
//@route GET /api/users/profile
//@desc  Private
export const getOneUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.status(200).json({ success: true, data: user })
})

//@desc  update user details
//@route PUT /api/users/profile
//@desc  Private
export const updateUser = asyncHandler(async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 10)
  }

  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, data: user })
})

//@desc  Sign in
//@route POST /api/users
//@desc  Public
export const signUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) throw new Error('Insufficient details')

  if (await User.findOne({ email })) {
    res.status(400)
    throw new Error('User already exists')
  }

  const newUser = await User.create(req.body)
  sendToken(newUser.id, res, newUser)
})

//@desc  Auth user & get token
//@route POST /api/users/login
//@desc  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) throw new Error(`Insufficient credentials`)

  const user = await User.findOne({ email }).select('+password')

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401)
    throw new Error(`Invalid credentials`)
  }

  user.password = undefined
  sendToken(user.id, res, user)
})

//@desc  currently logged in user
//@route GET /api/users/me
//@desc  Private
export const me = asyncHandler(async (req, res, next) => {
  if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      res.status(200).json({ success: true, user })
    } catch (err) {
      err.success = false
      res.status(404).json(err)
    }
  } else {
    res.status(200).json({ success: false, message: 'Not logged' })
  }
})

//@desc  user logs out
//@route PUT /api/users/logout
//@desc  Private
export const logout = asyncHandler(async (req, res, next) => {
  res.clearCookie('token')
  res.status(200).json({
    success: true,
    message: 'Your are successfully logged out',
  })
})

//@desc  create a shipping address for the logged user
//@route POST /api/users/shippingaddress
//@desc  Private
export const createShippingAddress = asyncHandler(async (req, res) => {
  const { address, city, postalCode, country } = req.body

  if (!address || !city || !postalCode || !country) {
    res.status(404)
    throw new Error('Insufficient details!')
  }

  const user = req.user
  req.user.shippingAddress = req.body
  user.save()
  res.status(200).json({
    success: true,
    shippingAddress: user.shippingAddress,
  })
})

//@desc  update shipping address
//@route PUT /api/users/shippingaddress
//@desc  Private
export const updateShippingAddress = asyncHandler(async (req, res) => {
  const { address, city, postalCode, country } = req.body

  if (!address || !city || !postalCode || !country) {
    res.status(404)
    throw new Error('Insufficient details!')
  }

  req.user.shippingAddress = req.body
  await req.user.save()

  res
    .status(200)
    .json({ success: true, shippingAddress: req.user.shippingAddress })
})
