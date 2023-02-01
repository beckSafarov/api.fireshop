import asyncHandler from 'express-async-handler'
import dayjs from 'dayjs'

export const checkForValues = (values = [], res, statusCode) => {
  values.forEach((value) => {
    if (value === undefined) {
      res.status(statusCode)
      throw new Error(`Insufficient details`)
    }
  })
}

export const isAvailable = asyncHandler(async (Product, _id, qty) => {
  const product = await Product.findById(_id)
  let error = null
  if (!product) {
    error = `No order was found with the id of ${_id}`
  } else if (product.countInStock < qty) {
    error = `Not enough products in stock. In stock: ${product.countInStock}, you require: ${qty}`
  }

  return { error, product }
})

// receives: [{_id: x, qty: y ...]
export const joinDuplicateObjects = (arr) => {
  let a = arr.slice().sort()
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i + 1]._id === a[i]._id) {
      a[i + 1].qty += a[i].qty
      a.splice(i, 1)
    }
  }

  return a
}

export const formatDate = (date) => {
  if (!date) return 'undefined'
  const year = date.getFullYear()
  let month = date.getMonth() + 1
  month = month < 10 ? `0${month}` : month
  const day = date.getDate()
  const hour = date.getHours()
  const minutes = date.getMinutes()
  return `${year} - ${month} - ${day}, ${hour}:${minutes}`
}

export const addDateFormats = (order) => {
  const UTCDate = order.deliveredAt.toUTCString()
  const ISODate = `${order.deliveredAt.getFullYear()}-${order.deliveredAt.getMonth()}-${order.deliveredAt.getDate()}`
  return { ...order._doc, UTCDate, ISODate }
}

export const clearObjectProp = (obj, toRemove) => {
  const out = {}
  Object.keys(obj).forEach((prop) => {
    if (prop !== toRemove) out[prop] = obj[prop]
  })
  return out
}

const capitalize = (w) => w.replace(w.charAt(0), w.charAt(0).toUpperCase())

export const orderQueryHandler = (query) => {
  const filter = {}
  const {
    filter: filterQuery,
    sort: sortQuery,
    orderItems,
    shippingAddress,
    ordered,
    delivered,
    price,
    isDelivered,
    deliveryStatus,
  } = query
  if (filterQuery) {
    switch (filterQuery) {
      case 'orderItems':
        // orderedItems = iphone,echo,
        filter['orderItems.name'] = { $regex: orderItems, $options: 'i' }
        break
      case 'shippingAddress':
        // shippingAddress = city,tashkent
        const addressParam = shippingAddress.split('.')[0]
        const keyword = shippingAddress.split('.')[1]
        filter[`shippingAddress.${addressParam}`] = {
          $regex: keyword,
          $options: 'i',
        }
        break
      case 'ordered':
      case 'delivered':
        // ordered=day||week||month
        const ago = dayjs().subtract(1, ordered || delivered)
        filter[ordered ? 'paidAt' : 'deliveredAt'] = {
          $gte: ago.toISOString(),
          $lt: new Date().toISOString(),
        }
        break
      case 'price':
        // filter=price&gt=10&lte=100
        filter.totalPrice = {}
        Object.keys(query).forEach((p) => {
          if ('gt|lt|gte|lte|eq'.includes(p)) {
            filter.totalPrice[`$${p}`] = query[p]
          }
        })
        break
      case 'isDelivered':
        filter.isDelivered = query.isDelivered
        break
      case 'deliveryStatus':
        filter.deliveryStatus = capitalize(query.deliveryStatus)
        break
    }
  }

  const sort = sortQuery ? clearObjectProp(query, 'sort') : {}

  return { filter, sort }
}
