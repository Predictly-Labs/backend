/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_FAILED', false);
  }
}

export class InvalidSignatureError extends AppError {
  constructor(message: string = 'Invalid signature') {
    super(message, 401, 'AUTH_INVALID_SIGNATURE', false);
  }
}

export class ExpiredNonceError extends AppError {
  constructor(message: string = 'Nonce has expired or been used') {
    super(message, 401, 'AUTH_EXPIRED_NONCE', false);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 401, 'AUTH_INVALID_TOKEN', false);
  }
}

// Market Errors
export class MarketNotFoundError extends AppError {
  constructor(message: string = 'Market not found') {
    super(message, 404, 'MARKET_NOT_FOUND', false);
  }
}

export class MarketAlreadyInitializedError extends AppError {
  constructor(message: string = 'Market is already initialized') {
    super(message, 409, 'MARKET_ALREADY_INITIALIZED', false);
  }
}

export class MarketInitializationFailedError extends AppError {
  constructor(message: string = 'Market initialization failed') {
    super(message, 500, 'MARKET_INITIALIZATION_FAILED', true);
  }
}

export class MarketInvalidStatusError extends AppError {
  constructor(message: string = 'Operation not allowed in current market status') {
    super(message, 400, 'MARKET_INVALID_STATUS', false);
  }
}

export class MarketValidationError extends AppError {
  constructor(message: string = 'Market validation failed') {
    super(message, 400, 'MARKET_VALIDATION_ERROR', false);
  }
}

// Relay Wallet Errors
export class RelayWalletError extends AppError {
  constructor(message: string = 'Relay wallet error') {
    super(message, 500, 'RELAY_WALLET_ERROR', false);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message: string = 'Insufficient relay wallet balance') {
    super(message, 503, 'RELAY_INSUFFICIENT_BALANCE', false);
  }
}

export class TransactionFailedError extends AppError {
  constructor(message: string = 'Transaction failed') {
    super(message, 500, 'RELAY_TRANSACTION_FAILED', true);
  }
}

export class WalletNotConfiguredError extends AppError {
  constructor(message: string = 'Relay wallet not configured') {
    super(message, 500, 'RELAY_WALLET_NOT_CONFIGURED', false);
  }
}

// Blockchain Errors
export class BlockchainError extends AppError {
  constructor(message: string = 'Blockchain error') {
    super(message, 500, 'BLOCKCHAIN_ERROR', true);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed') {
    super(message, 503, 'BLOCKCHAIN_NETWORK_ERROR', true);
  }
}

export class TransactionTimeoutError extends AppError {
  constructor(message: string = 'Transaction timeout') {
    super(message, 504, 'BLOCKCHAIN_TRANSACTION_TIMEOUT', true);
  }
}

export class InvalidResponseError extends AppError {
  constructor(message: string = 'Invalid response from blockchain') {
    super(message, 500, 'BLOCKCHAIN_INVALID_RESPONSE', true);
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    };
  }

  // Generic error
  return {
    code: 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
    retryable: false,
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }

  // Check for common retryable error patterns
  const retryablePatterns = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'network',
    'timeout',
    'temporary',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
}
