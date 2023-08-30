import { IDb } from '/module/mysql';
import config from './state.json';
import { IMongoConfig } from '/module/mongo';

export enum ConfigEnv {
  LOCAL = 'local',
  DEV = 'dev',
  BUILD = 'build',
}

interface IRedis {
  host: string;
  port: number;
  db: number;
  auth?: string;
  password?: string;
}

interface IAws {
  access_key_id: string;
  secret_access_key: string;
  bucket: string;
  url: string;
}

export interface ISecurity {
  key: string;
  algorithm: string;
  slice: number;
}

interface IConfig {
  index: number;
  db: IDb;
  db2?: IDb;
  token?: {
    name: Array<string>;
    key: string;
  };
  security?: ISecurity;
  password?: {
    count: number;
    keylen: number;
    digest: string;
  };
  log: string;
  aws: IAws;
  mongo: IMongoConfig;
  socket?: string;
  redis?: IRedis;
}

export const envType: ConfigEnv = ((): ConfigEnv => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return ConfigEnv.DEV;
    case 'production':
      return ConfigEnv.BUILD;
    default:
      return ConfigEnv.LOCAL;
  }
})();

function getDb(): IDb {
  return config.db[envType] as IDb;
}

// function getDb2(): IDb {
//   return config.db2[envType] as IDb;
// }

let configInfo: IConfig = {
  index: 0,
  db: getDb(),
  // db2: getDb2(),
  log: config.log,
  aws: config.aws,
  mongo: config.mongo as IMongoConfig,
};

export default configInfo;
