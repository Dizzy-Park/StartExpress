import { Request } from "express";

export function reqPost<T>(req: Request, name: string) {
  if (req.body[name] !== undefined) {
    return req.body[name].replace(/'/gi, "&#39;") as T;
  }
  return undefined;
}
