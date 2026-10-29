# FarmLedger — Farm Inventory & Expense Management

Bilingual (English/Marathi), responsive Next.js app for shared farm inventory and expense tracking.

## Features

- Email/password authentication via Supabase Auth
- Shared farm workspace and farm membership tables
- Pesticide spray and fertilizer drip item catalogues
- Purchases with quantity, unit price, supplier and automatic total cost
- Usage ledger with date, plot, purpose/target and dosage
- Automatic remaining stock calculation from purchase minus usage transactions
- Stock thresholds and low-stock alerts
- Multiple crops/plots with area and notes
- Labour tracking (workers × days × rate + extra costs)
- Miscellaneous expenses with category, payment method and optional plot
- Dashboard, expense breakdown and CSV exports
- English / Marathi UI toggle
- Supabase Row Level Security policies

## Important implementation notes

- This is a deployable starter app, not a live hosted URL.
- Shared records require a Supabase project and environment variables.
- The app does not contain a Supabase service-role key. Never expose one in browser code.
- The database uses `farm_members` for membership. A farm owner creates a workspace and is inserted as owner.
- To invite family members/workers, first have each person create an account, then add their user UUID to `farm_members` from Supabase SQL Editor. See `supabase/SHARING.md`.
- This starter grants all farm members the ability to insert records; delete permissions are restricted to owner/manager. If you need stricter permissions for workers, change policies and add UI role checks before production use.
- Usage is prevented in the UI when it exceeds stock. For high-concurrency teams, add a server-side transaction/RPC to enforce this atomically.
- Stock balances are derived from the transaction ledger; do not edit balance numbers directly.
- Costs are reported as purchase costs + labour costs + miscellaneous expenses. The app does not calculate crop profitability, depreciation, yield or remaining inventory valuation using FIFO/weighted average.
- CSV exports are UTF-8 with BOM for better Excel compatibility.

## Local development

Requirements: Node.js 20+ and a Supabase project.

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and anon/public key.
3. Run `supabase/schema.sql` in Supabase Dashboard → SQL Editor.
4. Install dependencies and start:

   ```bash
   npm install
   npm run dev
   ```

5. Open http://localhost:3000.

## Deploy to Vercel

1. Create a GitHub repository and upload these project files.
2. In Vercel, choose **Add New → Project**, import that repository.
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. The app will build with `npm run build`.
5. In Supabase → Authentication → URL Configuration, set the Site URL to your Vercel domain, for example `https://your-app.vercel.app`. Add the production URL to Redirect URLs.
6. Open the Vercel URL and create your account, then create your farm workspace.
7. For family/workers, ask them to sign up, then add their UUID to `farm_members` with a role using the SQL in `supabase/SHARING.md`.

## Security checklist before real farm use

- Keep Supabase RLS enabled; never use the service-role key in the browser.
- Use a strong password for every user; do not share one login across workers.
- Invite only trusted users. Current UI is not an invitation-management panel.
- Set email confirmation and password recovery policies in Supabase.
- Back up the database regularly.
- Test with two accounts to verify that members can only see the intended farm.
- Review worker permissions if staff should not see labour pay rates or all expenses.
