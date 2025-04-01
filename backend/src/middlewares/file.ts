import { Request, Express } from 'express'
import fs from 'fs'
import multer, { FileFilterCallback } from 'multer'
import { extname, join } from 'path'
import crypto from 'crypto'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const uploadDir = join(
  __dirname,
  process.env.UPLOAD_PATH_TEMP
    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
    : '../public'
)

fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: DestinationCallback
  ) => {
    cb(null, uploadDir)
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

const allowedTypes = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'application/octet-stream',
]

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  console.log('📎 mime:', file.mimetype)
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(null, false)
  }
  return cb(null, true)
}

export default multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
})