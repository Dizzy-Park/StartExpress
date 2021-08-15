import mysql, { MysqlError, PoolConnection } from "mysql";
import config from "../config/config";

console.log(config.db);

const pool = mysql.createPool(config.db);

/**
 * PoolConnection 반환
 * @returns Promise<PoolConnection>
 */
function getConnection(): Promise<PoolConnection> {
  return new Promise<PoolConnection>((res, rej) => {
    pool.getConnection((err: MysqlError, conn: PoolConnection) => {
      if (err) {
        rej(err);
      }
      res(conn);
    });
  });
}

/**
 * 설정한 T 에 맞게 Array<T> 로 반환
 * @param conn PoolConnection
 * @param qry string
 * @returns Promise<Array<T>>
 */
function getData<T>(conn: PoolConnection, qry: string): Promise<Array<T>> {
  return new Promise((res, rej) => {
    conn.query(qry, (err: MysqlError, data, fields) => {
      if (err) {
        rej(err);
      }
      res(data as Array<T>);
    });
  });
}

/**
 * 설정한 T 에 맞게 Array<T> 를 반환
 * mysql db 에서 query 에 맞는 정보 검색
 * @param qry string
 * @returns Promise<Array<T>>
 */
export async function query<T>(qry: string): Promise<Array<T>> {
  const conn = await getConnection();
  try {
    const data: Array<T> = await getData<T>(conn, qry);
    return data;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}
