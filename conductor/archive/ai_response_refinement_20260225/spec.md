# Specification: AI Response Conciseness and Formatting Refinement

## 1. Overview
This track focuses on refining the AI's behavior and response formatting. By updating the global system prompt and adding post-processing logic, we will ensure that responses are concise, adhere to character limits (2000 chars), and present source links in a standardized Markdown format at the bottom of the message.

## 2. Functional Requirements

### 2.1. System Prompt Update
- **Conciseness:** Explicitly instruct the AI to be as concise as possible, especially when summarizing search data.
- **Character Limit Instruction:** Inform the AI that the final answer should not exceed 2000 characters unless explicitly requested otherwise by the user.
- **Link Formatting:** Instruct the AI to provide all source links in Markdown format: `[Title](URL)`.
- **Link Placement:** Instruct the AI to list all sources at the end of the response.

### 2.2. Post-Processing Logic (Soft Truncation)
- Implement a safety check on the bot's final reply before sending it to Telegram.
- If the response length exceeds 2000 characters:
    - Truncate the text at 1950 characters.
    - Append `... [Truncated due to length]` to the message.

## 3. Non-Functional Requirements
- **Consistency:** The instructions must be applied to both Gemini and Cloudflare (Llama) provider pipelines.
- **Zero Gravity:** Maintain the direct, filler-free tone.

## 4. Acceptance Criteria
- AI responses include the string "[Title](URL)" for any web sources.
- Sources appear exclusively at the bottom of the message.
- Responses are demonstrably more concise when handling large context.
- Any message naturally exceeding 2000 characters is soft-truncated with the appropriate note.

## 5. Out of Scope
- Dynamic adjustment of the character limit by the user.
- Automatic splitting of long messages into multiple Telegram posts.
- Footnote-style citations (using Markdown links for now).