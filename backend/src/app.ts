import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

// 🛡️ Безопасность заголовков
app.use(helmet())

app.set('trust proxy', true)

// 🍪 Парсинг cookie
app.use(cookieParser())

// 🌍 Разрешить CORS (можно ограничить origin в проде)
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }))
  
// app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }))

// 🚫 Ограничение размера тела запроса
app.use(urlencoded({ extended: true, limit: '10kb' }))
app.use(json({ limit: '10kb' }))

// 📦 Ограничение количества запросов с одного IP
app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 20, // ❗️уменьши для теста
      message: 'Слишком много запросов с этого IP, попробуйте позже',
      standardHeaders: true,
      legacyHeaders: false,
    })
  )

// 🖼️ Статика и защита от Path Traversal
app.use(serveStatic(path.join(__dirname, 'public')))

// 🔀 Основной роутинг
app.options('*', cors())
app.use(routes)

// 🧩 Обработка ошибок celebrate и общая
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log(`✅ Сервер запущен на порту ${PORT}`))
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error)
    }
}

bootstrap()