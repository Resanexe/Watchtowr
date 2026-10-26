# Watchtowr Product Requirements Document

**Prepared by:** Hossain MD Siam  
**Student ID:** 202409010735  
**Supervisor / Lecturer:** Jibril Mohamed Hassan  
**Version:** 1.3  
**Status:** Working draft for student and lecturer review  
**Last updated:** 23 October 2026

## 1. Executive summary

Watchtowr is a web application for discovering games, anime, movies, and television shows in one place. It combines cross-category browsing, search, metadata-based filters, title details, and a transparent recommendation score. The project aims to help people decide what to watch or play based on their interests, mood, available time, and discovery preferences.

The current application is a functional prototype built with Next.js, React, and TypeScript. It retrieves catalog data from AniList, TMDB, and RAWG through server-side code, with sample catalog data as a fallback. Preferences, MyList entries, ratings, reviews, and feedback are currently stored in the browser. The prototype does not yet provide real user registration, server-backed accounts, or shared cloud persistence; those remain development work before any production or multi-device claim.

This document defines the product goal, users, requirements, acceptance criteria, implementation phases, and evaluation plan. API availability, provider terms, user research, and academic evaluation targets must be confirmed during development with the supervisor.

## 2. Product overview

### 2.1 Problem statement

Entertainment catalogs are spread across different services and product categories. People can spend substantial time comparing options or may not find suitable choices when they have a specific mood, rating threshold, or limited free time. Watchtowr provides a unified discovery experience and filters results using metadata that is actually available.

### 2.2 Product vision

Give users one convenient place to discover entertainment across four categories, balancing familiar interests with useful new suggestions.

### 2.3 Product principles

- Make browsing useful before sign-in.
- Explain recommendations in terms of signals the system actually has.
- Treat missing metadata as unknown; never imply a title meets a strict filter when its value is unknown.
- Keep recommendation behavior understandable and adjustable.
- Describe prototype behavior honestly and avoid presenting local browser data as secure account storage.

### 2.4 Target users

**Primary audience:** young adults aged 15–30, subject to confirmation with the supervisor and any research ethics requirements.

**Primary device:** desktop and laptop browsers. Responsive mobile-browser support is desirable, but desktop usability is the first implementation priority.

| User type | Needs | Access |
| --- | --- | --- |
| Guest | Browse and search titles, explore categories, apply filters, view details, and see general suggestions | No account required; personal actions in the prototype are device-local and should be clearly described |
| Returning user | Find relevant titles based on preferences and past actions | In the prototype, data is stored locally in the browser; production accounts and cross-device sync are future work |
| Project evaluator | Verify requirements, behavior, and limitations | Demonstration data, documented acceptance criteria, and test evidence |

## 3. Goals and success measures

### 3.1 Product goals

1. Bring games, anime, movies, and TV shows into one discovery experience.
2. Support a mixed For You feed and dedicated category pages.
3. Let users narrow results with relevant filters, including strict time limits when reliable time metadata exists.
4. Rank suggestions using explicit preferences and available interactions.
5. Provide a working prototype for project demonstration and structured evaluation.
6. Establish a path from device-local prototype behavior to secure, persistent accounts if time and project scope permit.

### 3.2 Success measures

| Measure | How it will be evaluated | Target |
| --- | --- | --- |
| Core task completion | Participants complete browse, search, filter, open details, and save/rate tasks | Set after pilot testing and supervisor agreement |
| Filter correctness | Compare results with known test records, especially strict time and category filters | No known false matches for filters with required metadata |
| Recommendation adaptation | Change preferences or feedback and observe ranking changes | Ranking responds predictably to documented signals |
| Cold-start behavior | Evaluate guest and new-user feeds with no interaction history | Feed is populated and usable |
| Perceived relevance | Ask participants to rate usefulness of recommendations | Set after choosing a study method and sample |
| Usability | Observe completion issues and gather brief user feedback | Set after pilot testing |
| Resilience | Simulate missing data or unavailable providers | Useful fallback or clear empty/error state, never a broken page |

Numeric targets, sample size, and study method require supervisor approval. Do not report a measure as achieved without recorded evidence.

## 4. Scope

### 4.1 Initial product scope

