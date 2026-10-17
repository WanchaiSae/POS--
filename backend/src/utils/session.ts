import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Request } from "express";
import User from "../model/User";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || Buffer.byteLength(sessionSecret, "utf8") < 32) {
  throw new Error("SESSION_SECRET must be set to a random value of at least 32 bytes");
}

const sign = (payload: string) => createHmac("sha256", sessionSecret).update(payload).digest("hex");

export const createSession = (userId: number) => {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(`${userId}.${expiresAt}.${randomBytes(16).toString("hex")}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const getSessionUser = async (req: Request) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload), "hex");
  const supplied = Buffer.from(signature, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const [userIdValue, expiresAtValue] = Buffer.from(payload, "base64url").toString("utf8").split(".");
    const userId = Number(userIdValue);
    const expiresAt = Number(expiresAtValue);
    if (!Number.isInteger(userId) || userId <= 0 || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
    const user = await User.findByPk(userId);
    return user?.is_active ? user : null;
  } catch {
    return null;
  }
};
