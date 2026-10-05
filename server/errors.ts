export class ApiError extends Error {
  constructor(public status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 503, message: string) { super(message) }
}
export function check(value: unknown, message: string, status: ApiError['status'] = 409): asserts value {
  if (!value) throw new ApiError(status, message)
}

