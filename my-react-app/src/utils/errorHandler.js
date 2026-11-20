export function toSupabaseError(error, fallbackMessage = 'Khong the hoan thanh yeu cau.') {
  if (!error) {
    return { message: fallbackMessage }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  return {
    message: error.message || fallbackMessage,
    code: error.code,
    status: error.status,
  }
}