- A mixed homepage feed for all four categories.
- Dedicated Games, Anime, Movies, and TV Shows browsing pages.
- Search across titles and within categories.
- Title details and similar-title suggestions where data supports them.
- Category-relevant filters, sorting, and general discovery lists.
- Saved preferences and an explainable scoring-based recommendation prototype.
- MyList statuses, ratings, written reviews, and recommendation feedback in the prototype.
- API-backed catalog data with a sample-data fallback.
- Clear states for loading, no results, incomplete metadata, and provider failures.
- Desktop-first interface with responsive behavior where feasible.

### 4.2 Future or conditional scope

- Real registration, authentication, and server-backed profiles.
- Cloud persistence and cross-device synchronization.
- Server-authorized ownership checks for user-generated content.
- Account deletion and recommendation-history reset against persistent records.
- More detailed provider coverage, cached catalog data, and richer filter metadata.
- Mobile usability improvements and accessibility refinements.

These items must be assessed against project time, academic requirements, provider rules, and technical feasibility.

### 4.3 Out of scope for the initial version

- Native Android or iOS applications.
- A trained machine-learning recommendation model.
- Social networking, review replies, or public user profiles.
- Streaming, purchasing, or game-launch functionality.
- Guarantees that every external provider field is complete or current.

## 5. Product behavior and user journeys

### 5.1 Guest discovery

Open Watchtowr → browse the mixed feed or choose a category → search or apply filters → open a title → optionally save a preference or list item locally in the prototype.

### 5.2 Personalized discovery prototype

Set preferences → view ranked titles → add a title to MyList or rate it → provide negative feedback → revisit recommendations and observe the documented scoring behavior.

### 5.3 Target account journey

Register or sign in → set preferences → browse personalized suggestions → save titles and reviews → return on another device and retrieve the same data. This journey is not complete until a real authentication and persistent data service is implemented.

### 5.4 MyList and review journey

Open a title → choose Want to try, In progress, Completed, or Dropped → optionally rate from one to five stars and write a review → update or delete the user's own review. In the current prototype these actions are browser-local.

## 6. Functional requirements

Priority meanings: **Must** is needed for the assessed core product; **Should** is important if feasible; **Could** is optional. Status describes the current prototype, not a promise of production readiness.

| ID | Requirement | Priority | Current prototype status |
| --- | --- | --- | --- |
| FR-001 | Visitors can browse categories and title details without an account. | Must | Implemented |
| FR-002 | Users can search across titles and within a selected category. | Must | Partially implemented; category discovery searches provider pages on the server and supports loading more matches, but results remain limited to provider coverage and pagination |
| FR-003 | The homepage presents a mixed feed across the four categories. | Must | Implemented |
| FR-004 | Guests receive general suggestions when personalized history is unavailable. | Must | Implemented with provider feeds and sample fallback |
| FR-005 | Separate browsing views exist for Games, Anime, Movies, and TV Shows. | Must | Implemented |
| FR-006 | Users can combine relevant filters supported by the selected category and available metadata. | Must | Partially implemented; server-side discovery filtering and provider genre/tag matching are in progress; coverage still depends on provider metadata |
| FR-007 | A strict time filter excludes items with unknown time data and items exceeding the selected limit. | Must | Implemented for available per-item runtime or estimated game time |
| FR-008 | Users can edit recommendation preferences, including categories, genres, moods, minimum rating, time, and discovery level. | Must | Partially implemented; available controls should be checked against this complete list |
| FR-009 | Users can register, sign in, and sign out securely. | Must for account release | Not implemented; the current user switch is a local demo state |
| FR-010 | Recommendations combine preferences, ratings, MyList behavior, and negative feedback using documented scoring rules. | Must | A client-side scoring prototype exists in `src/lib/recommendation-engine.ts`; scoring quality and signal behavior still need systematic evaluation |
| FR-011 | Guests and new users receive useful cold-start suggestions. | Must | Implemented |
| FR-012 | Recommendation explanations refer only to signals that support the explanation. | Should | Implemented in the scoring prototype; verify against UI and actual data |
| FR-013 | Users can mark a title Not Interested or Show Me Less Like This. | Must | Implemented with browser-local storage |
| FR-014 | Users can add titles to MyList and set one of four statuses. | Must | Implemented with browser-local storage |
| FR-015 | Users can give a title a one-to-five-star rating and update it later. | Must | Implemented with browser-local storage |
| FR-016 | Users can create, edit, and delete their own written review. | Must | Prototype supports local review editing/deletion; server ownership controls are not implemented |
| FR-017 | Title pages show similar suggestions when supported data is available. | Should | Partially implemented; based on available local/provider data |
| FR-018 | Trending and popular lists use provider-supported data or a documented fallback. | Should | Implemented in prototype; fallback uses sample catalog |
| FR-019 | External provider metadata is normalized and missing fields are handled gracefully. | Must | Implemented for current integrations; provider field coverage remains a feasibility concern |
| FR-020 | Provider failures or missing metadata do not cause a confusing blank page. | Must | Implemented with sample-data fallback for supported catalog views |
| FR-021 | Users can review and update their saved recommendation preferences. | Must | Implemented locally |
| FR-022 | Users can reset recommendation signals without unintentionally deleting unrelated list/review data. | Must | Implemented for local prototype data; persistent-account behavior is future work |
| FR-023 | A user can delete an account and associated personal data. | Must for account release | Not implemented as a real account feature; local data purge is not account deletion |
| FR-024 | Core flows work in supported desktop and laptop browsers. | Must | Implemented; formal browser and viewport evaluation remains |
| FR-025 | The interface communicates loading, empty, missing-data, and provider-error states. | Must | Implemented in key views; confirm coverage during evaluation |
| FR-026 | Private provider credentials are kept server-side and are not exposed in browser bundles. | Must | Implemented for current TMDB/RAWG integration; keys must be configured in local environment |
| FR-027 | Users can identify that the current prototype's saved data is local to the browser. | Must | Documentation requirement; verify product UI communicates this clearly |

