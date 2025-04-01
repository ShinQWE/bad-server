import { Router } from 'express'
import {
  createOrder,
  deleteOrder,
  getOrderByNumber,
  getOrderCurrentUserByNumber,
  getOrders,
  getOrdersCurrentUser,
  updateOrder,
} from '../controllers/order'
import { roleGuardMiddleware } from '../middlewares/auth'
import { validateOrderBody, validateObjId } from '../middlewares/validations'
import { Role } from '../models/user'

const orderRouter = Router()

// 📦 Клиент создаёт заказ
orderRouter.post('/', validateOrderBody, createOrder)

// 📄 Админ получает список всех заказов
orderRouter.get('/all', roleGuardMiddleware(Role.Admin), getOrders)

// 📄 Пользователь получает свои заказы
orderRouter.get('/all/me', getOrdersCurrentUser)

// 🔍 Админ получает заказ по номеру
orderRouter.get('/:orderNumber', roleGuardMiddleware(Role.Admin), getOrderByNumber)

// 🔍 Пользователь получает свой заказ по номеру
orderRouter.get('/me/:orderNumber', getOrderCurrentUserByNumber)

// ✏️ Админ обновляет заказ
orderRouter.patch('/:orderNumber', roleGuardMiddleware(Role.Admin), updateOrder)

// ❌ Админ удаляет заказ по ID
orderRouter.delete('/:id', roleGuardMiddleware(Role.Admin), validateObjId, deleteOrder)

export default orderRouter