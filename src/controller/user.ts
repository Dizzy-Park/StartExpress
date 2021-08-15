import { NextFunction, Request, Response } from "express";
import config, { ISecurity } from "../config/config";
import {
  addLogin,
  firstLoginToken,
  getUserByEmail,
  IUser,
  IUserLoginHistory,
} from "../db/user";
import { getToken, ITokenArray } from "../lib/auth";
import {
  decrypt,
  encript,
  getIp,
  getRandomToken,
  isPassword,
} from "../lib/security";
import { reqPost } from "../vo/parser";
import { createError, createPayload, IPayload } from "../vo/payload";

/**
 * 로그인 검증
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const payload: IPayload<{ token: string; key: string }> =
    createPayload<{ token: string; key: string }>();
  try {
    const email = reqPost<string>(req, "email");
    const pwd = reqPost<string>(req, "pwd");
    const info: IUser | undefined = await getUserByEmail(email as string);
    if (info === undefined) {
      payload.error = createError(201, "이메일 주소를 확인해 주세요.");
    } else {
      if (info.u_status !== "0") {
        payload.error = createError(202, "고객센터에 문의 하시기 바랍니다.");
      } else {
        const ps: boolean = await isPassword(
          pwd as string,
          info.salt,
          info.pass
        );
        const ps1: boolean = decrypt(info.pwd) === pwd;
        if (ps || ps1) {
          const ip: Array<string> = getIp(req).split(".");
          const token: string = getRandomToken();
          await addLogin(info.useridx, token, ip);
          payload.result = true;
          payload.data = {
            token: getToken(info.useridx),
            key: encript(token),
          };
        } else {
          payload.error = createError(203, "비밀번호를 확인해 주세요.");
        }
      }
    }
  } catch (err) {
    res.status(500);
    payload.error = createError(100, "서버내부 에러", err);
  }
  res.json(payload);
};

/**
 * 암호화 필요시 토큰을 통해 AES 키 반환
 */
export const securityKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const payload: IPayload<ISecurity> = createPayload<ISecurity>();
  try {
    const key = reqPost<string>(req, "key");
    const info = req.context[0];
    const loginInfo = await firstLoginToken(info.token.idx);
    if (decrypt(key as string) === (loginInfo as IUserLoginHistory).token) {
      payload.result = true;
      payload.data = {
        key: config.security.key,
        slice: config.security.slice,
        algorithm: config.security.algorithm,
      } as ISecurity;
    } else {
      payload.error = createError(203, "Key 일치 안함");
    }
  } catch (err) {
    res.status(500);
    payload.error = createError(100, "서버내부 에러", err);
  }
  res.json(payload);
};
