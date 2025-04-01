import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Model, Types } from 'mongoose'
import { ACCESS_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'
import NotFoundError from '../errors/not-found-error'
import UnauthorizedError from '../errors/unauthorized-error'
import BadRequestError from '../errors/bad-request-error'

import UserModel, { Role } from '../models/user'

const auth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Необходима авторизация'))
    }

    const accessToken = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(accessToken, ACCESS_TOKEN.secret) as JwtPayload

        // Проверка типа payload.sub
        if (typeof payload.sub !== 'string') {
            return next(new UnauthorizedError('Невалидный токен'))
        }

        const user = await UserModel.findById(payload.sub, {
            password: 0,
            salt: 0,
        })

        if (!user) {
            return next(new ForbiddenError('Нет доступа'))
        }

        res.locals.user = user
        return next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return next(new UnauthorizedError('Истек срок действия токена'))
        }
        return next(new UnauthorizedError('Невалидный токен'))
    }
}

export function roleGuardMiddleware(...roles: Role[]) {
    return (_req: Request, res: Response, next: NextFunction) => {
        const {user} = res.locals

        if (!user) {
            return next(new UnauthorizedError('Необходима авторизация'))
        }

        const hasAccess = roles.some((role) => user.roles.includes(role))

        if (!hasAccess) {
            return next(new ForbiddenError('Доступ запрещен'))
        }

        return next()
    }
}

export function currentUserAccessMiddleware<T>(
    model: Model<T>,
    idProperty: string,
    userProperty: keyof T
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[idProperty]
        const {user} = res.locals

        if (!user) {
            return next(new UnauthorizedError('Необходима авторизация'))
        }

        if (!id || typeof id !== 'string') {
            return next(new BadRequestError('Некорректный ID'))
        }

        if (user.roles.includes(Role.Admin)) {
            return next()
        }

        const entity = await model.findById(id)
        if (!entity) {
            return next(new NotFoundError('Не найдено'))
        }

        const ownerId = entity[userProperty] as Types.ObjectId
        const hasAccess = new Types.ObjectId(user.id).equals(ownerId)

        if (!hasAccess) {
            return next(new ForbiddenError('Доступ запрещен'))
        }

        return next()
    }
}

export default auth