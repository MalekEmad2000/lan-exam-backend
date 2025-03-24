import jwt from 'jsonwebtoken';

export interface JWTObject {
  userId: number;
  // isAdmin: boolean;
}

export class JWTHelper {
  static sign(obj: JWTObject): string {
    return jwt.sign(obj, this.getJWTSecret());
  }

  static verify(token: string): JWTObject {
    return jwt.verify(token, this.getJWTSecret()) as JWTObject;
  }

  private static getJWTSecret(): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not defined');
    }
    return process.env.JWT_SECRET;
  }
}
