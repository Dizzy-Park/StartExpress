import config from "./state.json";

export enum ConfigEnv {
  LOCAL = "local",
  DEV = "dev",
  BUILD = "build",
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

interface IDb {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  multipleStatements: boolean;
}

export interface ISecurity {
  key: string;
  algorithm: string;
  slice: number;
}

interface IConfig {
  db: IDb;
  token: {
    name: Array<string>;
    key: string;
  };
  security: ISecurity;
  password: {
    count: number;
    keylen: number;
    digest: string;
  };
  log: string;
  aws: IAws;
  url: {
    gameApi: string;
    messageApi: string;
    redis: IRedis;
  };
}

export const envType: ConfigEnv = ((): ConfigEnv => {
  switch (process.env.NODE_ENV) {
    case "development":
      return ConfigEnv.DEV;
    case "production":
      return ConfigEnv.BUILD;
    default:
      return ConfigEnv.LOCAL;
  }
})();

export default {
  db: config.db[envType] as IDb,
  token: config.token,
  log: config.log,
  aws: config.aws,
  password: config.password,
  security: config.security,
  url: {
    gameApi: config.url.gameApi[envType],
    messageApi: config.url.gameApi[envType],
    redis: config.url.redis[envType],
  },
} as IConfig;
