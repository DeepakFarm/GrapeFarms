# Adding family members and farm workers

This starter includes shared farm membership, but does not include an invite-by-email screen yet. Use the steps below after each person creates an account through the app.

## 1. Find the new user's UUID

In Supabase Dashboard → Authentication → Users, copy the UUID for the family member or worker.

## 2. Find your farm UUID

Run:

```sql
select id, name, owner_id from public.farms;
```

## 3. Add membership

Replace the UUID values and select a role:

```sql
insert into public.farm_members (farm_id, user_id, role)
values (
  'YOUR_FARM_UUID',
  'MEMBER_USER_UUID',
  'worker'
);
```

Supported roles: `owner`, `manager`, `worker`.

## 4. Role permissions in this starter

- All members can read and add inventory, stock transactions, labour and miscellaneous expenses.
- Owner/manager membership is required to delete most records.
- The first account that creates the farm is the owner.
- For production use, add an admin-only invitation interface and decide whether workers should see wage and expense data. The current schema is a useful starter, not a full HR/payroll permission model.
