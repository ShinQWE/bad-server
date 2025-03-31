import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import crypto from 'crypto';
import fs from 'fs';
import { extname, join } from 'path'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void
// Определяем путь для загрузки файлов
    const upLoad = join(
        __dirname,
        process.env.UPLOAD_PATH_TEMP
        ? `../public/${process.env.UPLOAD_PATH_TEMP}`
        : '../public'
    )

// Создаем директорию для загрузки, если она не существует
    fs.mkdirSync(upLoad, { recursive: true })
// Настраиваем хранилище multer
    const storage = multer.diskStorage({
        destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
        ) => {
        cb(null, upLoad)
        },
    
        filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
        ) => {
        const ext = extname(file.originalname).toLowerCase().slice(0, 10)
        const safeName = crypto.randomBytes(16).toString('hex') + ext
        cb(null, safeName)
        },
    })

// Определяем допустимые типы файлов
const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    return cb(null, true)
}

// Экспортируем конфигурацию multer
export default multer({ storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, 
    },
})
