import express, { Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import router from "./router/router";
import user from "./router/user";
import { parserToken } from "./lib/auth";
import config, { ConfigEnv, envType } from "./config/config";
import { getIp } from "./lib/security";
import { connect } from "./lib/socket";

const app = express();

app.use((req: Request, res: Response, next) => {
  // TODO 접속 가능한 cros 만 설정하기
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  // res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  // res.header(
  //   "Access-Control-Allow-Headers",
  //   "content-type, " + config.token.name.join(",").toLocaleLowerCase()
  // );
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("user ip check", new Date(), getIp(req));
  next();
});
app.use(parserToken);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("start");
});
app.use("/router", router);
app.use("/user", user);

switch (envType) {
  case ConfigEnv.BUILD:
    break;
  default:
    const swaggerSpec = YAML.load(
      path.join(__dirname, "../build/swagger.yaml")
    );
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    break;
}

app.listen(4000, () => console.log("start"));
connect();
