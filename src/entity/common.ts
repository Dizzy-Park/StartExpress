import { IUser, IUserLoginHistory } from './user';
import { Request } from 'express';

export const enum Table {
  user = 'user',
  user_login_history = 'user_login_history',
}

export interface TableMap {
  [Table.user]: IUser;
  [Table.user_login_history]: IUserLoginHistory;
}

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

export function createError(code: number, message: string, error?: any): IError {
  return { code: code, message: message, error: error } as IError;
}

export function reqPost<T>(req: Request, name: string) {
  if (req.body[name] !== undefined) {
    return req.body[name].replace(/'/gi, '&#39;') as T;
  }
  return undefined;
}
