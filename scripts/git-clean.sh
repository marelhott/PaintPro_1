
#!/bin/bash

# git-clean.sh - Automatické čištění git lock souborů
# Použití: ./scripts/git-clean.sh nebo bash scripts/git-clean.sh

echo "🔍 Kontroluji git lock soubory..."

# Seznam všech možných lock souborů
LOCK_FILES=(
  ".git/index.lock"
  ".git/config.lock"
  ".git/HEAD.lock"
  ".git/refs/heads/main.lock"
  ".git/refs/heads/master.lock"
  ".git/COMMIT_EDITMSG.lock"
  ".git/MERGE_HEAD.lock"
  ".git/FETCH_HEAD.lock"
  ".git/packed-refs.lock"
)

CLEANED_COUNT=0

# Projdi všechny možné lock soubory
for lock_file in "${LOCK_FILES[@]}"; do
  if [ -f "$lock_file" ]; then
    echo "🧹 Odstraňuji: $lock_file"
    rm -f "$lock_file"
    CLEANED_COUNT=$((CLEANED_COUNT + 1))
  fi
done

# Kontrola dalších lock souborů s wildcard
if ls .git/refs/heads/*.lock 1> /dev/null 2>&1; then
  echo "🧹 Čistím lock soubory v refs/heads/"
  rm -f .git/refs/heads/*.lock
  CLEANED_COUNT=$((CLEANED_COUNT + 1))
fi

if ls .git/refs/remotes/*/*.lock 1> /dev/null 2>&1; then
  echo "🧹 Čistím lock soubory v refs/remotes/"
  rm -f .git/refs/remotes/*/*.lock
  CLEANED_COUNT=$((CLEANED_COUNT + 1))
fi

# Výsledek
if [ $CLEANED_COUNT -gt 0 ]; then
  echo "✅ Vyčištěno $CLEANED_COUNT git lock souborů"
  echo "🔓 Git je nyní odemknut a připraven k použití"
else
  echo "✅ Žádné git lock soubory nenalezeny - git je čistý"
fi

# Test git stavu
echo ""
echo "📊 Aktuální git status:"
git status --porcelain
