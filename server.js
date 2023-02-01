import path from 'path'
import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
import productRoutes from './routes/productRoutes.js'
import userRoutes from './routes/userRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import morgan from 'morgan'
const nodeEnv = process.env.NODE_ENV
//function declarations
dotenv.config()
connectDB()
const app = express()
nodeEnv === 'development' && app.use(morgan('dev'))
app.use(express.json())

//routes

const __dirname = path.resolve()
app.use('/api/uploads', express.static(path.join(__dirname, '/uploads')))

app.use(cookieParser())
app.use('/api/products', productRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/users/cartItems', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/config/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID)
})

app.get('/', (req, res) => res.send('API is running'))

app.use(notFound)
app.use(errorHandler)

//starting server
const PORT = process.env.PORT || 5000
const server = app.listen(
  PORT,
  console.log(`Server running in ${nodeEnv} mode on port ${PORT}`)
)

//handle unhandled rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('unhandledRejection: ', err.message)
  server.close()
})

//handling crashes
process.on('uncaughtException', (err, promise) => {
  console.error('Stupid Error that happens when the address is being used')
  app.removeAllListeners()
  process.exit(1)
})

//killing server
process.on('SIGTERM', (err, promise) => {
  console.error('SIGTERM', err.message)
  server.close()
})

process.on('error', (err, promise) => {
  console.error('random error: ', err.message)
  server.close()
})
