import { RemoteClient } from "./remote-client.js";
import { formatTime, statusLabel, transportLabel } from "./booth-copy.js";

const tokenInput = document.querySelector<HTMLInputElement>("#token")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const jewel = document.querySelector<HTMLSpanElement>("#jewel")!;
const stateEl = document.querySelector<HTMLPreElement>("#state")!;
const transportBtn = document.querySelector<HTMLButtonElement>("#transport")!;
const skipAdBtn = document.querySelector<HTMLButtonElement>("#skip-ad")!;
const fullscreenBtn = document.querySelector<HTMLButtonElement>("#fullscreen")!;
const watchUrlInput = document.querySelector<HTMLInputElement>("#watch-url")!;
const openUrlBtn = document.querySelector<HTMLButtonElement>("#open-url")!;
const seekInput = document.querySelector<HTMLInputElement>("#seek")!;
const volumeInput = document.querySelector<HTMLInputElement>("#volume")!;
const timeNow = document.querySelector<HTMLParagraphElement>("#time-now")!;
const timeEnd = document.querySelector<HTMLParagraphElement>("#time-end")!;
const timeNote = document.querySelector<HTMLParagraphElement>("#time-note")!;
const titleEl = document.querySelector<HTMLParagraphElement>("#title")!;
const volumeLabel = document.querySelector<HTMLSpanElement>("#volume-label")!;
const well = document.querySelector<HTMLElement>("#well")!;

const TOKEN_KEY = "remote-control-token";
const saved = localStorage.getItem(TOKEN_KEY);
if (saved) {
  tokenInput.value = saved;
}

let seekDragging = false;
let playing = false;

function paintTime(current: number, duration: number): void {
  timeNow.textContent = formatTime(current);
  timeEnd.textContent = formatTime(duration);
}

function setJewel(state: "off" | "on" | "wait" | "error"): void {
  jewel.dataset.state = state;
}

function renderTransport(): void {
  transportBtn.textContent = transportLabel(client.connected, playing);
}

function setPlaybackControlsEnabled(
  connected: boolean,
  adPlaying = false,
  adSkippable = false,
): void {
  fullscreenBtn.disabled = !connected;
  seekInput.disabled = !connected || adPlaying;
  volumeInput.disabled = !connected;
  watchUrlInput.disabled = !connected;
  openUrlBtn.disabled = !connected;
  skipAdBtn.hidden = !connected || !adSkippable;
  well.classList.toggle("is-ad", adPlaying);
  renderTransport();
}

function showStatus(text: string, jewelState: "off" | "on" | "wait" | "error"): void {
  statusEl.textContent = statusLabel(text);
  setJewel(jewelState);
  renderTransport();
}

const client = new RemoteClient(undefined, {
  onStatus(text) {
    if (text === "Connecting…") showStatus(text, "wait");
    else if (text === "Connected") showStatus(text, "on");
    else if (text === "Connection error") showStatus(text, "error");
    else showStatus(text, "off");
    if (!client.connected) playing = false;
    setPlaybackControlsEnabled(client.connected);
  },
  onAck(ack) {
    if (!ack.ok && ack.error) {
      statusEl.textContent = ack.error;
      setJewel("error");
    }
  },
  onState(state) {
    stateEl.textContent = JSON.stringify(state, null, 2);
    playing = state.playing;
    titleEl.textContent = state.title.trim() || "Sin video";

    const duration = state.duration || 0;
    seekInput.max = String(duration);
    if (!seekDragging) {
      const current = Math.min(state.currentTime, duration);
      seekInput.value = String(current);
      paintTime(current, duration);
    }

    const notes = [
      state.buffering ? "En búfer" : "",
      state.adPlaying ? "Anuncio" : "",
    ].filter(Boolean);
    timeNote.textContent = notes.join(" · ");

    volumeInput.value = String(state.volume);
    volumeLabel.textContent = `${state.volume}%`;

    if (client.connected) {
      showStatus("Connected", "on");
      setPlaybackControlsEnabled(true, state.adPlaying, state.adSkippable);
    }
  },
});

function connect(): void {
  const token = tokenInput.value.trim();
  if (!token) {
    statusEl.textContent = "Falta el token";
    setJewel("error");
    tokenInput.focus();
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  client.connect(token);
}

transportBtn.addEventListener("click", () => {
  if (!client.connected) {
    connect();
    return;
  }
  client.sendCommand({ name: playing ? "pause" : "play" });
});

skipAdBtn.addEventListener("click", () => {
  client.sendCommand({ name: "skipAd" });
});

openUrlBtn.addEventListener("click", () => {
  const url = watchUrlInput.value.trim();
  if (!url) {
    statusEl.textContent = "Pegá una URL de YouTube";
    setJewel("error");
    return;
  }
  statusEl.textContent = "Abriendo en el TV…";
  client.sendCommand({ name: "openUrl", url });
});

watchUrlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") openUrlBtn.click();
});

fullscreenBtn.addEventListener("click", () => client.sendCommand({ name: "fullscreen" }));

seekInput.addEventListener("pointerdown", () => {
  seekDragging = true;
});

seekInput.addEventListener("input", () => {
  if (!seekDragging) return;
  paintTime(Number(seekInput.value), Number(seekInput.max));
});

function sendSeekFromSlider(): void {
  seekDragging = false;
  const seconds = Number(seekInput.value);
  const duration = Number(seekInput.max);
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) return;
  client.sendCommand({ name: "seek", seconds });
}

seekInput.addEventListener("change", () => {
  sendSeekFromSlider();
});

seekInput.addEventListener("pointerup", () => {
  seekDragging = false;
});

seekInput.addEventListener("pointercancel", () => {
  seekDragging = false;
});

volumeInput.addEventListener("input", () => {
  volumeLabel.textContent = `${volumeInput.value}%`;
});

volumeInput.addEventListener("change", () => {
  client.sendCommand({
    name: "setVolume",
    volume: Number(volumeInput.value),
  });
});
