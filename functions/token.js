import * as dotenv from "dotenv";
import * as Ably from "ably/promises";

dotenv.config();

/**
 * @returns Ably token
 */
export async function handler() {
  if (!process.env.ABLY_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify(`Missing dotenv environment variable`),
    };
  }

  const clientId = "NO_CLIENT_ID";
  const client = new Ably.Rest(process.env.ABLY_API_KEY);
  const tokenRequestData = await client.auth.createTokenRequest({ clientId });
  return {
    statusCode: 200,
    body: JSON.stringify(tokenRequestData),
  };
}
