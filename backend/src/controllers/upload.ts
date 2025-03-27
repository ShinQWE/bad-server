import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

import { sanitize } from '../utils/tAz';

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    try {
        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`

        // Санитизируем имя оригинального файла
        const originalName = sanitize(req.file.originalname || '')

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
