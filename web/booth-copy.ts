export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  "Connecting…": "Conectando…",
  Connected: "Conectado",
  Disconnected: "Desconectado",
  "Connection error": "Error de conexión",
};

export function statusLabel(text: string): string {
  return STATUS_LABELS[text] ?? text;
}

export function transportLabel(connected: boolean, playing: boolean): string {
  if (!connected) return "Conectar";
  return playing ? "Pause" : "Play";
}
