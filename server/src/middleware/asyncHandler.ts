import type { NextFunction, Request, RequestHandler, Response } from 'express'

/** Express guarantees a matched `:name` segment is present; this just satisfies noUncheckedIndexedAccess. */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name]
  if (!value) throw new HttpError(400, `Missing route parameter: ${name}`)
  return value
}

/** Wraps an async route handler so a rejected promise reaches Express's error middleware. */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}
