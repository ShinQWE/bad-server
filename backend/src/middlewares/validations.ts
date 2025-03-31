import { Joi, celebrate } from 'celebrate';
import { Types } from 'mongoose';

// 🛡️ Регулярное выражение для телефона
export const phoneRegExp = /^[\d\s()+-]{6,30}$/;

// Перечисление типов платежей
export enum PaymentType {
  Card = 'card',
  Online = 'online',
}

// Общая функция для создания сообщений об ошибках
const createErrorMessages = (field: string) => ({
  'string.empty': `${field} обязательно`,
});

// Общий валидатор ObjectId
const objectIdValidator = Joi.string().custom((value, helpers) => {
  if (Types.ObjectId.isValid(value)) return value;
  return helpers.message({ custom: 'Невалидный id' });
});

// Валидация ID в параметрах
export const validateObjId = celebrate({
  params: Joi.object().keys({
    productId: objectIdValidator.required(),
  }),
});

// Валидация тела заказа
export const validateOrderBody = celebrate({
  body: Joi.object().keys({
    items: Joi.array()
      .items(objectIdValidator)
      .min(1)
      .required()
      .messages({
        'array.base': 'Поле items должно быть массивом',
        'array.empty': 'Не указаны товары',
        'array.min': 'Минимум 1 товар должен быть выбран',
      }),

    payment: Joi.string()
      .valid(...Object.values(PaymentType))
      .required()
      .messages({
        'any.only': 'Тип оплаты должен быть "card" или "online"',
        ...createErrorMessages('Способ оплаты'),
      }),

    email: Joi.string()
      .email()
      .required()
      .max(100)
      .messages({
        ...createErrorMessages('Email'),
        'string.email': 'Email должен быть валидным',
      }),

    phone: Joi.string()
      .required()
      .pattern(phoneRegExp)
      .max(30)
      .messages({
        ...createErrorMessages('Телефон'),
        'string.pattern.base': 'Неверный формат телефона',
      }),

    address: Joi.string()
      .required()
      .min(5)
      .max(200)
      .messages({
        ...createErrorMessages('Адрес'),
        'string.min': 'Адрес слишком короткий (минимум 5 символов)',
      }),

    total: Joi.number()
      .required()
      .positive()
      .messages({
        'number.base': 'Сумма заказа должна быть числом',
        'number.positive': 'Сумма заказа должна быть положительной',
      }),

    comment: Joi.string().allow('').max(1000),
  }),
});

// Валидация создания товара
export const validateProductBody = celebrate({
  body: Joi.object().keys({
    title: Joi.string()
      .required()
      .min(2)
      .max(100)
      .messages(createErrorMessages('Поле "title"')),

    image: Joi.object().keys({
      fileName: Joi.string().required(),
      originalName: Joi.string().required().max(100),
    }),

    category: Joi.string().required().messages(createErrorMessages('Поле "category"')),

    description: Joi.string()
      .required()
      .min(5)
      .max(1000)
      .messages(createErrorMessages('Поле "description"')),

    price: Joi.number().allow(null),
  }),
});

// Валидация обновления товара
export const validateProductUpdateBody = celebrate({
  body: Joi.object().keys({
    title: Joi.string().min(2).max(100),
    image: Joi.object().keys({
      fileName: Joi.string().required(),
      originalName: Joi.string().required().max(100),
    }),
    category: Joi.string(),
    description: Joi.string().min(5).max(1000),
    price: Joi.number().allow(null),
  }),
});

// Валидация регистрации пользователя
export const validateUserBody = celebrate({
    body: Joi.object().keys({
      name: Joi.string()
        .min(2)
        .max(30)
        .messages(createErrorMessages('Имя')),
  
      password: Joi.string()
        .min(6)
        .required()
        .messages(createErrorMessages('Пароль')),
  
      email: Joi.string()
        .required()
        .email()
        .max(100)
        .messages({
          ...createErrorMessages('Email'),
          'string.email': 'Email должен быть валидным',
        }),
    }),
  });
  
  // Валидация входа
  export const validateAuthentication = celebrate({
    body: Joi.object().keys({
      email: Joi.string()
        .required()
        .email()
        .max(100)
        .messages({
          ...createErrorMessages('Email'),
          'string.email': 'Email должен быть валидным',
        }),
  
      password: Joi.string()
        .required()
        .messages(createErrorMessages('Пароль')),
    }),
  });

