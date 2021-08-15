export interface IError {
  code: number;
  message: string;
  error?: any;
}

export interface IPayload<T> {
  result: boolean;
  data?: T;
  error?: IError;
}

export function createPayload<T>(): IPayload<T> {
  return { result: false } as IPayload<T>;
}

export function createError(
  code: number,
  message: string,
  error?: any
): IError {
  return { code: code, message: message, error: error } as IError;
}
