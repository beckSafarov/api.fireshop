import asyncHandler from 'express-async-handler'
import User from '../models/userModel.js'
import mongoose from 'mongoose'

//@desc  Get all current users
//@route GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { field, secondaryField, keyword } = req.query
  const query = {}

  if (field && keyword) {
    const queryConfig = { $regex: keyword, $options: 'i' }
    if (field === 'address' && secondaryField) {
      const property = `shippingAddress.${secondaryField}`
      query[property] = queryConfig
    } else {
      field !== '_id'
        ? (query[field] = queryConfig)
        : (query._id = mongoose.Types.ObjectId(keyword))
    }
  }

  const users = await User.find({ ...query })
  if (!users || users.length === 0) {
    if (field && keyword) {
      res.status(400)
      throw new Error(`No results found for ${keyword}`)
    } else {
      throw new Error(`Could not retrieve users`)
    }
  }

  res.status(200).json(users)
})

//@desc  Get one user
//@route GET /api/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    res.status(200).json({ user })
  } else {
    res.status(404)
    throw new Error('No user found with such id')
  }
})

//@desc  Update one user
//@route PUT /api/admin/users/:id
export const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    res.status(404)
    throw new Error('No such user found!')
  }
  res.status(200).json({ user })
})

//@desc  delete a user
//@route DELETE /api/admin/users/:id
export const removeUser = asyncHandler(async (req, res) => {
  const id = req.params.id

  const deletedUser = await User.findByIdAndDelete(id)
  if (!deletedUser) {
    res.status(404)
    throw new Error('No such user found')
  }

  res.status(200).json({
    success: true,
    message: `${deletedUser.name} has been deleted`,
  })
})
