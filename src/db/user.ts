import { query } from "../lib/mysql";

export interface IUser {
  useridx: number;
  email: string;
  tell: string;
  nick: string;
  pass: string;
  pwd: string;
  salt: string;
  si: string;
  gugun: string;
  dong: string;
  addr: string;
  zip: string;
  regdate: string;
  /** 상태값 */
  u_status: string;
}

export interface IUserLoginHistory {
  useridx: number;
  token: string;
  ip1: string;
  ip2: string;
  ip3: string;
  ip4: string;
}

/**
 * 이메일로 회원 정보 가져오기
 * @param {String} email 이메일
 * @returns {Array} 회원 리스트
 * @memberof Db
 */
export async function getUserByEmail(
  email: string
): Promise<IUser | undefined> {
  try {
    const rows: Array<IUser> = await query<IUser>(
      `SELECT * FROM user_info where email = '${email}'`
    );
    return rows[0];
  } catch (err) {
    throw err;
  }
}

export async function addLogin(
  useridx: number,
  token: string,
  ip: Array<string>
) {
  try {
    const rows: IUserLoginHistory[] = await query<IUserLoginHistory>(
      `INSERT INTO user_login_history(useridx, token, regdate, ip1, ip2, ip3, ip4) VALUES(${useridx}, ${token} now(), ${ip[0]}, ${ip[1]}, ${ip[2]}, ${ip[3]})`
    );
    return rows;
  } catch (err) {
    throw err;
  }
}

export async function firstLoginToken(
  useridx: number
): Promise<IUserLoginHistory | undefined> {
  try {
    const rows: IUserLoginHistory[] = await query<IUserLoginHistory>(
      `SELECT * FROM user_login_history where useridx = '${useridx}' ORDER BY updated_at DESC`
    );
    return rows[0];
  } catch (err) {
    throw err;
  }
}
