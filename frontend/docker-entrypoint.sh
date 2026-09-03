#!/bin/sh
# Runtime environment variable injection
# Writes a /usr/share/nginx/html/env-config.js that exposes env vars to the React app.
# This allows VITE_API_BASE_URL to be set as a container/deployment env var without rebuilding.

set -e

# Default to empty string if not set — the app will fall back to 'http://localhost:8080/api'
API_URL="${VITE_API_BASE_URL:-}"

cat > /usr/share/nginx/html/env-config.js <<EOF
// Auto-generated at container start — do not edit
window.__ENV__ = {
  VITE_API_BASE_URL: "${API_URL}"
};
EOF

echo "env-config.js written with VITE_API_BASE_URL=${API_URL}"

# Hand off to the CMD (nginx)
exec "$@"