### 6.1 Filter catalogue

Filters should be shown only where relevant and supported by useful metadata. Missing data must not be represented as a match.

| Category | Candidate filters |
| --- | --- |
| Shared | Genre, preset mood, external rating, release year/date, language where available |
| Games | Platform, estimated completion time, player mode, perspective, art style, difficulty where available |
| Anime | Episode count, per-episode runtime, calculated total watch time where reliable, series status, animation style |
| Movies | Runtime, release date/year, external rating, language, animation/live action, visual style, franchise where supported |
| TV Shows | Seasons, episodes, per-episode runtime, calculated total watch time where reliable, series status, language, animation style |

Numeric filters should support sensible minimum/maximum controls when there is reliable data. A combined filter should return only records satisfying all selected constraints. A strict time filter must exclude unknown required durations.

## 7. Recommendation system

### 7.1 Initial approach

Use a transparent scoring system rather than a trained model. Apply hard filters first, then rank the remaining titles using preference and interaction signals. Keep the scoring rules documented and testable.

### 7.2 Candidate signals

- Explicit preferences: categories, preferred and disliked genres, moods, minimum rating, available time, discovery level.
- Ratings: strong positive and negative ratings can inform genre preferences.
- MyList status: Want to try, In progress, Completed, and Dropped have different meanings and should not be treated as equally positive.
- Feedback: Not Interested excludes the item; Show Me Less Like This reduces similar-genre recommendations.
- Metadata: category, genre, external rating, release year, runtime or game playtime, platform, and tags where available.

### 7.3 Rules and safeguards

1. Apply category, search, and strict metadata filters before ranking.
2. Unknown duration never passes a strict time filter.
3. Saving a title does not automatically mean it is a favorite.
4. Opening a detail page is not evidence of a preference.
5. A title marked Not Interested is omitted from later candidate lists where the feedback is available.
6. Cold-start users receive general suggestions rather than an empty feed.
7. Discovery level may increase variety but must not bypass hard user filters.
8. Explanations must map to real scoring signals.
9. The system should avoid repeating titles already completed when there are sufficient alternatives.
10. Scoring weights and diversity behavior are provisional until evaluated with test cases and users.

## 8. Data and integrations

### 8.1 Current prototype architecture

- **Application:** Next.js App Router, React, TypeScript, and Tailwind CSS.
- **Catalog access:** a server-side catalog route calls provider adapters and returns normalized title data to the client.
- **Providers:** AniList for anime; TMDB for movies and TV; RAWG for games. Provider access, terms, rate limits, attribution, and permitted caching must be checked before wider release.
- **Fallback:** a local sample catalog supports browsing when provider data is unavailable.
- **User data:** localStorage currently holds demo session state, preferences, MyList, ratings/reviews, and feedback.
- **Persistent backend:** no production authentication or database persistence is currently implemented. Supabase/PostgreSQL may be evaluated, but is not a confirmed or deployed dependency for user data.

