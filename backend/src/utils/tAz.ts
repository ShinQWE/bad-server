import sanitizeHtml from 'sanitize-html';

  /*
    * для очистки HTML-кода
  */
export const sanitize = (str: string): string =>
  sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });
  /*
    * обработать весь объект
  */
export function sanitizeObject<T extends Record<string, unknown>>(input: T): T {
  const sanitized = { ...input };

  Object.entries(sanitized).forEach(([key, value]) => {
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitize(value);
    }
  });

  return sanitized as T;
}
