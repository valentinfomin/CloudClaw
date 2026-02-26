# Specification: Local Time Context for AI and Search

## 1. Overview
This track enhances the AI's situational awareness by providing it with the user's local date, time, and approximate location. This is crucial for accurate responses to time-sensitive queries (e.g., "what happened today?") and location-specific information.

## 2. Functional Requirements

### 2.1. Timezone and Location Detection
- **Primary Source:** Use Cloudflare's `request.cf.timezone` to determine the user's local timezone based on their IP address.
- **Fallback:** If the IP is hidden or the location cannot be determined, default to `UTC` and explicitly inform the AI (e.g., "Current time (UTC): ...").
- **Dynamic Override:** If a user query specifically mentions a different location (e.g., "What time is it in Tokyo?"), the system should rely on search results for that specific location rather than the detected IP-based timezone.

### 2.2. Context Injection
- **System Instruction:** Add the current local date, time, and timezone/location to the global `systemPrompt` for all AI interactions (Gemini and Llama).
- **Search Integration:** When a Tavily search is performed, the current date and time must be explicitly transmitted to ensure Tavily can rank results by recency and relevance.

### 2.3. Formatting
- Use **ISO 8601** format for the timestamp: `YYYY-MM-DDTHH:MM:SSZ` or with the appropriate offset (e.g., `2026-02-25T14:30:00+03:00`).
- The AI should be instructed on how to interpret and present this information to the user.

## 3. Non-Functional Requirements
- **Privacy:** Approximate location (timezone/city) is used solely for context; precise coordinates are not requested or stored.
- **Zero Gravity:** Information should be injected silently into the prompt without cluttering the user-facing response unless relevant.

## 4. Acceptance Criteria
- AI responses correctly acknowledge the current date/time when asked (e.g., "What day is it?").
- Tavily searches for time-sensitive topics return recent results.
- The system handles cases where Cloudflare geolocation data is missing by defaulting to UTC.

## 5. Out of Scope
- Prompting the user to manually set their timezone.
- Real-time weather integration (unless through general search).