#!/usr/bin/env bash
# git pre-push hook — orquestador-sdd-tdd auto-release
# Install: cp scripts/pre-push-hook.sh .git/hooks/pre-push
set -e

ZERO="0000000000000000000000000000000000000000"

if [ "$2" != "refs/heads/main" ]; then exit 0; fi
if [ "$3" = "$ZERO" ]; then exit 0; fi

RANGE="$3..$4"
COMMITS=$(git log "$RANGE" --oneline 2>/dev/null | wc -l)
if [ "$COMMITS" -eq 0 ]; then exit 0; fi

LOG=$(git log "$RANGE" --format=%B)
BUMP="patch"
echo "$LOG" | grep -q "BREAKING CHANGE" || echo "$LOG" | grep -qE "^feat(\(.*\))?!:" && BUMP="major"
echo "$LOG" | grep -qE "^feat(\(.*\))?:" && [ "$BUMP" = "patch" ] && BUMP="minor"

cd "$(git rev-parse --show-toplevel)"
CURRENT=$(node -e "console.log(require('./package.json').version)")
MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)

case "$BUMP" in
  major) NEW="$((MAJOR+1)).0.0" ;;
  minor) NEW="${MAJOR}.$((MINOR+1)).0" ;;
  *)     NEW="${MAJOR}.${MINOR}.$((PATCH+1))" ;;
esac

node -e "
const pkg = require('./package.json');
pkg.version = '$NEW';
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

node -e "
const fs = require('fs');
let cl = fs.readFileSync('CHANGELOG.md', 'utf8');
const lines = require('child_process').execSync('git log $RANGE --oneline --no-decorate', {encoding:'utf8'}).trim();
cl = cl.replace(/(# Changelog\\n\\n)/, '\$1## $NEW\\n\\n### Commits\\n\\n' + lines + '\\n\\n');
fs.writeFileSync('CHANGELOG.md', cl);
"

git add package.json CHANGELOG.md
git commit -m "chore: release v$NEW" --allow-empty
git tag "v$NEW"
git push origin "v$NEW"
gh release create "v$NEW" --title "v$NEW" --notes "Auto-release by pre-push hook.

$(git log "$RANGE" --oneline --no-decorate)" 2>/dev/null || true

echo "=== Released v$NEW ==="
