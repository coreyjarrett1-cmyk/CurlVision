<p align="center">
  <h1 align="center">👑 CurlVision</h1>
  <p align="center"><em>The Hair Care Ecosystem</em></p>
  <p align="center">
    A culturally focused, AI-driven hair management platform built around the unique science of Afro-textured hair.
  </p>
</p>

---

> **⚠️ PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED**
>
> This repository and all associated code, designs, documentation, and assets are the exclusive intellectual property of **Corey Jarrett**. No permission is granted to copy, fork, modify, distribute, sublicense, or create derivative works from this software without express written consent. See [LICENSE](./LICENSE) for full terms.

---

## What Is CurlVision?

CurlVision is a **B2B2C mobile-first web application (SaaS)** — think *WebMD meets Reddit meets StyleSeat*, but purpose-built for the Black hair care community. It tracks porosity, texture, density, and protective style timelines through **behavior-based user profiling**, not AI image scanning.

The platform speaks plain language, not hair science jargon. It's designed for regular people who want to maintain their hair — not just enthusiasts who already know their Andre Walker type.

**Live & In Active Development** · Built in Firebase Studio · Louisville, KY

---

## The Four Pillars

### 🌱 The Root & The Crown — *Personal Log*
A private hair diary. Users complete a two-phase onboarding quiz ("Welcome Home") to establish their baseline. Features a dynamic **Grace Period** countdown tracking the 8-week protective style limit, a **Care Consistency Score** for engagement tracking, and **The Grapevine** — an AI-powered advice engine that generates personalized recommendations from quiz data.

### 🪞 The Looking Glass — *Photo Gallery*
A visual gallery of the user's saved hair photos and style history. Each upload is tagged with the style name, time installed, and scalp condition. Displays as "Box Braids — 2 weeks" instead of cryptic hair type codes.

### 🏘️ The Village Circle — *Community Forum*
A public, tag-based discussion board (#Advice, #WashDay, etc.) with nested replies and upvoting. Gated behind sign-in for community health and moderation accountability.

### 📚 The Archive of Wisdom — *Blog & Pro Directory*
An editorial carousel of science-based articles written by licensed professionals (barbers, stylists, locticians), plus a searchable "Find a Pro" directory with ratings and external booking links.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (App Router), React, Tailwind CSS, shadcn/ui |
| **Backend / BaaS** | Firebase (Auth, Firestore, Cloud Functions, Hosting) |
| **AI Engine** | Google Genkit (Gemini + Claude) for personalized advice |
| **Monetization** | Stripe (via Firebase Extensions) for B2B Pro Subscriptions |
| **Version Control** | GitHub |
| **Dev Environment** | Firebase Studio (cloud IDE) |

---

## Design Philosophy

**"Clinical-Luxury"** — Minimalist, high-contrast, dark theme with gold accents. Deep charcoal background, generous whitespace, elegant serif italics, premium feel. Mobile-first. The design *is* the differentiator — most hair care communities online look dated. CurlVision looks like a boutique, not a flea market.

### Thematic Vocabulary

The UI uses intentional, culturally grounded language throughout:

| Concept | CurlVision Term |
|---------|----------------|
| Users | *Spirits* or *Community Souls* |
| Hair / Head | *Crown* or *Roots* |
| Protective Style Limit | *Grace Period* |
| Adding a Log | *Acts of Love* |
| Photo Gallery | *The Looking Glass* |
| Hair Photos | *Visions* or *Reflections* |
| Onboarding Quiz | *Welcome Home* |
| AI Advice Section | *The Grapevine Says* |

---

## Architecture Highlights

- **Behavior-Based Profiling** — Users answer plain-language questions about how their hair *behaves* (moisture retention, curl shape, volume) rather than trying to classify it technically. More accurate and accessible than image-based hair typing.

- **Freemium Funnel** — Anonymous users can take the Phase 1 quiz and browse Wisdom content. Deeper features (Looking Glass, Village Circle, Phase 2 quiz) require sign-in. Anonymous data merges seamlessly to permanent accounts.

- **Role-Based Access Control (RBAC)** — Firebase Auth with custom claims. Users default to `role: 'user'`. Only `role: 'admin'` can access the Village Council dashboard to promote users to `pro`.

- **Server-Side AI Logic** — All Gemini/Claude API calls are housed in Firebase Cloud Functions. API keys and proprietary prompts are never exposed to the client.

---

## Monetization Model

**Phase 1 — Launch:** All features free. Revenue from affiliate links and sponsored posts (FTC-compliant).


---

## The Builder

**Corey Jarrett** — AI-Augmented Builder · Systems Thinker · Louisville, KY

CurlVision is built using the **Sentinel Workflow**: Claude handles strategy and architecture, Firebase Studio handles engineering execution, Gemini handles iteration and AI logic, and GitHub handles version control. One founder wearing the CEO hat — AI and Firebase fill the roles of a 15–20 person team.

This project proves a core thesis: **AI enables people with domain expertise and clear vision to build at the level of a development team, without needing to be developers themselves.**

CurlVision is part of a larger ecosystem of AI-augmented projects including SampleGold (data archival), MIDI DNA (music analysis), and more.

---

## Contact

For licensing inquiries, collaboration, or press:
**coreyjarrett1@gmail.com** · [LinkedIn](https://www.linkedin.com/in/corey-jarrett-bb57a93b2)

---

<p align="center">
  <strong>© 2025 Corey Jarrett. All Rights Reserved.</strong><br>
  <em>Unauthorized use, reproduction, or distribution of this software is strictly prohibited.</em>
</p>
