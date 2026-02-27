# Specification: Local Time Context for AI and Search

## 1. Overview
This track enhances the AI's situational awareness by providing it with the user's local date, time, and approximate location. This is crucial for accurate responses to time-sensitive queries (e.g., "what happened today?") and location-specific information.

## 2. Functional Requirements

### 2.1. Timezone and Location Detection
- **Primary Source:** Use Cloudflare's `request.cf.timezone` to determine the user's local timezone based on their IP address.
- **Fallback:** If the IP is hidden or the location cannot be determined, default to a pre-configured 'home' timezone.
- **Manual Override:** A `/set_timezone` command will allow the user to manually set their IANA timezone (e.g., `America/Toronto`).

### 2.2. Context Injection
- **Smart Injection:** The system will analyze the user's query. If it's determined to be time-sensitive or require a web search, the local date, time, and location will be dynamically injected into the AI's system prompt for that specific interaction.
- **Search Integration:** When a Tavily search is performed, the current date and time must be explicitly transmitted.

### 2.3. Formatting
- Use **ISO 8601** format for the timestamp: `YYYY-MM-DDTHH:MM:SSZ` or with the appropriate offset (e.g., `2026-02-27T14:30:00+03:00`).

## 3. Non-Functional Requirements
- **Privacy:** Approximate location (timezone/city) is used solely for context; precise coordinates are not requested or stored.
- **Zero Gravity:** Information should be injected silently into the prompt without cluttering the user-facing response unless relevant.

## 4. Acceptance Criteria
- AI responses correctly acknowledge the current date/time when asked (e.g., "What day is it?").
- Tavily searches for time-sensitive topics return recent results.
- The system handles cases where Cloudflare geolocation data is missing by using the 'home' default.
- The `/set_timezone` command successfully updates the user's timezone for subsequent queries.

## 5. Out of Scope
- A `/debug_time` command. The context will be invisible to the user.
- Real-time weather integration (unless through general search).
- Prompting the user to manually set their timezone if not provided.
