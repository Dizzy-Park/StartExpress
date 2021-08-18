import crypto, { Cipher, Decipher } from "crypto";
import { Request } from "express";
import config from "../config/config";

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCLYwNlMsZTu0iq
wgIYHLKudCanVxmaisCJ/J/uCuoPIq3QtkSB3px9izUTDZJT2akokcYQ3JAxcMYK
ycD8mLRZ+So/7QoMuQbKCQgAP6G+F3zgZ90DQcvgy8bRWqAS5eUnTf5DlAVirgiS
wQbqwAkZPlowaJb4zI+ZVV1qG9eZAPcpZ6ysFLbN8WRZn7H+N4yH3bofh2ZQTlC8
TLmdEz36iirDvQPVSPh8/oZLu5TVFuA3VF2iazG0zqsXZ+SsfZZShzNTzp6wjo+V
IyMqszdDYS/thLcj9o/8MgIh3TRXq+7aTH7sGaZirXHr0l8Y9gU7ngfvkuQXz1le
gmsOX2yTAgMBAAECggEAP8K0O+elF4pVbF9BC/ycs/bH88aBHNOZzcU093Qgq3nG
nvGxluLZHQi/545OwHKR0dAVFYN/pk4bGbY+xI2p+npjHEj3TuiYtXS6Jzr0Zvth
kVmRnTrM43Dz6rKVBPALChbAV/NvHzvTCiaoXlwoDVcbdIdzgC47Bf4ptC82SXOZ
iaf98NUJDvChuDZ2+naa4noG9I8VjD/FqFN6MXYmnFRlR4VN5v+2X3ywRG79RfqA
9hEUuoftNrpdg7S941ewWpneRVwXSubs65LM9z+0wcp1RWKRthNIQSiUZ+xFAJTC
+IjkeSVdOFiYkzARBi7HvEeNLXs/81XHC1/3+f66KQKBgQDrtFVQ6A9GbZPFyc9L
txjfEDdWFEi/w/kIeZv9XwJHTQbQMVSCkM57HsGkBmn7vWSf0rWZOBzXS6DlxkrX
saeAmnfm6YzojQM30Alu5795nRe/QCFAdphryqXdRjYkstk5Tv5PuQNJa8X5Npww
8D2blv5NiC7T7+IoOtUUvxS4RwKBgQCXY4k2R5YsNRL0XbiMLzacPi5gKX2Z+bgO
qXoWfIUUnM02sMB/ulMCYh044ktxlNmvxDNI4V9kKmsfp1L9C3UW4uqqe29Hu/GK
96Wf66P1PqkWo+CJvXBTybPJhGrx63ZX37noX8rC8YJIBu+Xsbw6/gcvwDRgO41c
TeU09JtbVQKBgQDrS19r3+z3woWlCdwtWn+ylg6XmLIy9SCSbEvjOEgfA27MwKH7
oTDuyXpHErwUOTHNNlxgsxpfdjkNh9DI16k+AXW2hulKcRKIUd5I34JOlhrRqeRH
5NwtpuPDK8b7BatBwXCwByKX1cWRDgoH9JubybTdkxgkLDEZNfnmtwWpGwKBgQCM
C2YZMmv3hTl9mV1pQRvRuawJBRjN4bakyZ7JQnORt+QW3beV8PVtVPoXby+/aKVf
9a5Dk0k9Tgg/Bfi9YWX1wAC5qOouf+xYU/OBVukbq9WbvgmvIfHRcNvCZZ7RILMf
YzWFg2f8opGUs+XcfGzWXbykLbfF9hE0/FI2hLla6QKBgQDdihAnBOfRmHr4FmQ3
D4cUjubursSTiEryzwxzW8CLk8fSoAlmdwsOFmlxfeelZ88esy1IYkRl5CZiR3Lu
WIOFZ3ElO3N4JSQ9CenGylvyY9/8WXzCqT2JgEDt4Ad0EVdIm4213ihWzAz9j017
cUDpWGg9Pa7xpu4pNVu+w2ejug==
-----END PRIVATE KEY-----`;
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi2MDZTLGU7tIqsICGByy
rnQmp1cZmorAifyf7grqDyKt0LZEgd6cfYs1Ew2SU9mpKJHGENyQMXDGCsnA/Ji0
WfkqP+0KDLkGygkIAD+hvhd84GfdA0HL4MvG0VqgEuXlJ03+Q5QFYq4IksEG6sAJ
GT5aMGiW+MyPmVVdahvXmQD3KWesrBS2zfFkWZ+x/jeMh926H4dmUE5QvEy5nRM9
+ooqw70D1Uj4fP6GS7uU1RbgN1RdomsxtM6rF2fkrH2WUoczU86esI6PlSMjKrM3
Q2Ev7YS3I/aP/DICId00V6vu2kx+7BmmYq1x69JfGPYFO54H75LkF89ZXoJrDl9s
kwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * 클라이언트 IP 정보
 * @param req Request
 * @returns
 */
export const getIp = (req: Request): string => {
  var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (ip === "::1") {
    return "127.0.0.1";
  }
  return ip as string;
};

interface ICipherParam {
  CipherKey: Buffer;
  BinaryLike: Buffer;
}

enum Encode {
  UTF8 = "utf8",
  BASE64 = "base64",
  HEX = "hex",
}

export const getRandomToken = (): string => {
  return crypto.randomBytes(8).toString(Encode.BASE64).replace("=", "");
};

/**
 * URL 에 충돌하지 않게 인코딩
 * @param id string
 * @returns string
 */
export const _encodeBase64 = (id: string): string => {
  return (
    (id &&
      Buffer.from(id.toString(), Encode.HEX)
        .toString(Encode.BASE64)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")) ||
    id
  );
};

/**
 * URL 에 충돌하지 않은 값을 디코딩
 * @param id string
 * @returns string
 */
export const _decodeBase64 = (id: string): string => {
  return (
    (id &&
      Buffer.from(
        id.replace(/-/g, "+").replace(/_/g, "/"),
        Encode.BASE64
      ).toString(Encode.HEX)) ||
    id
  );
};

const getCipher = (): ICipherParam => {
  const sba: Buffer = Buffer.from(config.security.key, Encode.UTF8);
  const iv: Buffer = Buffer.from(sba.slice(0, config.security.slice));
  return { CipherKey: sba, BinaryLike: iv };
};

/**
 * AES 암호화 처리
 * @param data string
 * @returns string
 */
export const _encode = (data: string): string => {
  if (data) {
    const param: ICipherParam = getCipher();
    const cipher: Cipher = crypto.createCipheriv(
      config.security.algorithm,
      param.CipherKey,
      param.BinaryLike
    );
    const result: string = cipher.update(
      data.toString(),
      Encode.UTF8,
      Encode.BASE64
    );
    return result + cipher.final(Encode.BASE64);
  } else {
    return data;
  }
};
/**
 * AES 복호화 처리
 * @param data string
 * @returns string
 */
export const _decode = (data: string): string => {
  if (data) {
    const param: ICipherParam = getCipher();
    const cipher: Decipher = crypto.createDecipheriv(
      config.security.algorithm,
      param.CipherKey,
      param.BinaryLike
    );
    const result: string = cipher.update(data, Encode.BASE64, Encode.UTF8);
    return result + cipher.final(Encode.UTF8);
  } else {
    return data;
  }
};

/**
 * RSDA 암호화 245byte 까지가능
 * @param txt string
 * @returns string
 */
export const encript = (txt: string): string => {
  const enc: string = crypto
    .privateEncrypt(privateKey, Buffer.from(txt, Encode.UTF8))
    .toString(Encode.BASE64);
  return enc;
};
/**
 * RSDA 복호화
 * @param txt string
 * @returns string
 */
export const decrypt = (txt: string): string => {
  try {
    const enc: string = crypto
      .privateDecrypt(privateKey, Buffer.from(txt, Encode.BASE64))
      .toString(Encode.UTF8);
    return enc;
  } catch (err) {
    throw err;
  }
};

export interface IPassword {
  pass: string;
  salt: string;
}
/**
 * 비밀번호 설정
 * @param pwd string
 * @returns IPassword {pass: string, salt: string}
 */
export async function setPassword(pwd: string): Promise<IPassword> {
  const buf: Buffer = crypto.randomBytes(config.password.keylen);
  const salt: string = buf.toString(Encode.BASE64).replace("=", "");
  return new Promise((res, rej) => {
    crypto.pbkdf2(
      pwd,
      salt,
      config.password.count,
      config.password.keylen,
      config.password.digest,
      (err: Error | null, dk: Buffer) => {
        if (err) {
          rej(err);
        }
        res({
          pass: dk.toString(Encode.BASE64).replace("=", ""),
          salt: salt,
        } as IPassword);
      }
    );
  });
}

/**
 * 비밀번호 비교
 * @param pwd string
 * @param salt string
 * @param org string
 * @returns boolean
 */
export async function isPassword(
  pwd: string,
  salt: string,
  org: string
): Promise<boolean> {
  return new Promise((res, rej) => {
    if (pwd && salt && org) {
      crypto.pbkdf2(
        pwd,
        salt,
        config.password.count,
        config.password.keylen,
        config.password.digest,
        (err: Error | null, dk: Buffer) => {
          if (err) {
            rej(err);
          }
          res(org === dk.toString(Encode.BASE64).replace("=", ""));
        }
      );
    } else {
      res(false);
    }
  });
}
