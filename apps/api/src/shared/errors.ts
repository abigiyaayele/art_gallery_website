/**
 * Errors the application layer throws. The HTTP error handler maps each to a
 * status code and the shared { error: { code, message, details } } shape.
 */
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('validation_failed', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Sign in to continue') {
    super('unauthorized', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do that') {
    super('forbidden', message, 403);
  }
}

/** Also used for other tenants' records, so their existence is never revealed. */
export class NotFoundError extends AppError {
  constructor(what = 'Resource') {
    super('not_found', `${what} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('conflict', message, 409);
  }
}

/** A business rule was broken, e.g. publishing an artwork without a price. */
export class DomainError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 422, details);
  }
}

export class LimitExceededError extends AppError {
  constructor(message: string) {
    super('limit_exceeded', message, 429);
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, details?: unknown) {
    super('upstream_failed', message, 502, details);
  }
}
