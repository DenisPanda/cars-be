import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_EXP_HOURS } from "../config";


export async function hash(pass: string) {
  return await bcrypt.hash(`${pass}`, 10);
}

export async function compare(pass: string, hash: string) {
    return await bcrypt.compare(pass, hash);
}

export async function createJWT(id: string) {
    const iat = Math.floor(Date.now() / 1000) - 30;

    // can be roles, permissions, whatever...
    return await jwt.sign(
      {
        id,
        iat,
        // set expiration
        exp: iat + JWT_EXP_HOURS * 3600,
      },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256" }
    );
}

export async function verifyJWT(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET as string);
}
