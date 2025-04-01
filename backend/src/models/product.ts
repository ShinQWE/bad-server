import { unlink } from 'fs'
import mongoose, { Document } from 'mongoose'
import { join, basename } from 'path'

export interface IFile {
    fileName: string
    originalName: string
}

export interface IProduct extends Document {
    title: string
    image: IFile
    category: string
    description: string
    price: number
}

const cardsSchema = new mongoose.Schema<IProduct>(
    {
        title: {
            type: String,
            unique: true,
            required: [true, 'Поле "title" должно быть заполнено'],
            minlength: [2, 'Минимальная длина поля "title" - 2'],
            maxlength: [30, 'Максимальная длина поля "title" - 30'],
        },
        image: {
            fileName: {
                type: String,
                required: [true, 'Поле "image.fileName" должно быть заполнено'],
            },
            originalName: String,
        },
        category: {
            type: String,
            required: [true, 'Поле "category" должно быть заполнено'],
        },
        description: {
            type: String,
            maxlength: [1000, 'Максимальная длина поля "description" - 1000'],
        },
        price: {
            type: Number,
            default: null,
        },
    },
    { versionKey: false }
)

cardsSchema.index({ title: 'text' })

cardsSchema.pre('findOneAndUpdate', async function deleteOldImage() {
    // @ts-ignore
    const updateImage = this.getUpdate().$set?.image
    const docToUpdate = await this.model.findOne(this.getQuery())

    if (updateImage && docToUpdate) {
        const safeFileName = basename(docToUpdate.image.fileName)
        const filePath = join(__dirname, `../public/${safeFileName}`)

        unlink(filePath, (err) => {
            if (err) console.error('Ошибка удаления старого файла:', err.message)
        })
    }
})

cardsSchema.post('findOneAndDelete', async (doc: IProduct) => {
    if (!doc || !doc.image?.fileName) return

    const safeFileName = basename(doc.image.fileName)
    const filePath = join(__dirname, `../public/${safeFileName}`)

    unlink(filePath, (err) => {
        if (err) console.error('Ошибка удаления файла:', err.message)
    })
})

export default mongoose.model<IProduct>('product', cardsSchema)