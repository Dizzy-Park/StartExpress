import mongoose, { ConnectOptions } from "mongoose"

export interface IMongoConfig {
  host: string
  option: ConnectOptions
}

export async function connect(config: IMongoConfig) {
  mongoose.Promise = global.Promise
  await mongoose.connect(config.host, config.option)
  console.log("success connect")
}
