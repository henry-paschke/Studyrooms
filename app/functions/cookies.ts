"use server";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// Payload: Cookie to be encrypted. ie {username: jjdoesit, cookieExpires: 1200}
export async function cookieEncrypt(payload: any) {
  // Fetch and encrypt the secret encrypt key
  const COOKIE_ENCRYPT_KEY = process.env.COOKIE_ENCRYPT_KEY;
  const key = new TextEncoder().encode(COOKIE_ENCRYPT_KEY);
  // Sign the payload and return the issued session
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(key);
}

// Input: An encrypted cookie string (given by cookies().get('session')?.value!)
export async function decrypt(input: string) {
  // Fetch and encrypt the secret encrypt key
  const COOKIE_ENCRYPT_KEY = process.env.COOKIE_ENCRYPT_KEY;
  const key = new TextEncoder().encode(COOKIE_ENCRYPT_KEY);
  // Verify the input by signing with the secret key
  var payload;
  try {
    const { payload: verifiedPayload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    payload = verifiedPayload;
  } catch (e) {
    payload = null;
  }
  return payload;
}

export async function getSession() {
  const cookie = cookies().get("session")?.value;
  // If there is no cookie -> return null
  if (cookie == null) {
    return null;
  }
  // Decrypt the cookie
  return await decrypt(cookie);
}

export async function login(email: string) {
  // Set a date for when the session expires
  const cookieExpires = new Date(
    Date.now() + parseInt(process.env.SESSION_TIME!)
  );

  const id = await getIdByEmail(email);

  console.log(id);

  //Create a signed session
  const cookie = await cookieEncrypt({ email, cookieExpires, id });
  // Save the session in a cookie
  cookies().set("session", cookie, {
    expires: cookieExpires,
    httpOnly: true,
  });
}

export async function getIdByEmail(email: string) {
  const response = await fetch(
    process.env.NEXT_PUBLIC_BASE_URL + "api/py/fetch-id",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail: email }),
    }
  );

  const data = await response.json();
  return data.id;
}

export async function updateSession(request: NextRequest) {
  // Fetch the current session
  const cookie = request.cookies.get("session")?.value;
  // If the session doesn't exist -> return null
  if (cookie == null) {
    return null;
  }
  // Decrypt the current session
  const parsed = await decrypt(cookie);

  if (parsed == null) {
    return null;
  }
  // Set a date for when the session expires
  const updateTime = Date.now() + parseInt(process.env.SESSION_TIME!);
  // Update the current session to extend time
  parsed.expires = new Date(Date.now() + updateTime);
  const result = NextResponse.next();
  result.cookies.set("session", await cookieEncrypt(parsed), {
    httpOnly: true,
    expires: parsed.expires as Date,
  });
  return result;
}

export async function logout() {
  cookies().set("session", "", {
    expires: new Date(0), // Expire immediately
    httpOnly: true,
  });
}
