require("dotenv").config();

exports.handler = async function () {
  let response = await fetch(
    `https://testingdomain.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
  );
  let iceServers = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ message: iceServers }),
  };
};
