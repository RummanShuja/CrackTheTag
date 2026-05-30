# CrackTheTag

> Chrome extension that unlocks LeetCode company tags and adds priority labels (High / Medium / Low) so students can stop wasting days on questions that don't really help them prepare.

**Live on the Chrome Web Store** · **160+ installs** · **95+ weekly active users** · **7 × 5-star ratings**

---

## What it does

CrackTheTag shows company tags and a priority badge (High / Medium / Low) on every LeetCode problem page, so students prepping for OAs and interviews can quickly tell if a problem is worth their time. The popup lets you browse **3,200+ problems across 630+ companies** with search, sorting, and filtering by priority. It matches LeetCode's dark and light theme automatically, runs fully in your browser, and needs no login or signup.

## Why I built this

While grinding LeetCode for placements, I kept wasting entire days on problems that weren't actually relevant to the OAs or interviews I was targeting. The info on *which companies actually ask this question and how often* was locked behind LeetCode Premium, so most students, myself included, end up solving by random feel instead of by priority. I also wanted to build something that real users would actually use, not just a portfolio project. When I realised every student I knew was facing the same issue, I built CrackTheTag for myself and shipped it. It's now used by around 95 people every week and rated 5 stars by everyone who's left a review.

The smallest useful version would have been just the unlocked company tags injected into the LeetCode problem page — no popup, no filtering. I actually built and shipped it all in one go, but the company browser popup, and the theme matching all layer cleanly on top of that core data-injection step.

## How to run it

