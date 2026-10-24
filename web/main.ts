import { RemoteClient } from "./remote-client.js";

const tokenInput = document.querySelector<HTMLInputElement>("#token")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const stateEl = document.querySelector<HTMLPreElement>("#state")!;
const connectBtn = document.querySelector<HTMLButtonElement>("#connect")!;
const playBtn = document.querySelector<HTMLButtonElement>("#play")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("#pause")!;

const TOKEN_KEY = "remote-control-token";
const saved = localStorage.getItem(TOKEN_KEY);
if (saved) {
  tokenInput.value = saved;
}

const client = new RemoteClient(undefined, {
  onStatus(text) {
    statusEl.textContent = text;
    const connected = client.connected;
    playBtn.disabled = !connected;
    pauseBtn.disabled = !connected;
  },
  onState(state) {
    stateEl.textContent = JSON.stringify(state, null, 2);
    if (client.connected) {
      playBtn.disabled = false;
      pauseBtn.disabled = false;
    }
  },
});

connectBtn.addEventListener("click", () => {
  const token = tokenInput.value.trim();
  if (!token) {
    statusEl.textContent = "Enter a token";
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  client.connect(token);
});

playBtn.addEventListener("click", () => client.sendCommand("play"));
pauseBtn.addEventListener("click", () => client.sendCommand("pause"));
