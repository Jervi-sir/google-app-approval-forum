import { NextResponse } from "next/server"

const HARDCODED_TEMPLATES = [
  {
    name: "Default",
    code: "TMP-DEFAULT",
    category: "general",
    tone: "professional",
    bestFor: ["Any app", "First-time testers", "Clear instructions"],
    highlights: ["Explains Play policy (14 days)", "Collects feedback", "Simple structure"],
    placeholders: ["App Name", "App Description", "Testing Goals", "Known Issues", "What’s New"],
    image: "/templates-preview/default.png",
    content: `## 📌 App Description
**App name:** [App Name]  
**What it does:** [Briefly describe what your app does in 1–3 lines]  
**Target users:** [Who is it for?]

## 🎯 Testing Goals (Why we need you)
Google Play requires **20 testers** to keep the app installed for **14 days**.
Please focus on:
- **Feature to test:** [e.g. Login, onboarding, payments, camera, maps, etc.]
- **Edge cases:** [e.g. slow internet, low storage, old Android, dark mode]
- **Bugs to report:** [crashes, stuck screens, missing buttons, layout issues]

## ✅ How to Join (2 Steps)
1. **Join Google Group:** (use the link above)
2. **Install from Play Store:** (use the link above)

## ⏳ Requirement
- Keep the app installed for **14 days**
- Open it at least **once per day** (recommended)

## 🧾 What to Comment Here (Copy/Paste)
- **Device:** [Brand + Model]  
- **Android:** [Version]  
- **Issue:** [What happened + steps to reproduce]  
- **Screenshot/Video:** [Optional link or attachment]  

## ⭐ Feedback Options
- Leave a short **Play Store review**, OR
- Comment below with **bugs + suggestions**  
Thank you 🙏`
  },

  {
    name: "Minimalist — Furniture Feel",
    code: "TMP-MINIMALIST_FOURNITURE",
    category: "reciprocal",
    tone: "warm-minimal",
    bestFor: ["Test-for-test communities", "Simple posts", "Fast conversions"],
    highlights: ["Clear exchange rules", "Screenshot proof", "14-day requirement"],
    placeholders: ["App Name", "App Info", "Your Link", "Proof Screenshot"],
    image: "/templates-preview/minimalist-fourniture.png",
    content: `## 🤝 Test for Test (Fair Exchange)
I can test your app **in return**.
After you join mine, drop your link in the comments and I’ll join yours.

## 🪵 App Info
**App name:** [App Name]  
**What it does:** [1–2 lines, simple]

## 🧭 Steps
1. Join the group and install the app (links above).
2. Comment **a screenshot proof** (install screen or app opened).
3. Then post **your testing link** and I will install yours.

## 📌 Rules (so it stays fair)
- Keep installed **14 days** ✅
- Don’t uninstall early ❌
- If you uninstall, I uninstall too (no hard feelings)

## 📝 Comment format (Copy/Paste)
- ✅ Joined: Yes
- 📱 Device: [Model]
- 🤖 Android: [Version]
- 🔗 Your app link: [Play testing link]
- 🖼 Proof: [Screenshot]`
  },

  {
    name: "Glass UI",
    code: "TMP-GLASSUI",
    category: "changelog",
    tone: "modern",
    bestFor: ["Alpha/Beta releases", "Feature updates", "Bug reporting"],
    highlights: ["Changelog format", "Known issues section", "Direct crash reporting"],
    placeholders: ["App Name", "Version", "Known Issues", "What’s New", "Feedback Channel"],
    image: "/templates-preview/glass-ui-template.png",
    content: `## 🚀 Alpha Build — [App Name] ([v0.1])
Thanks for helping test the early version. This build focuses on stability and core flows.

## ✅ What to Test
- [Core flow 1: e.g. Sign up → onboarding]
- [Core flow 2: e.g. Create a post → upload screenshots]
- [Core flow 3: e.g. Notifications / search / filters]

## 🧨 Known Issues (already aware)
- [Issue 1 — example: crash on Android 10 with low RAM]
- [Issue 2 — example: slow loading on poor network]

## ✨ What’s New
- [Feature 1]
- [Feature 2]
- [Fix 1]

## 🧾 If you find a bug, send this info
- Device + Android version
- Steps to reproduce
- Screenshot/video if possible

## 📣 Feedback
Please report crashes directly in the comments (or via: [Discord/Email/Telegram]).`
  },

  {
    name: "Mira Custom Design",
    code: "TMP-MIRA",
    category: "playful",
    tone: "friendly",
    bestFor: ["Fun branding", "Community vibe", "Pet-themed apps"],
    highlights: ["Short + friendly", "Very simple steps", "Easy to skim"],
    placeholders: ["App Name", "Theme", "Extra request"],
    image: "/templates-preview/mira-template.png",
    content: `## 🐾 Join the Pack — [App Name]
We’re looking for friendly testers for our new app!

## ✅ Steps
1) Join the Google Group (link above)  
2) Install from Play Store (link above)  
3) Keep it installed for **14 days** 🙏

## 💬 Helpful Comment (optional)
Tell us your device + Android version and anything that feels confusing or buggy.`
  },
]

export async function GET() {
  return NextResponse.json(HARDCODED_TEMPLATES)
}
