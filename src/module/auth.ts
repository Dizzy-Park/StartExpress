import { NextFunction, Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';
import config from '../config/config';
import { createError, createPayload } from '/entity/common';

declare global {
  namespace Express {
    interface Request {
      context: Array<ITokenArray>;
    }
  }
}

export interface ITokenArray {
  name: string;
  token: IToken;
}

export interface IToken {
  idx: number;
}
/**
 * 토큰 생성
 * @param idx number
 * @returns string
 */
export const getToken = (idx: number): string | undefined => {
  if (config.token) {
    return sign({ idx: idx } as IToken, config.token.key, {
      expiresIn: '7d',
    });
  }
  return undefined;
};

const parser = async (header: string): Promise<IToken | undefined> => {
  try {
    if (config.token) {
      const parser = verify(header, config.token.key);
      return parser as IToken;
    }
    return undefined;
  } catch (err) {
    throw err;
  }
};

/**
 * 토큰 확인
 */
export const parserToken = async (req: Request, res: Response, next: NextFunction) => {
  let dump: Array<ITokenArray> = [];
  if (config.token) {
    await config.token.name.forEach(async n => {
      const header: string = req.headers[n.toLocaleLowerCase()] as string;
      try {
        const par = await parser(header);
        if (par) {
          dump.push({ name: n, token: par } as ITokenArray);
        }
      } catch (err) {}
    });
  }
  if (dump.length) {
    req.context = dump;
  }
  next();
};

/**
 * 토큰이 잘못되어있을경우 에러 발생
 */
export const isLogin = (req: Request, res: Response, next: NextFunction) => {
  if (req.context?.length) {
    next();
  } else {
    res.status(401);
    const payload = createPayload();
    payload.error = createError(100, '토큰 인증 에러');
    res.json(payload);
  }
};