**Install from the Chrome Web Store:**
👉 **[Install on Chrome Web Store](https://chromewebstore.google.com/detail/ojiifgpoaehndflkpfmlfmgfglppndem?utm_source=item-share-cb)**

Once installed:

1. Open any LeetCode problem — the company tags and priority badge show up right on the page.
2. Click the extension icon in the toolbar to open the company browser (search, sort, filter by priority).

## Architecture decisions

These are the main design choices I had to make, and why I didn't go with the obvious option.

### 1. MutationObserver + debounce + slug-tracking — *not* `tabs.onUpdated`

This was the hardest part. LeetCode is a Single Page App: when you click from one problem to the next, the page **never actually reloads**. So `DOMContentLoaded` or a one-time content script only runs the first time and goes silent after that.

The obvious fix is `chrome.tabs.onUpdated` to listen for URL changes. Clean code, but the wrong tool, it misses LeetCode's in-app next/prev buttons, and it fires *before* the new problem's content has loaded into the page. So my badge would show up on the wrong page, or on a blank one.

What I actually built:

- A **`MutationObserver`** that watches the problem container, so every in-app switch is caught
- A **600 ms debounce** because LeetCode's page updates around 50 times during a single problem switch (the editor mounts, panels resize, theme redraws) — without debouncing, the badge would render 4–5 times and show stale data
- **Slug tracking** (`/problems/<slug>/`) so the observer only re-renders when the user actually moves to a new problem, not on every small UI change
- **Cleaning up the old badge** before adding a new one, otherwise duplicate badges piled up as users navigates
- An **`isRendering` flag** to stop the bug where two debounced calls fire back-to-back

### 2. Dataset bundled inside the extension (for now), not fetched from a backend

The 3,200-problem dataset ships as a JSON file inside the extension. The "right" answer at scale is a backend with versioned data behind a CDN, and I cover that in the 4-more-weeks section.

For now, bundling won the tradeoff: no infra cost, no extra load time, no privacy questions about tracking users, and data updates go through the regular Chrome Web Store review flow, which gives me free versioning, signed releases, and a clean rollback if something breaks. That tradeoff stops making sense at around 10× the current users, so it's a choice I made for now, not forever.

### 3. Theme detection from LeetCode's `<html>` class, not `prefers-color-scheme`

`prefers-color-scheme` works *until* someone manually overrides LeetCode's theme. I watch LeetCode's own theme class instead, so the badge always matches the page even if the user switches themes mid-session.

### 4. Filter state in `chrome.storage.local`, not `sessionStorage`

The popup unmounts every time the user closes it. `sessionStorage` would lose all the filter settings between opens, which is very frustrating when you've set up a multi-priority filter. `chrome.storage.local` keeps the state safe across popup closes and even browser restarts, and is the right Manifest V3 way to do it.

## What I used AI for

**AI use:**

- The popup UI layout, HTML structure, and most of the CSS
- The standard Manifest V3 setup files and the initial folder structure
- First drafts of the search, sort, and filter handlers in the popup
- Theme-matching CSS variables and the dark / light mode styles
- The company browse list rendering in the popup

**Written and owned by me — the parts that make it actually work in production:**

- **The entire content-script flow.** The `MutationObserver` setup, the 600 ms debounce, the slug-based change detection, the old-UI cleanup, and the `isRendering` flag. The AI's first try used `chrome.tabs.onUpdated` and a one-time listener — which broke on LeetCode's in-app navigation and ran before the new page content loaded. I removed that and rewrote the whole flow myself after seeing it break during testing on real LeetCode pages. Every line of that file is there because I traced a specific edge case in LeetCode's SPA behaviour.
- **The data shape and how the code reads it.** How filters combine, where state is stored, the recency-weighted scoring across different time windows, and how the content script pulls data from the bundle — all decisions I made and own.

Short summary: AI handled the parts that don't really change how the extension works (UI, setup, styling). The parts that actually make it run reliably in production — the SPA navigation flow, the theme watcher, the render guards, I had to write and rewrite myself, because the AI's first answers kept breaking on real LeetCode usage.

I use AI like a fast helper that still needs me to review the code and test it on real LeetCode pages. The review and the bug-catching come from me.

## What I would change with 4 more weeks

I'd split the work in two — what users actually want, and what I'd need to scale this properly.

### Product (what users actually want)

- **Solved-question tracking** — a checkmark on problems you've already done.
- **Famous sheets integration** — Striver SDE, Love Babbar, NeetCode 150 — students want to track their progress against a well-known list, not just a flat set of problems.
- **Per-sheet progress dashboard** — something like "you've finished 47 / 75 of Striver SDE" right in the popup, so the extension becomes a study companion and not just a tag-unlocker.

### Platform (what production would actually need)

- **Move the dataset off the bundle and behind a backend API.** Right now every data update has to go through Chrome Web Store review, which takes about 1-2 days. A versioned JSON endpoint behind a CDN would let me ship updates same-day and let me actually see which problems users open.
- **Basic usage tracking** — anonymous counters on which problems, companies, and sheets get viewed most, so I can focus dataset accuracy on what users actually use. At 10× the current users, I'd really need this signal.
- **Scheduled refresh pipeline** for the company-tag dataset (right now I update it by hand), with signed releases and a clear rollback path so a bad update can't break the extension for the users.
- **Host the server on JarvisLabs.** Right now there is no server — the data ships inside the extension. If I added one (to update the data and serve it through an API), JarvisLabs would be the natural place to put it, since I'd want one cloud platform handling everything instead of stitching together two or three.

If I really had 4 weeks, I'd ship the backend + tracking *first*, because they make every product feature above safer to build. Building the progress dashboard before I can see what users actually use is the wrong order.

---

## Stack & data

- Chrome Extension **Manifest V3**
- Vanilla JS, hand-written CSS, no frameworks, no build step
- `chrome.storage.local` for state, `MutationObserver` for SPA navigation
- Dataset: **3,200+ problems × 630+ companies**, with recency-weighted scoring across different time windows
- `final.json` lives in `company_data/final/` (bundled with the Chrome Web Store build, not in the public repo)
- The script that generates `final.json` is kept out of the public repo — it pulls from open community-maintained company lists and applies the recency-weighted scoring. The Chrome Web Store install includes the bundled dataset, so you can run the full extension without it.

## License

MIT

## Attribution

The company data used in this extension is derived from the dataset maintained by:

👉 [LeetCode CompanyWise Interview Questions](https://github.com/snehasishroy/leetcode-companywise-interview-questions) by [@snehasishroy](https://github.com/snehasishroy)

The raw data is processed using recency-weighted scoring across multiple time windows (30 days, 3 months, 6 months, 6+ months) and classified into priority tiers for use in this extension. Ongoing corrections come from CrackTheTag users.

**Last updated:** Feb 2026
