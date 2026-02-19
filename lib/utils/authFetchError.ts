export class AuthFetchError extends Error {
  code: 'NO_API_URL' | 'NO_TOKEN' | 'TOKEN_EXPIRED';

  constructor(message: string, code: AuthFetchError['code']) {
    super(message);
    this.name = 'AuthFetchError';
    this.code = code;
  }
}
