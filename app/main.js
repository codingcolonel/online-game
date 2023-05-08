console.log("Loading!");

const ably = new Ably.Realtime.Promise({
  authUrl: `${location.origin}/.netlify/functions/token?}`,
});
const channel = ably.channels.get("requests");

await channel.subscribe(messageArrived);

function messageArrived(msg) {
  console.log("Message recieved", msg);
  document.querySelector("body").innerHTML += "<br />" + JSON.stringify(msg);
}

let tester = document.getElementById("test");

tester.onclick = async (e) => {
  console.log("Clicked!", channel);
  await channel.publish("greeting", "hello!");
};
