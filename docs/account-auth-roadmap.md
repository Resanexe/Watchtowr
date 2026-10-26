# Account authentication roadmap

Authentication is intentionally deferred until the database work. The live app currently uses its existing local guest/demo profile and keeps profiles, MyList, reviews, and preferences in browser storage. There are no sign-in or sign-up links in the navigation.

## Resume here for the account/database milestone

- Use the existing `@supabase/supabase-js` dependency and connect a Supabase project.
- Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (never commit real environment values).
- Add and allow the local and deployed `/auth/callback` URLs in Supabase Auth settings; configure email confirmation and password recovery emails.
- Rebuild the email/password flows: signup, sign-in, confirmation callback, sign-out, and password reset. Keep guest browsing available.
- Decide the account data model before enabling account UI. Migrate MyList, reviews, preferences, and profile metadata into user-scoped tables with row-level security; store profile pictures in Supabase Storage instead of browser-only data URLs.
- Preserve local guest activity and provide an intentional import/merge path when a guest creates an account. Do not silently replace a guest's local data.
- Use the supported Next.js/Supabase SSR integration for protected server routes and refreshed cookie sessions if server-side authorization is needed. Keep server credentials off the client.
- Restore an account entry in the navbar only after the project configuration and account flows are ready to use.

The earlier UI pass covered email/password forms, email confirmation, recovery, and a profile sign-out control, but it was removed from the live app because account signup is not a priority yet. No Supabase project credentials were configured, and no account or database data was created.
