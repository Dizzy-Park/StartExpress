import { NextFunction, Request, Response } from "express";
import config from "../config/config";
import { addLogin, getUserByEmail, IUser } from "../db/user";
import { getToken } from "../lib/auth";
import { decrypt, getIp, isPassword } from "../lib/security";
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
  const payload: IPayload<string> = createPayload<string>();
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
          await addLogin(info.useridx, ip);
          payload.result = true;
          payload.data = getToken(info.useridx);
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
  const payload: IPayload<{ key: string; slice: number }> =
    createPayload<{ key: string; slice: number }>();
  try {
    payload.result = true;
    payload.data = {
      key: config.security.key,
      slice: config.security.slice,
    };
  } catch (err) {
    res.status(500);
    payload.error = createError(100, "서버내부 에러", err);
  }
  res.json(payload);
};
