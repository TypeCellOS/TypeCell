#!/bin/bash
# because we don't want to check in the secrets (even though they are staging)
# we have to source them from a local file for config.toml to work and then run the supabase command
# only necessary for local development, as github actions will have the secrets in env already
source .env.local
export TYPECELL_GOOGLE_OAUTH_SECRET
export TYPECELL_GITHUB_OAUTH_SECRET
npx supabase "$@"