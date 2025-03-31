import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Model, Types } from 'mongoose'
import { ACCESS_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'
import NotFoundError from '../errors/not-found-error'
import UnauthorizedError from '../errors/unauthorized-error'
import UserModel, { Role } from '../models/user'

// есть файл middlewares/auth.js, в нём мидлвэр для проверки JWT;

const auth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Невалидный токен')
    }
    const accessTokenParts = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(accessTokenParts, ACCESS_TOKEN.secret) as JwtPayload
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
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Истек срок действия токена'))
        }
        return next(new UnauthorizedError('Необходима авторизация'))
    }
}

// Экспортируем функцию middleware для проверки ролей пользователей
export function roleGuardMiddleware(...roles: Role[]) {
    // Возвращаем функцию middleware, которая принимает req, res и next
    return (_req: Request, res: Response, next: NextFunction) => {
        // Извлекаем пользователя из локальных данных ответа
        const { user } = res.locals;

        // Проверяем, авторизован ли пользователь
        if (!user) {
            // Если пользователь не авторизован, вызываем ошибку UnauthorizedError
            return next(new UnauthorizedError('Необходима авторизация'));
        }

        // Проверяем, имеет ли пользователь доступ, сравнивая его роли с разрешенными
        const hasAccess = roles.some((role) =>
            user.roles.includes(role) // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
        );

        // Если доступ не предоставлен, вызываем ошибку ForbiddenError
        if (!hasAccess) {
            return next(new ForbiddenError('Доступ запрещен'));
        }

        // Если доступ предоставлен, продолжаем выполнение следующего middleware
        return next();
    }
}

// Экспортируем функцию middleware для проверки доступа текущего пользователя к сущности
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

        if (user.roles.includes(Role.Admin)) {
            return next()
        }

        const entity = await model.findById(id)

        if (!entity) {
            return next(new NotFoundError('Не найдено'))
        }

        const userEntityId = entity[userProperty] as Types.ObjectId
        const hasAccess = new Types.ObjectId(user.id).equals(
            userEntityId
        )

        if (!hasAccess) {
            return next(new ForbiddenError('Доступ запрещен'))
        }

        return next()
    }
}

export default auth