### 8.2 Catalog fields

Expected normalized fields include title, category, description, artwork, release date/year, genres, external rating and vote count, language, runtime or game completion estimate, platform, status, and related titles when available.

### 8.3 User data

Future account-backed records may include account identifiers, preferences, list entries, ratings, reviews, feedback, and timestamps. Define retention, export, reset, and deletion behavior before storing these records on a server.

### 8.4 Provider requirements

Before relying on a provider field, verify its current documentation for coverage, rate limits, attribution, academic or commercial use restrictions, key requirements, and caching policy. Specifically test game completion time, runtime, episode counts, mood, art style, platform, and similarity data. Use only private server environment variables for secret keys; do not commit `.env.local` or expose secrets in client code.

## 9. Non-functional requirements

### 9.1 Security and privacy

- Keep provider secrets on the server.
- A future account system must authenticate requests and authorize access to the caller's records.
- Validate and constrain user input on both client and server.
- Collect only information needed for product features and explain how it is used.
- Define retention, deletion, and backup behavior before launch.
- Do not describe localStorage data as secure, backed up, or synced.

### 9.2 Usability and accessibility

- Keep primary navigation and category names consistent.
- Make filters understandable, combinable, and easy to clear.
- Provide useful loading, no-results, and error states.
- Support keyboard navigation and visible focus for core controls.
- Use readable contrast, labels, and meaningful image alternatives.
- Prioritize desktop/laptop screens, while maintaining usable smaller layouts where feasible.

### 9.3 Performance and reliability

- Avoid unnecessary provider requests and respect rate limits.
- Set performance targets after a baseline on the intended demo environment.
- Handle slow providers, missing fields, and request failures without crashing the whole experience.
- Consider caching only where provider terms permit.

### 9.4 Maintainability and compatibility

- Keep provider adapters, normalized types, recommendation scoring, storage, and UI concerns separated.
- Document environment setup and provider limitations.
- Target current mainstream desktop browsers; confirm exact support matrix for evaluation.

## 10. Development phases

Phases are ordered by dependency, not calendar dates. Adjust them after supervisor feedback and provider feasibility work.

### 10.1 Current project checkpoint

- The web prototype and provider integrations for TMDB, AniList, and RAWG are in place, with sample data as a fallback.
- Catalog discovery and filtering are the current active work: the working copy is adding server-side filtering across provider pages, cursor-based loading, and matching against provider-specific genre names and tags. This work is not considered complete until the category filters are checked against live data and empty-result behavior is clear.
- The recommendation engine already has a scoring prototype. Improving and evaluating this algorithm is the next major product priority once the discovery/filtering flow is stable.
- The initial web MVP should be guest-accessible and usable without accounts. MyList and preference data can remain browser-local for that MVP if the UI clearly says it is local and unsynchronized. Real accounts, cloud sync, and mobile apps are later decisions, not prerequisites for proving the core web experience.

### 10.2 Route from the current prototype to a web MVP

Use this sequence as the practical work plan. Each step has a deliverable and a completion check; do not move a feature to “done” based only on implementation.

| Step | Work | Deliverable | Completion check |
| --- | --- | --- | --- |
| 1. Stabilize discovery | Finish provider-page search/loading; verify each category's genre labels, tags, combined filters, sorting, pagination, and no-match/continue-search states. | Reliable category discovery across available provider data | Representative filters return matching live records; unsupported or missing metadata is explained; loading more does not skip or duplicate records |
| 2. Make recommendations the core differentiator | Write down scoring inputs and weights; verify preference, rating, MyList, and feedback signals; fix cold-start and repetition behavior; make explanations trace to real score contributions. | Documented, explainable recommendation behavior | Example user profiles produce sensible, different rankings; hard filters remain hard; each explanation can be tied to a score signal |
| 3. Complete the guest web journey | Review homepage, category pages, title details, preferences, MyList, reviews, responsive desktop layouts, and local-data disclosure; fix confusing or broken paths. | A complete guest-facing web MVP | A new visitor can discover, inspect, save, and revisit titles without sign-in, and understands which data is only stored in their browser |
| 4. Prepare the web release | Confirm provider terms/attribution, environment variables, hosting/build setup, error handling, performance baseline, supported browsers, accessibility basics, and privacy text. | Release configuration and a launch checklist | A clean deployment can use server-only keys, withstand provider failure, and pass the agreed core-flow checks |
| 5. Deploy and evaluate | Deploy the web MVP; walk through the core tasks on the hosted site; collect agreed user feedback and record defects before calling it ready. | Hosted demo/release and evaluation notes | Core tasks work in the deployed environment, high-severity defects are fixed or disclosed, and evaluation claims have recorded evidence |
| 6. Decide on accounts and expansion | Review project time and supervisor requirements; if approved, design real auth, database persistence, ownership controls, migration, and deletion. Consider mobile work only after the web goal is met. | Explicitly scoped next release | Either the account phase has an approved implementation plan or the MVP clearly remains guest/local-data only |

