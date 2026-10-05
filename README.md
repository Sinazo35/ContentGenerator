# Nazo Studio — Generative AI Content Generator

A responsive AI SaaS-style university project interface built with HTML, CSS and JavaScript.

## Run
Open `index.html` in a browser, or use the VS Code Live Server extension.

## Included
- Dashboard
- Text Generator with format, tone, platform, length and hashtags controls
- Image Generator workspace with style and aspect ratio controls
- Code Generator with IDE-style output
- Publish screen with external social/GitHub destinations
- Generation History with reuse/delete/filter/search
- Settings with light/dark/system appearance
- Responsive mobile sidebar
- Loading states, toasts, empty states, copy and download actions
- LocalStorage persistence

## AI integration note
This build provides a complete functional front-end and local demonstration generation logic.
For real AI responses/images, connect your AI API in `app.js` inside `doText()`, `doImage()` and `doCode()`.
No automatic social-media posting is claimed; platform buttons open the relevant external services.


## Real image generation
Create a Pollinations API key at <https://enter.pollinations.ai/keys>, then open Settings → Image AI Connection, paste the key, and select Save Key. Generation uses Pollinations' `tongyi-mai/z-image-turbo` model; requests use the saved key and may consume your account balance. The key is stored in this browser's localStorage and is not bundled in the project.
