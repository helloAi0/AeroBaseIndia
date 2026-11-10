#!/usr/bin/env bash
# One-time: block commits that contain secrets.
cd "$(git rev-parse --show-toplevel)"
printf '#!/usr/bin/env bash\nexec scripts/check-secrets.sh --staged\n' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
echo "pre-commit secret check installed."
