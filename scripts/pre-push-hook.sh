#!/usr/bin/env bash
# git pre-push hook — orquestador-sdd-tdd auto-release
# Install: cp scripts/pre-push-hook.sh .git/hooks/pre-push
set -e

ZERO="0000000000000000000000000000000000000000"
REMOTE="$1"
URL="$2"

# Read stdin for ref pairs: local_ref local_sha remote_ref remote_sha
while read LOCAL_REF LOCAL_SHA REMOTE_REF REMOTE_SHA; do
  if [ "$REMOTE_REF" != "refs/heads/main" ]; then
    continue
  fi

  if [ "$LOCAL_SHA" = "$ZERO" ]; then
    continue
  fi

  RANGE="$LOCAL_SHA...$REMOTE_SHA"
  if [ "$REMOTE_SHA" = "$ZERO" ]; then
    RANGE="${LOCAL_SHA}..HEAD"
  fi

  COMMITS=$(git log "$RANGE" --oneline 2>/dev/null | wc -l)
  if [ "$COMMITS" -eq 0 ]; then
    continue
  fi

  LOG=$(git log "$RANGE" --format=%B 2>/dev/null)

  BUMP="patch"
  if echo "$LOG" | grep -q "BREAKING CHANGE" || echo "$LOG" | grep -qE "^feat(\(.*\))?!:"; then
    BUMP="major"
  elif echo "$LOG" | grep -qE "^feat(\(.*\))?:"; then
    BUMP="minor"
  fi

  echo ""
  echo "=== Auto-release: bump type $BUMP ==="

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

  echo "v$CURRENT -> v$NEW"

  node -e "
    const pkg = require('./package.json');
    pkg.version = '$NEW';
    require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "

  node -e "
    const fs = require('fs');
    let cl = fs.readFileSync('CHANGELOG.md', 'utf8');
    const child = require('child_process');
    const lines = child.execSync('git log $RANGE --oneline --no-decorate', {encoding:'utf8'}).trim();
    const date = new Date().toISOString().slice(0, 10);
    cl = cl.replace(/(# Changelog\\n\\n)/, '\$1## $NEW - $date\\n\\n### Commits\\n\\n' + lines + '\\n\\n');
    fs.writeFileSync('CHANGELOG.md', cl);
  "

  git add package.json CHANGELOG.md
  git commit -m "chore: release v$NEW" --allow-empty
  git tag "v$NEW"
  git push origin "v$NEW"
  gh release create "v$NEW" --title "v$NEW" --notes "$(git log "$RANGE" --oneline --no-decorate)" 2>/dev/null || true

  echo "=== Released v$NEW ==="
done
