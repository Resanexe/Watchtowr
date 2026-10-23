# WATCHTOWR — Unified Entertainment Discovery Platform

> **Academic Project Submission & Demonstration**  
> **Prepared by:** Hossain MD Siam (Student ID: 202409010735)  
> **Supervisor / Lecturer:** JIBRIL MOHAMED HASSAN  
> **Specification:** Product Requirements Document (PRD) Draft 1.1

---

## 1. Project Overview

**Watchtowr** is a web-based entertainment discovery platform that integrates **Games, Anime, Movies, and TV Shows** into a single cohesive interface. It solves catalog fragmentation across different streaming and gaming ecosystems by combining:
1. **Unified Cross-Category Browsing**: One For You feed bringing together top releases and hidden gems across all four categories.
2. **Deep Category-Specific Filters**: Filters specifically tailored for games (platforms, estimated playtime, perspectives), anime & TV shows (episode counts, episode duration, series status), and movies.
3. **Strict Available Time Constraint (FR-007)**: Excludes any media exceeding a chosen time limit (or lacking verified runtime data).
4. **Transparent Scoring-Based Recommendation Engine (FR-010)**: An auditable hybrid algorithm weighing explicit preferences, ratings, MyList activity, and negative feedback.
5. **Explainability Badges (FR-012)**: Shows users why a title was recommended (e.g. *"Matches your Mind-Bending Sci-Fi preference"* or *"Fits within your 30m window"*).
6. **Dual Guest & Registered User Experience**: Instant guest browsing with trending fallbacks, alongside persistent profiles, 5-star ratings, written reviews, MyList organization, and GDPR-compliant privacy controls.

---

## 2. Architecture & External API Integration

- **Framework**: Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons)
- **External Data Providers**:
  - **AniList API (GraphQL)**: Zero-key public GraphQL query for real-time trending anime and episode metadata.
  - **TMDB API (Movies & TV Shows)**: Integrated connector with rich offline cache fallback.
  - **RAWG API (Games)**: Video games database connector with platform and playtime tracking.
- **Data Persistence**:
  - LocalStorage immediate persistence for testing without remote database setup.
  - Supabase/PostgreSQL ready schema (`profiles`, `user_preferences`, `my_list`, `reviews`, `feedback`).

---

## 3. How to Run the Project

### Prerequisites
- Node.js v20+ and npm installed.

### Installation & Launch
```bash
# 1. Navigate to the project directory
cd watchtowr

# 2. (Optional) Add private provider keys to .env.local
# TMDB_API_KEY=...
# RAWG_API_KEY=...
# These are only read by the server-side catalog route; leave them unset to use offline sample data.

# 3. Run the development server
npm run dev

# 4. Open in your browser
# http://localhost:3000
```

### Running Automated PRD Verification Tests
To run the automated test suite verifying all PRD requirements (Cold start, Strict available time filtering, Category isolation, Negative feedback, and Scoring adaptation):
```bash
npm run test:recommendations
```

---

## 4. Key Functional Requirements Matrix

| Requirement | PRD Code | Status | Verification |
| :--- | :--- | :--- | :--- |
| **Guest Browsing** | FR-001 | ✅ Implemented | Browse catalog, search, and filter without authentication |
| **Search (Global & Category)** | FR-002 | ✅ Implemented | Instant search filtering title, synopsis, creator, and genres |
| **For You Mixed Feed** | FR-003 | ✅ Implemented | Homepage balances titles from Games, Anime, Movies, and TV |
| **Guest Recommendations** | FR-004 | ✅ Implemented | Popular and trending items with neutral scoring weights |
| **Category Pages** | FR-005 | ✅ Implemented | `/games`, `/anime`, `/movies`, `/tv` dedicated routing |
| **Extensive Filters & Moods**| FR-006 | ✅ Implemented | 7 preset moods, platforms, series status, rating sliders |
| **Strict Time Constraints** | FR-007 | ✅ Implemented | Excludes titles without time data or exceeding user limit |
| **Customize Recommendations**| FR-008 | ✅ Implemented | Interactive modal to adjust genres, moods, and discovery level |
| **Hybrid Recommendations** | FR-010 | ✅ Implemented | Multi-factor transparent scoring formula |
| **Cold-Start Handling** | FR-011 | ✅ Implemented | Safe default fallback for guests and empty interaction histories |
| **Explanations** | FR-012 | ✅ Implemented | Badges attached to each title explaining recommendation cause |
| **Negative Feedback** | FR-013 | ✅ Implemented | "Not Interested" and "Show Me Less Like This" buttons |
| **MyList Organization** | FR-014 | ✅ Implemented | Want to try, In progress, Completed, and Dropped statuses |
| **Ratings (1-5 Stars)** | FR-015 | ✅ Implemented | Interactive star ratings persisted to profile |
| **Written Reviews** | FR-016 | ✅ Implemented | Create, edit, and delete personal written reviews |
| **Similar Titles** | FR-017 | ✅ Implemented | Related title recommendations shown in detail view |
| **API Resilience / Fallback** | FR-020 | ✅ Implemented | Seed catalog ensures no blank screen if APIs fail |
| **Reset Recommendation History**| FR-022 | ✅ Implemented | Clears negative signals without deleting reviews or MyList |
| **Account & Data Deletion** | FR-023 | ✅ Implemented | Full purge of user records and cached preferences |

---

## 5. Contact and Academic Details
- **Student Name**: Hossain MD Siam
- **Student ID**: 202409010735
- **Supervisor / Lecturer**: Jibril Mohamed Hassan