### Phase 0 — Confirm requirements and data feasibility

**Work:** review this PRD with the supervisor; decide the evaluation method; verify provider terms, fields, rate limits, and key handling; identify supported browsers and project constraints.

**Deliverables:** approved scope, provider/field matrix, initial risk list, and measurable evaluation plan.

**Exit criteria:** no core requirement depends on an unverified field without a fallback or documented limitation.

### Phase 1 — Application foundation and catalog browsing

**Work:** establish the app structure, shared media types, server-side provider adapters, category routes, title cards/details, and sample-data fallback.

**Deliverables:** a working browse experience for all four categories, clear loading/error/empty states, and documented local setup.

**Exit criteria:** guests can open each category and details; provider failure does not blank the app; private keys remain server-side.

### Phase 2 — Search, filters, and discovery experience

**Work:** add global/category search, genre and mood filters, category-specific metadata filters, strict time filtering, sorting, and mixed discovery feed.

**Deliverables:** usable For You and category discovery flows plus filter behavior documentation.

**Exit criteria:** test records prove category isolation, combined-filter behavior, and exclusion of unknown/too-long items from strict time results.

### Phase 3 — Preference-based recommendations

**Work:** implement preference controls, cold-start behavior, scoring rules, recommendation explanations, and discovery-level variation.

**Deliverables:** documented scoring formula, example scenarios, and recommendation tests/evaluation cases.

**Exit criteria:** controlled preference changes produce explainable ranking changes without bypassing hard filters.

### Phase 4 — Personal activity prototype

**Work:** complete local MyList statuses, ratings, reviews, feedback, reset behavior, and UI disclosures that the data is browser-local.

**Deliverables:** end-to-end demo flows and a clear prototype limitation statement.

**Exit criteria:** actions persist across reloads in the same browser; reset and data removal affect only the intended records; no feature implies cross-device sync.

### Phase 5 — Account and persistent storage decision

**Work:** if accounts are within approved scope, choose and configure authentication/database; define schema and access policies; migrate user actions from local-only to authorized persistent records; implement deletion/reset behavior.

**Deliverables:** approved backend design, secure auth flows, access-control rules, migration approach, and privacy copy.

**Exit criteria:** users can access only their own records, data persists across sessions/devices, and reset/deletion behavior is verified. If this phase is deferred, label account requirements as future work in the demo and submission.

### Phase 6 — Quality, evaluation, and release preparation

**Work:** perform functional, filter, recommendation, resilience, accessibility, and browser checks; conduct user evaluation; fix high-severity issues; prepare hosting configuration, demonstration, and report evidence.

**Deliverables:** test/evaluation results, known-limitations list, deployment checklist, hosted demo/release, and project demonstration materials.

**Exit criteria:** all Must requirements included in the assessed release have evidence; the deployed web experience completes the agreed core flows; unresolved scope is disclosed; supervisor agrees the submission is ready.

## 11. Verification and evaluation plan

- **Functional checks:** browse, search, category routes, title details, preferences, MyList statuses, ratings, reviews, and feedback.
- **Filter checks:** known metadata fixtures, combined filters, boundary values, missing metadata, and strict time exclusion.
- **Recommendation checks:** cold start, preference updates, positive/negative ratings, list statuses, negative feedback, and discovery level.
- **Resilience checks:** unavailable provider, rate-limit response, malformed/missing fields, empty result page, and sample fallback.
- **Security checks for future accounts:** unauthenticated access, cross-user record access, review ownership, secret exposure, reset, and deletion.
- **Usability evaluation:** representative participants complete a set of discovery tasks; record completion, confusion points, and usefulness ratings under the approved study method.
- **Compatibility checks:** agreed desktop browser/viewport matrix and core responsive layouts.

