# Supabase migration

## Apply compatibility migration

Run the SQL migration in the Supabase SQL Editor or through the Supabase CLI:

```sql
-- Execute:
-- supabase/migrations/202611190001_supabase_role_access.sql
```

The migration:

- Adds `users.auth_user_id`.
- Links public users to `auth.users`.
- Adds role and data validation constraints.
- Adds uniqueness constraints and indexes.
- Enables RLS and creates role-based policies.

Do not expose the service-role key in the frontend.

## Password migration

Keep `users.password_hash` until Supabase Auth accounts are created for every existing
public user.

For each existing account:

1. Create or invite the account in Supabase Auth.
2. Update `users.auth_user_id` with the matching `auth.users.id`.
3. Set the account password through Supabase Auth, invitation, or password reset.
4. Verify login and role lookup.
5. Verify no active account has a null `auth_user_id`.
6. Drop `users.password_hash`.

Do not try to decrypt or reuse legacy password hashes inside ReactJS.
