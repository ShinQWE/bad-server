import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'

// TODO: Добавить guard admin
// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortField = 'createdAt',
            sortOrder = 'desc',
            registrationDateFrom,
            registrationDateTo,
            lastOrderDateFrom,
            lastOrderDateTo,
            totalAmountFrom,
            totalAmountTo,
            orderCountFrom,
            orderCountTo,
            search,
        } = req.query

        const filters: FilterQuery<Partial<IUser>> = {}

        if (registrationDateFrom) {
            filters.createdAt = {
                ...filters.createdAt,
                $gte: new Date(registrationDateFrom as string),
            }
        }

        if (registrationDateTo) {
            const endOfDay = new Date(registrationDateTo as string)
            endOfDay.setHours(23, 59, 59, 999)
            filters.createdAt = {
                ...filters.createdAt,
                $lte: endOfDay,
            }
        }

        if (lastOrderDateFrom) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $gte: new Date(lastOrderDateFrom as string),
            }
        }

        if (lastOrderDateTo) {
            const endOfDay = new Date(lastOrderDateTo as string)
            endOfDay.setHours(23, 59, 59, 999)
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $lte: endOfDay,
            }
        }

        if (totalAmountFrom) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: Number(totalAmountFrom),
            }
        }

        if (totalAmountTo) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: Number(totalAmountTo),
            }
        }

        if (orderCountFrom) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: Number(orderCountFrom),
            }
        }

        if (orderCountTo) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: Number(orderCountTo),
            }
        }
        // Проверка, существует ли переменная search и является ли она строкой с длиной менее 100 символов
        if (search && typeof search === 'string' && search.length < 100) {
            const searchRegex = new RegExp(search as string, 'i')
            // Ищем заказы, в которых поле deliveryAddress соответствует регулярному выражению
            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'  // Ограничиваем возвращаемые поля только ID заказа
            )

            const orderIds = orders.map((order) => order._id)

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ]
        }

        const sort: { [key: string]: any } = {}

        if (sortField && sortOrder) {
            sort[sortField as string] = sortOrder === 'desc' ? -1 : 1
        }
        const limits = Math.min(Number(limit), 10) // лимит
        const options = {
            sort,
            skip: (Number(page) - 1) * limits,
            limit: limits,
        }
        // Ищем пользователей с заданными фильтрами, опциями и заполняем связанные поля
        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: {
                    path: 'products',
                },
            },
            {
                path: 'lastOrder',
                populate: {
                    path: 'customer',
                },
            },
        ])
         // Подсчитываем общее количество пользователей, соответствующих фильтрам
        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limits)

        // Отправляем ответ с данными пользователей и информацией о пагинации
        res.status(200).json({
        customers: users.map((user) => ({
            _id: user._id, // ID пользователя
            name: user.name, // Имя пользователя
            email: user.email, // Email пользователя
            roles: user.roles, // Роли пользователя
            totalAmount: user.totalAmount, // Общая сумма заказов пользователя
            orderCount: user.orderCount, // Количество заказов пользователя
            lastOrderDate: user.lastOrderDate, // Дата последнего заказа
            orders: user.orders, // Заказы пользователя
            lastOrder: user.lastOrder, // Последний заказ пользователя
        })),
            pagination: {
                totalUsers,
                totalPages,
                currentPage: Number(page),
                pageSize: limits,
            },
        })
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Извлекаем ID клиента из параметров запроса и проверяем его тип
        const id = typeof req.params.id === 'string' ? req.params.id : ''
        // Находим пользователя по ID и заполняем связанные поля orders и lastOrder
        const user = await User.findById(id).populate([
            'orders',
            'lastOrder',
        ])
        res.status(200).json({
            _id: user?._id,
            name: user?.name,
            email: user?.email,
            roles: user?.roles,
            orders: user?.orders,
            lastOrder: user?.lastOrder,
        })
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Извлекаем данные из тела запроса и проверяем их тип
    const name = typeof req.body.name === 'string' ? req.body.name : undefined
    const roles = Array.isArray(req.body.roles) ? req.body.roles : undefined
    const email = typeof req.body.email === 'string' ? req.body.email : undefined
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : ''
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name, email, roles },
            { new: true, runValidators: true }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
            res.status(200).json({
                _id: updatedUser ._id, // ID обновленного пользователя
                name: updatedUser .name, // Имя обновленного пользователя
                email: updatedUser .email, // Email обновленного пользователя
                roles: updatedUser .roles, // Роли обновленного пользователя
                orders: updatedUser .orders, // Заказы обновленного пользователя
                lastOrder: updatedUser .lastOrder, // Последний заказ обновленного пользователя
            });
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : ''
        const deletedUser = await User.findByIdAndDelete(id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json({
            _id: deletedUser ._id, // ID удаленного пользователя
            email: deletedUser .email, // Email удаленного пользователя
            name: deletedUser .name, // Имя удаленного пользователя
            roles: deletedUser .roles, // Роли удаленного пользователя
        });
    } catch (error) {
        next(error)
    }
}
