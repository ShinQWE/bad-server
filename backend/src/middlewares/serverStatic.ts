import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Декодируем путь и удаляем любые нулевые символы
        const fl = decodeURIComponent(req.path.replace(/\0/, ''));
        // Проверяем наличие '..' в пути, чтобы предотвратить выход за пределы базовой директории
        if (fl.includes('..')) {
            return res.status(403).send({ message: 'не получается выполнить вход' })
        }
        // Резолвим путь к файлу относительно базовой директории
        const resolved = path.resolve(baseDir, `.${fl}`);
        // Проверяем, что резолвленный путь находится внутри базовой директории
        if (!resolved.startsWith(path.resolve(baseDir))) {
            return res.status(403).send({ message: 'не получается выполнить вход' })
        }

        // Проверяем, существует ли файл
        fs.access(fl, fs.constants.F_OK, (err) => {
            if (err) {
                // Файл не существует отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            // eslint-disable-next-line @typescript-eslint/no-shadow
            return res.sendFile(resolved, (err) => {
                if (err) {
                    next(err)
                }
            })
        })
    }
}
