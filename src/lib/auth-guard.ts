import "server-only";
import { auth } from "@/lib/auth";

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError("You must be logged in to do this.");
  }
  return session;
}