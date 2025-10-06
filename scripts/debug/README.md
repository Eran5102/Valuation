# Debug Scripts

This directory contains debugging and utility scripts used during development and troubleshooting.

## Authentication & User Management

- `setup-eran-user.js` - Creates the eran@value8.ai user
- `test-login.js` - Tests login functionality
- `verify-login.js` - Verifies login credentials
- `reset-password.js` - Resets user passwords

## Database Verification

- `verify-live-db.js` - Checks database connection and data
- `check-with-service-role.js` - Verifies data access with service role (bypasses RLS)
- `check-user-org.js` - Checks user organization membership
- `check-rls-policies.js` - Tests RLS policy effectiveness
- `check-triggers.js` - Verifies database triggers

## API Testing

- `test-api-direct.js` - Direct API endpoint testing
- `test-client-visibility.js` - Tests client visibility/RLS
- `test-service-client.js` - Tests service role client
- `test-field-mapping.js` - Verifies field mappings
- `test-organization-separation.js` - Tests org data isolation

## Data Management

- `apply-org-migration.js` - Applies organization schema migrations
- `run-migration.js` - General migration runner
- `debug-companies.js` - Debug company/client data

## Usage

All scripts use `.env.local` for configuration. Run them with:

```bash
node scripts/debug/script-name.js
```

Example:

```bash
node scripts/debug/check-with-service-role.js
```

## Important Notes

- These scripts are for **debugging only** - not for production use
- They require `.env.local` to be properly configured
- Some scripts use the service role key and bypass RLS
- Keep these scripts out of production deployments
