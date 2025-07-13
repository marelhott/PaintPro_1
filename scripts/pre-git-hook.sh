
#!/bin/bash

# pre-git-hook.sh - Hook který se spustí před každým git příkazem
# Automaticky vyčistí lock soubory před git operací

echo "🔍 Pre-git kontrola..."

# Spusť git-clean skript
bash "$(dirname "$0")/git-clean.sh"

echo ""
echo "🚀 Git operace může pokračovat..."
