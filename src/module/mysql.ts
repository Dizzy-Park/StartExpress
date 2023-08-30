import mysql, { type MysqlError, type OkPacket, type PoolConnection } from 'mysql';
import { valueOf } from './utils';

export interface IDb {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  multipleStatements: boolean;
}

let dbs: IDb[] = [];
let pool: mysql.Pool[] = [];

export function setConfig($dbs: IDb[]) {
  $dbs.forEach((k, idx) => {
    dbs[idx] = k;
    pool[idx] = mysql.createPool(k);
  });
  isAllConnection();
}

function hasConnection(type: number): Promise<PoolConnection> {
  return getConnection(type);
}

async function connection(type: number) {
  while (true) {
    try {
      const cnn = await hasConnection(type);
      await getData(cnn, `select 1 from dual`);
      cnn.release();
      console.log('success connection', type, cnn.config.host);
      return;
    } catch (err) {
      // config.change();
      console.log('not connection', dbs[type]);
      pool[type] = mysql.createPool(dbs[type]);
    }
  }
}

async function isAllConnection() {
  pool.forEach((_p, idx) => connection(idx));
}

/**
 * PoolConnection 반환
 * @returns Promise<PoolConnection>
 */
function getConnection(type?: number): Promise<PoolConnection> {
  return new Promise<PoolConnection>((res, rej) => {
    pool[type === undefined ? 0 : type].getConnection((err: MysqlError, conn: PoolConnection) => {
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
function getData(conn: PoolConnection, qry: string) {
  return new Promise((res, rej) => {
    conn.query(qry, (err, data, _fields) => {
      if (err) {
        rej(err);
      }
      res(data);
    });
  });
}
interface IQueryResultMap<T> {
  select: Array<T>;
  insert: OkPacket;
  update: OkPacket;
  delete: OkPacket;
  create: OkPacket;
  index: OkPacket;
}

type IQueryResultType<T> = keyof IQueryResultMap<T>;

//id, snippet, contentDetails, fileDetails, liveStreamingDetails, player, processingDetails, recordingDetails, statistics, status, suggestions, topicDetails

interface IAbsQuery {
  // table?: string
}

type IQuerySortType<T> = keyof T | { field: keyof T; desc?: boolean } | 'rand';

export type IQueryWhereType<T> = { [p in keyof T]?: T[p] | Array<T[p]> | string };
export type IQueryJoinType = {
  table: string;
  fields: string[];
  where: string;
  sort?: IQuerySortType<any>;
};
interface IQuerySelect<T> extends IAbsQuery {
  fields?: Array<keyof T> | '*';
  join?: [
    {
      type?: 'INNER';
      in?: { table: string; where: string };
      join: IQueryJoinType;
    },
  ];
  where?: IQueryWhereType<T>;
  not?: IQueryWhereType<T>;
  sort?: IQuerySortType<T>;
  limit?: { size: number; page?: number } | number;
}

interface IQueryInsert<T> extends IAbsQuery {
  data: Array<T>;
  fields?: Array<keyof T>;
}

interface IQueryUpdate<T> extends IAbsQuery {
  where: IQueryWhereType<T>;
  data: T;
}

interface IQueryDelete<T> extends IAbsQuery {
  where?: IQueryWhereType<T>;
}

type SqlFieldType = 'INT' | 'VARCHAR' | 'DATETIME' | 'TEXT' | 'TINYINT';

export enum ISqlDefault {
  AUTO = 'AUTO_INCREMENT',
  CURRENT = 'CURRENT_TIMESTAMP',
  CURRENT_UPDATE = 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
}

export interface IQueryFieldsType<T> {
  name: keyof T;
  type: SqlFieldType;
  size?: number;
  isNull?: boolean;
  isPrimary?: boolean;
  default?: ISqlDefault | string | number;
}
interface IQueryCreate<T> extends IAbsQuery {
  fields: Array<IQueryFieldsType<T>>;
}

interface IQueryIndexFieldsType<T> {
  name: keyof T;
  sort: 'ASC' | 'DESC';
}

interface IQueryIndex<T> extends IAbsQuery {
  fields: Array<keyof T | IQueryIndexFieldsType<T>>;
  isUnique?: boolean;
  name: string;
}

interface IQueryMap<T> {
  select: IQuerySelect<T>;
  insert: IQueryInsert<T>;
  update: IQueryUpdate<T>;
  delete: IQueryDelete<T>;
  create: IQueryCreate<T>;
  index: IQueryIndex<T>;
}

type IQueryType<T> = keyof IQueryMap<T>;
export type IQueryTotalType<T> = IQueryType<T> & IQueryResultType<T>;

export interface IQueryParam<T, K extends IQueryTotalType<T>> {
  type?: number;
  table: string;
  qry?: IQueryMap<T>[K] | string;
  isRelease?: boolean;
  conn?: PoolConnection;
}

type IQueryValueType<T> = valueOf<IQueryMap<T>>;

function changeQueryType<T, K extends IQueryType<T>>(
  _type: K,
  data: IQueryValueType<T> & { table: string },
) {
  return data as IQueryMap<T>[K] & { table: string };
}

export interface IAbsTableMap {}

/**
 * 설정한 T 에 맞게 Array<T> 를 반환
 * mysql db 에서 query 에 맞는 정보 검색
 * @param qry string
 * @returns Promise<Array<T>>
 */
export async function query<T, K extends IQueryTotalType<T>>(
  queryType: K,
  params: IQueryParam<T, IQueryType<T>>,
) {
  const cconn = params.conn ? params.conn : await getConnection(params.type);
  try {
    let q: string;
    if (typeof params.qry === 'string') {
      q = params.qry;
    } else {
      const qtParams = params as IQueryParam<T, K> & {
        queryType?: IQueryTotalType<T>;
      };
      // params.qry.table = params.table
      qtParams.queryType = queryType;
      switch (qtParams.queryType) {
        case 'select':
          q = selectQuery(
            changeQueryType(qtParams.queryType, { ...params.qry, table: params.table }),
          );
          break;
        case 'insert':
          q = insertQuery(
            changeQueryType(qtParams.queryType, { ...params.qry, table: params.table }),
          );
          break;
        case 'update':
          q = updateOneQuery(
            changeQueryType(qtParams.queryType, { ...params.qry, table: params.table }),
          );
          break;
        case 'delete':
          q = deleteQuery(
            changeQueryType(qtParams.queryType, { ...params.qry, table: params.table }),
          );
          break;
        case 'create':
          q = createQuery(
            changeQueryType(qtParams.queryType, { ...params.qry, table: params.table }),
          );
          break;
        case 'index':
          q = indexQuery(
            changeQueryType(qtParams.queryType, { ...params.qry, table: params.table }),
          );
          break;
        default:
          q = '';
          break;
      }
    }
    console.log(q);
    const data: IQueryResultMap<T>[K] = (await getData(cconn, q)) as IQueryResultMap<T>[K];
    if (params.isRelease === true || params.isRelease === undefined) {
      return { result: data };
    } else {
      return { conn: cconn, result: data };
    }
  } catch (err) {
    throw err;
  } finally {
    if (params.isRelease === true || params.isRelease === undefined) {
      cconn.release();
    }
  }
}

function paserSort<T>(sort: IQuerySortType<T>, table?: string) {
  const t = table ? `${table}.` : ``;
  return typeof sort === 'object'
    ? `${t + String(sort.field)} ${sort.desc ? `DESC` : `ASC`}`
    : `${t + String(sort)} ASC`;
}

function selectQuery<T>({
  table,
  join,
  fields,
  where,
  not,
  limit,
  sort,
}: IQuerySelect<T> & { table: string }) {
  let joinF: string[] = [];
  let joinS: string[] = [];
  const joinq = join
    ? join.map(k => {
        joinF = joinF.concat(k.join.fields);
        console.log(k.join.sort);

        if (k.join.sort) {
          joinS.push(paserSort<any>(k.join.sort, k.join.table));
        }
        return `${k.type ? k.type : 'INNER'} JOIN ${k.join.table} ON ${k.in ? k.in : 'A'}.${String(
          k.in ? k.in.where : k.join.where,
        )} = ${k.join.table}.${k.join.where}`;
      })
    : ``;
  const q = `SELECT ${
    fields === undefined || fields === '*'
      ? '*'
      : `A.${fields.join(',A.')} ${joinF.length ? `,${joinF.join(',')}` : ''}`
  } FROM ${table} A`;

  const whereq = paserWhere({ where, not });
  console.log('joins', joinS);

  const sortq = sort
    ? sort === 'rand'
      ? `ORDER BY RAND()`
      : `ORDER BY A.${paserSort(sort)}${joinS.length ? `,${joinS.join(',')}` : ``}`
    : joinS.length
    ? `ORDER BY ${joinS.join(',')}`
    : ``;
  const limitq = limit
    ? typeof limit === 'number'
      ? `LIMIT ${limit}`
      : `LIMIT ${limit.page !== undefined ? (limit.page - 1) * limit.size : 0}, ${limit.size}`
    : ``;
  return `${q} ${joinq} ${whereq} ${sortq} ${limitq}`;
}

function updateOneQuery<T>({ table, data, where }: IQueryUpdate<T> & { table: string }) {
  if (where && data) {
    const ws = mixQuery(where);
    const ds = mixQuery<T>(data);
    return `UPDATE ${table} SET ${ds.join(',')} WHERE ${ws.join(' AND ')}`;
  } else {
    return '';
  }
}

function insertQuery<T>({ table, fields, data }: IQueryInsert<T> & { table: string }) {
  if (data) {
    if (fields) {
      const ds = data
        .map(d => {
          return `("${fields.map(f => (d[f] ? d[f] : null)).join(`","`)}")`;
        })
        .join(',');
      return `INSERT INTO ${table} (${fields.join(',')}) VALUES ${ds}`;
    } else {
      const fs = Object.keys(data[0] as Object) as Array<keyof T>;
      const ds = data
        .map(d => {
          return `("${fs.map(f => (d[f] ? d[f] : null)).join(`","`)}")`;
        })
        .join(',');
      return `INSERT INTO ${table} (${fs.join(',')}) VALUES ${ds}`;
    }
  } else {
    return '';
  }
}

function deleteQuery<T>({ table, where }: IQueryDelete<T> & { table: string }) {
  if (where) {
    const ws = mixQuery(where);
    return `DELETE FROM ${table} WHERE ${ws.join(' AND ')}`;
  }
  return `DROP TABLE ${table}`;
}

function createQuery<T>({ table, fields }: IQueryCreate<T> & { table: string }) {
  const p: string[] = [];
  const fieldQ = fields.map(k => {
    if (k.isPrimary === true) {
      p.push(String(k.name));
    }
    const t = `${k.type}${k.size ? ` (${k.size})` : ``}`;
    const isNull = k.isNull === undefined || k.isNull === true ? `NULL` : `NOT NULL`;
    const d =
      k.default !== undefined
        ? k.default === 'AUTO_INCREMENT'
          ? `AUTO_INCREMENT`
          : `DEFAULT ${k.default}`
        : ``;
    return `${String(k.name)} ${t} ${isNull} ${d}`;
  });
  if (p.length) {
    return `CREATE TABLE ${table} (${fieldQ.join(',')}, PRIMARY KEY (${p.join()}))`;
  } else {
    return `CREATE TABLE ${table} (${fieldQ.join(',')})`;
  }
}

function indexQuery<T>({ table, fields, name, isUnique }: IQueryIndex<T> & { table: string }) {
  const f = fields.map(k => {
    if (typeof k === 'string') {
      return `${k} ASC`;
    } else if (typeof k === 'object') {
      return `${String(k.name)} ${k.sort}`;
    }
  });
  if (isUnique === true) {
    return `CREATE UNIQUE INDEX ${name} ON ${table} (${f.join(',')})`;
  } else {
    return `CREATE INDEX ${name} ON ${table} (${f.join(',')})`;
  }
}

function mixQuery<T>(data: IQueryWhereType<T>) {
  const key = Object.keys(data) as (keyof T)[];
  return isfilter(
    key.map(f => {
      if (data[f] !== undefined && data[f] instanceof Array === true) {
        return `${f as string} IN ("${(data[f] as any).join(`","`)}")`;
      } else {
        if (String(data[f]).indexOf(String(f)) !== -1) {
          return String(data[f]);
        } else {
          return `${f as string}="${data[f]}"`;
        }
      }
    }),
  );
}

function mixNotQuery<T>(data: IQueryWhereType<T>) {
  const key = Object.keys(data) as (keyof T)[];
  return isfilter(
    key.map(f =>
      data[f] !== undefined ? `${f as string} NOT IN("${(data[f] as any).join(',')}")` : ``,
    ),
  );
}

function isfilter(item: Array<string | boolean>): string[] {
  return item.filter((i): i is string => typeof i === 'string');
}

export function paserWhere<T>({
  where,
  not,
}: {
  where?: IQueryWhereType<T>;
  not?: IQueryWhereType<T>;
}) {
  const notq = not ? mixNotQuery(not).join(' AND ') : ``;
  const whreeq = where
    ? notq
      ? `WHERE ${mixQuery(where).join(' AND ')} AND ${notq}`
      : `WHERE ${mixQuery(where).join(' AND ')}`
    : not
    ? `WHERE ${notq}`
    : ``;
  return whreeq;
}
