import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "nf_crm_jwt_s3cr3t_2024!"
);

export type SessionUser = { username: string; role: "admin" | "vendedor" };

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export function getCredentials() {
  return {
    admin: process.env.ADMIN_PASSWORD ?? "admin1953",
    vendedor: process.env.VENDEDOR_PASSWORD ?? "vendedor2026*",
  };
}
