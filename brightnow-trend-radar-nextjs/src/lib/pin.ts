import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const N = 16384;
const R = 8;
const P = 1;

function encode(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, KEY_LENGTH, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${encode(salt)}$${encode(hash)}`;
}

export function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltEncoded, hashEncoded] = parts;
  const expected = Buffer.from(hashEncoded, "base64url");
  const actual = scryptSync(
    pin,
    Buffer.from(saltEncoded, "base64url"),
    expected.length,
    {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    },
  );

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
