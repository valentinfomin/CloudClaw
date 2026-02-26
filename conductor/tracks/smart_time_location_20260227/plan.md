# Implementation Plan: Local Time Context for AI and Search

## Phase 1: Timezone and Location Handling [checkpoint: 1446ebd]

- [x] Task: Update DB Schema for User Location acb4870
    - [x] Sub-task: Add `timezone`, `city`, `country` columns to the `users` table.
- [x] Task: Implement User Location Persistence b99390c
    - [x] Sub-task: Update `createUser` to include initial location data (defaulting to `UTC`, `Unknown`).
    - [x] Sub-task: Implement `updateUserLocation` to allow updating `timezone`, `city`, `country`.
- [x] Task: Update `handleUpdate` to use persisted user location dcee7a5
    - [x] Sub-task: Modify `handleUpdate` to retrieve user's stored timezone/location.
    - [x] Sub-task: Prioritize stored user data over Cloudflare `cf` data for `geolocation` variable.
- [x] Task: Implement `/set_timezone` command 5057e39
    - [x] Sub-task: Add command handling in `handleCommand` for `/set_timezone <IANA_timezone>`.
    - [x] Sub-task: Validate timezone format using `Intl.DateTimeFormat`.
    - [x] Sub-task: Update user's stored timezone.
- [x] Task: Implement `/set_location` command f539999
    - [x] Sub-task: Add command handling in `handleCommand` for `/set_location <city>,<country>`.
    - [x] Sub-task: Update user's stored city and country.
- [x] Task: Unit Tests for User Location f64391a
    - [x] Sub-task: Add unit tests for `updateUserLocation` in `test/db_users_settings.test.js`.
    - [x] Sub-task: Add unit tests for `/set_timezone` and `/set_location` commands in `test/handlers/commands.test.js`.
- [~] Task: Conductor - User Manual Verification 'Phase 1: Timezone and Location Handling' (Protocol in workflow.md)

## Phase 2: Context Injection and Formatting

- [x] Task: Modify `getFormattedTimestamp` a87337a
    - [x] Sub-task: Enhance `getFormattedTimestamp` in `src/utils/text.js` to correctly format ISO 8601 with offset for user-defined timezones, falling back to UTC.
    - [x] Sub-task: Update relevant unit tests in `test/text_utils.test.js`.
- [ ] Task: Update AI System Prompt for Smart Injection
    - [ ] Sub-task: Modify `systemPrompt` in `src/handlers/commands.js` to dynamically include `CURRENT TIME AND LOCATION` only when search is performed.
- [ ] Task: Update Tavily Search with Time Context
    - [ ] Sub-task: Update `performTavilySearch` in `src/services/search.js` to accept `effectiveTimezone` and pass it to Tavily if a search is performed.
- [ ] Task: Integration Test for Smart Injection
    - [ ] Sub-task: Create a new test `test/time_context_smart_injection.test.js` to verify that time context is injected only when `SEARCH_NEEDED: YES` is inferred.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Context Injection and Formatting' (Protocol in workflow.md)

## Phase 3: Deployment and Final Verification

- [ ] Task: Deploy to Production
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Deployment and Final Verification' (Protocol in workflow.md)
