#!/usr/bin/env bash
# Netbook con VGA como pantalla principal (~1680×1050). Ejecutar en la netbook con DISPLAY=:0
set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if ! command -v xrandr >/dev/null 2>&1; then
  echo "xrandr no encontrado. Instalá x11-xserver-utils en Mint/XFCE."
  exit 1
fi

VGA=$(xrandr | grep -E " connected" | grep VGA | awk '{print $1}' | head -n1)
if [ -z "$VGA" ]; then
  VGA=$(xrandr | grep -E " connected" | awk '{print $1}' | head -n1)
fi

if [ -z "$VGA" ]; then
  echo "No se encontró salida de video conectada."
  exit 1
fi

echo "Usando salida: $VGA"
xrandr --output "$VGA" --primary --mode 1680x1050 2>/dev/null || \
  xrandr --output "$VGA" --primary --auto

echo "Display listo en $DISPLAY"
