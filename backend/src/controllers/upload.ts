import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

// POST /upload
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new BadRequestError('Файл не загружен'))
  }

  // 🔒 Минимальный размер — 2 КБ
  if (req.file.size < 2 * 1024) {
    return next(new BadRequestError('Размер файла должен быть больше 2KB'))
  }

  try {
    const fileName = process.env.UPLOAD_PATH_TEMP
      ? `/${process.env.UPLOAD_PATH_TEMP}/${req.file.filename}`
      : `/${req.file.filename}`

    return res.status(constants.HTTP_STATUS_CREATED).send({ fileName })
  } catch (error) {
    return next(error)
  }
}