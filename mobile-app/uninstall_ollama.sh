#!/bin/bash
# Script to uninstall Ollama completely

echo "Stopping and disabling ollama service..."
sudo systemctl stop ollama
sudo systemctl disable ollama

echo "Removing systemd service files..."
sudo rm -f /etc/systemd/system/ollama.service
sudo systemctl daemon-reload

echo "Removing ollama binary..."
OLLAMA_BIN=$(which ollama 2>/dev/null)
if [ -n "$OLLAMA_BIN" ]; then
    sudo rm -f "$OLLAMA_BIN"
fi
sudo rm -f /usr/local/bin/ollama
sudo rm -f /usr/bin/ollama

echo "Removing ollama files and directories..."
sudo rm -rf /usr/share/ollama
rm -rf ~/.ollama

echo "Removing ollama user and group..."
sudo userdel ollama 2>/dev/null
sudo groupdel ollama 2>/dev/null

echo "Ollama has been uninstalled successfully!"
