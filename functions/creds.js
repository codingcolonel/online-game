import * as dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

/**
 * @returns OpenRelayProject creds
 */
export async function handler() {
  if (!process.env.METERED_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify(`Missing dotenv environment variable`),
    };
  }

  let response = await fetch(
    `https://testingdomain.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
  );
  let iceServers = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify(iceServers),
  };
}
