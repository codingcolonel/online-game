// This is a temporary testing file. Will be removed eventually

import { registerErrorLogger } from "./errorLog.js";

const logger = registerErrorLogger();

function time(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

function dgid(string) {
  return document.getElementById(string);
}

const confirmBtn = dgid("confirmBtn");
const connectBtn = dgid("connectBtn");
const cancelBtn = dgid("cancelBtn");

cancelBtn.addEventListener("click", toggle);

confirmBtn.addEventListener("click", () => {
  document.getElementById("userBox").classList.toggle("reveal");
  document.getElementById("userBox").classList.toggle("hide");
  document.getElementById("connectionBox").classList.toggle("reveal");
  document.getElementById("connectionBox").classList.toggle("hide");
});

connectBtn.addEventListener("click", toggle);

async function toggle() {
  document.getElementById("loaderContain").classList.toggle("reveal");
  document.getElementById("loaderContain").classList.toggle("hide");
  document.getElementById("queryBoxContain").classList.toggle("reveal");
  document.getElementById("queryBoxContain").classList.toggle("hide");

  if (document.getElementById("loaderContain").classList.contains("reveal")) {
    await time(5000);
    document.getElementById("cancelBtn").classList.add("reveal");
    document.getElementById("cancelBtn").classList.remove("hide");
  } else {
    document.getElementById("cancelBtn").classList.add("hide");
    document.getElementById("cancelBtn").classList.remove("reveal");
  }
}
