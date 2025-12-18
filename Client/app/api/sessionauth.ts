"use server";

import axios from "axios";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function encrypt(secret: string) {
  // sign expects a NON-empty secret
  return jwt.sign({}, secret);
}

export default async function sessionHandler() {
  const url = process.env.BACKEND_URL;
  const authKey = process.env.JWT_ENCRYPTION_KEY as string; // ✅ FIX HERE

  if (!authKey) {
    return { status: 500, error: "JWT secret missing" };
  }

  const sendingKey = await encrypt(authKey);
  const cookie = cookies().get("sessionhold");

  if (!cookie) {
    return { status: 401, error: "Cookie Not Found" };
  }

  try {
    const response = await axios.post(
      `${url}/api/user/session-check`,
      { token: cookie.value },
      {
        headers: {
          authorization: `Bearer ${sendingKey}`,
        },
      }
    );

    return { status: response.status, data: response.data };
  } catch (err) {
    return { status: 500, error: "Internal Server Error" };
  }
}