Record expected result, actual result, build/version, and issue severity for each evaluation. Establish numeric thresholds with the supervisor before claiming success.

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Required metadata is unavailable or inconsistent | Filters and recommendation explanations may be inaccurate | Verify fields early; mark missing values unknown; hide unsupported filters or use a documented manual mapping |
| Provider outage, rate limit, or terms change | Catalog can become stale or unavailable | Use allowed caching, limit calls, show sample fallback, and review terms before release |
| Scope exceeds project time | Core flows or evaluation may remain incomplete | Prioritize catalog, filters, and scoring; stage account features as conditional work |
| Browser storage is mistaken for account persistence | Users may assume data syncs or is backed up | Display prototype limitation and avoid production/account claims until backend work is complete |
| Recommendation signals are too weak or biased | Suggestions feel repetitive or irrelevant | Keep scoring transparent, allow feedback, test varied profiles, and tune using evaluation evidence |
| User data is exposed in a future backend | Privacy and trust impact | Use established auth, server-side authorization, least privilege, and ownership tests |
| External rating scales differ | Rating filters may compare unlike values | Normalize to a documented scale and preserve source/vote context where possible |
| Mood/style tags lack provider support | Mood filters may be inconsistent | Define a controlled tagging approach and assess the manual effort before committing |
| Evaluation sample or success criteria are unclear | Results may not support project conclusions | Agree research questions, sample, and thresholds with the supervisor before testing |

## 13. Assumptions and open decisions

- The primary audience and age range need supervisor confirmation.
- Desktop/laptop use is the first implementation priority.
- Guests can use core browsing without registration.
- Provider integration currently exists in prototype form; usage rights and metadata coverage still require confirmation.
- External ratings are normalized to a five-point scale in the application; exact provider mapping should be documented.
- Mood and art/animation styles may require curated tags if provider metadata is unavailable.
- Strict time filtering depends on reliable duration estimates; unknown values are excluded.
- Recommendation weights, diversity behavior, and any signal decay remain subject to evaluation.
- Real authentication, database choice, user data retention, and account deletion are open implementation decisions.
- Performance targets, supported browser matrix, research sample size, and faculty documentation requirements need agreement.
- The schedule and phase dates depend on the academic timeline and supervisor review.

## 14. Proposed implementation priority

1. **Finish catalog discovery:** provider-wide paginated search, genre/tag correctness, combined filters, sorting, and useful empty/loading states.
2. **Improve the recommendation algorithm:** make this the main product differentiator; document and tune scoring, cold-start, feedback, diversity, and explanations.
3. **Complete the guest web experience:** homepage, category browsing, title details, preferences, and local MyList/reviews with clear browser-local data disclosure.
4. **Harden and deploy the web MVP:** provider terms, secret configuration, failure handling, accessibility/browser checks, hosting, and deployed core-flow verification.
5. **Evaluate and iterate:** use recorded task results and user feedback to fix the highest-impact issues and support project claims.
6. **Defer or plan accounts/mobile:** add server-backed accounts only if required and approved; start mobile work after the website goal is met.

## 15. Glossary

- **Catalog item:** a normalized movie, TV show, anime, or game record.
- **Cold start:** a user has no or too little interaction history for personal ranking.
- **Strict time filter:** a hard limit that excludes items whose known duration exceeds the limit and items whose required duration is unknown.
- **MyList:** a user's saved titles and progress statuses.
- **Fallback catalog:** local sample records used when live provider data is unavailable.
- **Prototype-local data:** browser storage that is not authenticated, backed up, or synchronized between devices.

## 16. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.1 | 2026-10-18 | Source draft supplied for conversion |
| 1.2 | 2026-10-23 | Converted to Markdown; clarified prototype status; added development phases, acceptance criteria, evaluation, security/privacy, and risks |
| 1.3 | 2026-10-23 | Updated discovery and recommendation status; added a current checkpoint and ordered route from the working prototype to a deployed web MVP, with accounts/mobile staged afterward |
