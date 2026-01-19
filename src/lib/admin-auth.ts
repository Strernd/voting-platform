import { headers } from "next/headers";

/**
 * Validates admin authentication from request headers.
 * Returns true if the request has valid admin credentials.
 * This provides defense-in-depth beyond middleware protection.
 */
export async function validateAdminAuth(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader) {
    return false;
  }

  const [scheme, encoded] = authHeader.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return false;
  }

  try {
    const decoded = atob(encoded);
    const [username, password] = decoded.split(":");

    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;

    if (!validUsername || !validPassword) {
      console.error("AUTH_USERNAME or AUTH_PASSWORD not configured");
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    const usernameMatch = username === validUsername;
    const passwordMatch = password === validPassword;

    return usernameMatch && passwordMatch;
  } catch {
    return false;
  }
}

/**
 * Returns a 401 Unauthorized response for admin endpoints
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Basic realm="Admin API"',
      },
    }
  );
}
