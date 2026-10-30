import { RemoteClient } from "./remote-client.js";

const tokenInput = document.querySelector<HTMLInputElement>("#token")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const stateEl = document.querySelector<HTMLPreElement>("#state")!;
const connectBtn = document.querySelector<HTMLButtonElement>("#connect")!;
const playBtn = document.querySelector<HTMLButtonElement>("#play")!;
const pauseBtn = document.querySelector<HTMLButtonElement>("#pause")!;
const fullscreenBtn = document.querySelector<HTMLButtonElement>("#fullscreen")!;
const seekInput = document.querySelector<HTMLInputElement>("#seek")!;
const volumeInput = document.querySelector<HTMLInputElement>("#volume")!;
const timeLabel = document.querySelector<HTMLSpanElement>("#time-label")!;
const volumeLabel = document.querySelector<HTMLSpanElement>("#volume-label")!;

const TOKEN_KEY = "remote-control-token";
const saved = localStorage.getItem(TOKEN_KEY);
if (saved) {
  tokenInput.value = saved;
}

let seekDragging = false;

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function setPlaybackControlsEnabled(connected: boolean): void {
  playBtn.disabled = !connected;
  pauseBtn.disabled = !connected;
  fullscreenBtn.disabled = !connected;
  seekInput.disabled = !connected;
  volumeInput.disabled = !connected;
}

const client = new RemoteClient(undefined, {
  onStatus(text) {
    statusEl.textContent = text;
    setPlaybackControlsEnabled(client.connected);
  },
  onState(state) {
    stateEl.textContent = JSON.stringify(state, null, 2);

    const duration = state.duration || 0;
    seekInput.max = String(duration);
    if (!seekDragging) {
      seekInput.value = String(Math.min(state.currentTime, duration));
    }
    const buf = state.buffering ? " · buffering" : "";
    timeLabel.textContent = `${formatTime(state.currentTime)} / ${formatTime(duration)}${buf}`;

    volumeInput.value = String(state.volume);
    volumeLabel.textContent = `${state.volume}%`;

    if (client.connected) {
      setPlaybackControlsEnabled(true);
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

playBtn.addEventListener("click", () => client.sendCommand({ name: "play" }));
pauseBtn.addEventListener("click", () => client.sendCommand({ name: "pause" }));
fullscreenBtn.addEventListener("click", () =>
  client.sendCommand({ name: "fullscreen" }),
);

seekInput.addEventListener("pointerdown", () => {
  seekDragging = true;
});
seekInput.addEventListener("pointerup", () => {
  seekDragging = false;
});
function sendSeekFromSlider(): void {
  seekDragging = false;
  const seconds = Number(seekInput.value);
  const duration = Number(seekInput.max);
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) {
    return;
  }
  client.sendCommand({ name: "seek", seconds });
}

seekInput.addEventListener("change", () => {
  sendSeekFromSlider();
});

volumeInput.addEventListener("change", () => {
  client.sendCommand({
    name: "setVolume",
    volume: Number(volumeInput.value),
  });
});
