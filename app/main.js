console.log("Loading!");

const ably = new Ably.Realtime.Promise({
  authUrl: `${location.origin}/.netlify/functions/token?}`,
});
console.log("Created ably", ably);
const channel = ably.channels.get("requests");

console.log("Created channel", channel);

await channel.subscribe("greeting", (msg) => {
  console.log("Message recieved", msg);
  document.querySelector("body").innerHTML += "<br />" + JSON.stringify(msg);
});

console.log("Subscribed");

let tester = document.getElementById("test");

console.log("Got button", tester);

tester.addEventListener(async () => {
  console.log("Clicked!", channel);
  await channel.publish("greeting", "hello!");
});

window.tester = tester;
