import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'

// GET /customers
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

        if (search && typeof search === 'string' && search.length < 100) {
            const searchRegex = new RegExp(search, 'i')
            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'
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

        const safeLimit = Math.min(Number(limit), 10)
        const options = {
            sort,
            skip: (Number(page) - 1) * safeLimit,
            limit: safeLimit,
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: ['products', 'customer'],
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / safeLimit)

        res.status(200).json({
            customers: users.map((u) => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                roles: u.roles,
                totalAmount: u.totalAmount,
                orderCount: u.orderCount,
                lastOrderDate: u.lastOrderDate,
                orders: u.orders,
                lastOrder: u.lastOrder,
            })),
            pagination: {
                totalUsers,
                totalPages,
                currentPage: Number(page),
                pageSize: safeLimit,
            },
        })
    } catch (error) {
        next(error)
    }
}

// GET /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : ''
        const user = await User.findById(id).populate(['orders', 'lastOrder'])
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

// PATCH /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const name = typeof req.body.name === 'string' ? req.body.name : undefined
    const email = typeof req.body.email === 'string' ? req.body.email : undefined
    const roles = Array.isArray(req.body.roles) ? req.body.roles : undefined

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
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            roles: updatedUser.roles,
            orders: updatedUser.orders,
            lastOrder: updatedUser.lastOrder,
        })
    } catch (error) {
        next(error)
    }
}

// DELETE /customers/:id
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
            _id: deletedUser._id,
            email: deletedUser.email,
            name: deletedUser.name,
            roles: deletedUser.roles,
        })
    } catch (error) {
        next(error)
    }
}