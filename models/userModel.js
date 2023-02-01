import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
mongoose.set('useFindAndModify', false)
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    shippingAddress: {
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    purchased: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        isDelivered: {
          type: Boolean,
          default: false,
        },
        date: {
          type: Date,
          required: true,
        },
      },
    ],
    cartItems: [
      {
        _id: String,
        name: String,
        image: String,
        price: String,
        countInStock: Number,
        qty: Number,
      },
    ],
  },
  {
    timeStamps: true,
  }
)

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    next()
  }

  //encrypt password
  this.password = bcrypt.hashSync(this.password, 10)
  next()
})

userSchema.methods.addCartItem = function (item) {
  let done = false
  let a = this.cartItems
  for (let curr of a) {
    if (curr._id == item._id) {
      curr.qty += item.qty
      done = true
      break
    }
  }

  done ? (this.cartItems = a) : this.cartItems.push(item)

  return {
    cartItems: this.cartItems,
    more: done ? 'more' : '',
  }
}

userSchema.methods.removeCartItem = function (passed) {
  this.cartItems = this.cartItems.filter((current) => current._id !== passed)
}

userSchema.methods.updateCartItemQty = function (id, newQty) {
  this.cartItems.forEach((current) => {
    if (current._id === id) {
      current.qty = newQty
    }
  })

  return this.cartItems
}

const User = mongoose.model('User', userSchema)
export default User
