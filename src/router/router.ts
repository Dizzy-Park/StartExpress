import { NextFunction } from "connect";
import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("world");
});

export = router;
