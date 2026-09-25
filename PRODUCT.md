# Zedu — Product Document

**Version:** 1.0.4  
**Publisher:** Emerj LLC  
**Platform:** iOS & Android (React Native)  
**Website:** [https://zedu.chat](https://zedu.chat)  
**Last updated:** June 27, 2025

---

## 1. Executive Summary

**Zedu** is a mobile collaboration platform built for **learning communities** — schools, training organisations, study groups, tutoring teams, and any group that learns together. It combines real-time messaging, team channels, instant video meetings (**Buzz**), direct voice/video calls, file management, and AI agents into a single organisation workspace.

Zedu is **not a traditional LMS**. It does not offer courses, assignments, grades, or academic role types (student/teacher/parent). Instead, it delivers a **Slack-meets-Zoom experience** tailored for education-oriented teams: structured communication, safe video meetings, and workspace-level administration.

**Tagline:** *Seamless video calls and meetings for every learning community.*

---

## 2. Product Vision & Positioning

### Vision
Give every learning community a single place to communicate, meet, share files, and work with AI — without juggling separate chat, video, and file apps.

### Positioning
| Dimension | Zedu |
|-----------|------|
| Category | Team collaboration & communication |
| Primary use | Learning communities, education teams, training orgs |
| Comparison set | Slack, Microsoft Teams, Zoom (education context) |
| Differentiator | Buzz instant meetings + native direct calls + AI agent marketplace + learning-community focus |
| Deployment | Multi-tenant organisation workspaces |

### What Zedu Is
- A **workspace-based** communication hub (one user, many organisations)
- A **real-time** messaging and video platform
- A **permission-driven** team tool with granular roles

### What Zedu Is Not
- Not an LMS (no courses, assignments, or gradebook)
- Not a payment/checkout app (billing is view-only; upgrades via sales contact)
- Not a standalone social network (all activity is org-scoped)

---

## 3. Target Audience

### Primary Segments

| Segment | Needs Zedu Solves |
|---------|-------------------|
| **School administrators & staff** | Org-wide channels, member invites, role-based access, secure meetings |
| **Training & coaching organisations** | Group chats, Buzz sessions, file sharing, AI assistants |
| **Study groups & clubs** | DMs, group chats, quick video calls, mentions |
| **Tutoring teams** | Direct calls, scheduled Buzz links, file management |
| **Individual learners** | Join organisations via invite; personal account with multi-org access |

### User Personas

**Alex — Organisation Administrator**  
Runs a small training academy. Needs to invite members, create channels, manage roles, and start Buzz meetings for cohorts. Uses Settings → Invite, Channels, and Buzz daily.

**Jordan — Team Member**  
Participates in channels, DMs colleagues, joins Buzz calls via link or code, checks the Mentions tab for @notifications. Rarely changes org settings.

**Sam — Guest / Limited Member**  
Invited to a single workspace with guest permissions. Can view channels and comment in threads but cannot create channels or invite others.

---

## 4. Core Value Propositions

1. **All-in-one workspace** — Chats, channels, video, files, and AI in one app per organisation.
2. **Buzz meetings** — Start or join video meetings instantly; share org-scoped links; host-controlled admission.
3. **Native-grade calling** — 1:1 direct calls with VoIP push (iOS), foreground service & lock-screen controls (Android).
4. **Real-time everywhere** — Messages, presence, and call events via Centrifugo WebSockets.
5. **Learning-community focus** — Positioned and designed for education teams, not generic enterprise only.
6. **AI agents** — Browse a marketplace, install agents, or create custom agents with tone and visibility settings.
7. **Mentions inbox** — Dedicated tab for every @mention across DMs, groups, and channels.
8. **Granular RBAC** — Administrator through guest roles with backend-aligned permission keys.

---

## 5. Feature Catalog

### 5.1 Authentication & Onboarding

| Feature | Description |
|---------|-------------|
| **Welcome screen** | Brand intro, permission requests (camera, microphone, notifications), Privacy Policy & Terms links |
| **Email sign-up / sign-in** | Standard email and password registration and login |
| **Google Sign-In** | OAuth via `POST /auth/google` |
| **Apple Sign-In** | OAuth via `POST /auth/apple` (iOS) |
| **Forgot password** | Email → verification code → reset password flow |
| **Session persistence** | Token, user, and current organisation restored from device storage on launch |
| **Permission priming** | Camera, mic, and push notification permissions requested at welcome |

**Note:** Organisation signup fields exist in code but the Individual/Organisation account-type selector is currently commented out; default signup is Individual.

---

### 5.2 Organisation Workspaces

| Feature | Description |
|---------|-------------|
| **Multi-org membership** | Users can belong to multiple organisations and switch between them |
| **Organisation switcher** | Drawer on Chats tab lists all orgs; tap to switch (`PUT /users/switch-org`) |
| **Add organisation** | Create a new workspace from the drawer or Settings |
| **Org branding** | Organisation logo displayed in drawer and workspace UI |
| **Org-scoped data** | Channels, chats, files, agents, and Buzz links are scoped to the active organisation |

**Drawer actions:** Switch org · Add new organisation · File management · Help (links to zedu.chat/contact)

---

### 5.3 Chats (Direct & Group Messages)

The **Chats** tab is the primary messaging hub.

| Feature | Description |
|---------|-------------|
| **Direct messages (DMs)** | 1:1 private conversations |
| **Group DMs** | Multi-person private group chats |
| **Chat filters** | All · Unread · Groups · Favorites |
| **Search** | Search conversations by name |
| **Start new DM** | Initiate a conversation with org members |
| **Real-time delivery** | Centrifugo `dm-connection` for live messages |
| **Message types** | Text, images, video, documents, voice messages |
| **@Mentions** | Mention users with metadata; surfaced in Mentions tab |
| **Thread replies** | Reply in threads; dedicated thread screens for DMs and groups |
| **Reactions** | Emoji reactions on messages with reaction detail sheet |
| **Message editing** | Edit sent messages |
| **Favorites** | Mark conversations as favorites; filter by Favorites |
| **Pinned messages** | Support for pinned message state |
| **Media gallery** | Browse shared media in a conversation |
| **Member management** | Add members, view participant profiles, group admin controls |
| **Conversation details** | DM and group metadata screens |
| **Unread indicators** | Unread counts and category badges |

---

### 5.4 Channels

The **Channels** tab provides broadcast-style team communication.

| Feature | Description |
|---------|-------------|
| **Public & private channels** | Create and browse channels within the organisation |
| **Channel list & search** | Find channels quickly |
| **Channel chat** | Real-time messaging in channels via Centrifugo `channel-connection` |
| **Channel details** | View members, administrators, and channel metadata |
| **Member management** | Add existing members or invite new members to a channel |
| **Channel administrators** | `is_admin` flag on channel members for elevated channel control |
| **Thread replies** | Threaded discussions within channels |
| **Channel video calls** | Start or join Buzz calls from a channel context |
| **Per-channel notifications** | Notification preference screen per channel |
| **Channel onboarding** | “What is a Channel?” intro — *one-to-many space for updates to an unlimited audience* |
| **User profiles** | View channel member details from within a channel |

---

### 5.5 Buzz (Video Meetings)

**Buzz** is Zedu’s instant video meeting product — comparable to Google Meet or Zoom quick meetings.

| Feature | Description |
|---------|-------------|
| **New Buzz** | Create an instant meeting; enter Green Room before joining |
| **Green Room** | Pre-call lobby: preview camera/mic, see meeting link, adjust settings |
| **Shareable meeting link** | Org-scoped URL: `{CLIENT_URL}/{org}/buzz/{code}` |
| **Join with code** | Enter a Buzz code to join an existing meeting |
| **Host admission** | Meetings are safe — no one joins unless invited or admitted by the host |
| **In-call controls** | Mute/unmute audio, toggle video, screen share options |
| **Participant grid** | Video tiles with names and avatars |
| **Floating reactions** | Emoji reactions during calls |
| **Minimized call widget** | Continue using the app while in a call |
| **Android overlay** | Floating call overlay on Android |
| **Keep awake** | Screen stays on during active calls |
| **Channel Buzz** | Launch Buzz from within a channel |

**Onboarding carousel:**
- *Get a link that you can share* — Tap New Buzz to get a link for people you want to meet with
- *Your meeting is safe* — No one can join unless invited or admitted by the host

**Video engine:** Agora RTC (`react-native-agora`)

---

### 5.6 Direct Calls (1:1 Voice/Video)

Native-quality peer calls separate from Buzz group meetings.

| Feature | Description |
|---------|-------------|
| **Initiate from DM** | Start a direct call from a conversation or user profile |
| **Incoming call UI** | Native-style incoming call screen |
| **VoIP push (iOS)** | PushKit-based incoming call notifications |
| **Push notifications (Android)** | OneSignal-driven call invites |
| **Foreground service (Android)** | Ongoing call service with lock-screen actions |
| **Accept / decline** | Native accept and decline from notification or in-app |
| **Ongoing call screen** | Full-screen active call with minimizable widget |
| **Call deep links** | Notification taps route to incoming or ongoing call screens |

---

### 5.7 Mentions

The **Mentions** tab is a unified @mention inbox.

| Feature | Description |
|---------|-------------|
| **Mention feed** | All @mentions across DMs, group chats, and channels |
| **Mention threads** | Tap a mention to open full thread context |
| **Cross-context** | Works regardless of where the mention originated |

---

### 5.8 File Management

Accessible from the organisation drawer (**File management**).

| Feature | Description |
|---------|-------------|
| **Org file browser** | Organisation-level file storage and navigation |
| **Folders** | Create and navigate folder hierarchy |
| **Upload** | Upload files to the organisation |
| **File preview** | View file details and preview supported types |
| **Rename, move, delete** | File organisation actions |
| **Filters** | Filter files by type or criteria |
| **Bulk actions** | Manage multiple files at once |

---

### 5.9 AI Agents

AI assistants that organisations can install and customise.

| Feature | Description |
|---------|-------------|
| **Agent list** | View agents installed in the organisation |
| **Marketplace** | Browse and discover agents to install |
| **Agent details** | View agent info, description, and markdown content |
| **Create custom agent** | Name, title, description, avatar, tone (Friendly / Formal / Casual), visibility (public/private) |
| **Agent popover** | Quick access to agents from the main UI |

**Note:** Agent navigation stack is implemented but may require registration in the root navigator for full accessibility. Billing plans reference included AI credits per tier.

---

### 5.10 Settings & Account

The **Settings** tab provides personal and workspace configuration.

| Feature | Description |
|---------|-------------|
| **Profile** | Avatar, display name, title, phone number |
| **Status** | Custom status with emoji, text, and auto-clear timeout |
| **Online / Away** | Presence indicator on profile |
| **Notifications** | Mobile notification schedule (start/end time), notification type, email toggle |
| **Security** | Login session audit and security preferences |
| **Change password** | Update account password |
| **Invite people** | Email invites, shareable invite link, role picker (permission-gated: `can_invite_members`) |
| **Add organisation** | Create a new workspace |
| **Sign out** | Log out with confirmation modal |
| **Delete account** | Permanent account deletion |

**Billing (implemented, not linked in Settings menu):**
- View subscription plans from API (`GET /subscriptions/plans`)
- Monthly vs annual toggle (20% annual savings)
- Plan details with AI credits included
- Upgrade via **Contact Sales** → zedu.chat/contact
- No in-app purchase or Stripe checkout

---

### 5.11 Notifications & Real-Time

| Feature | Description |
|---------|-------------|
| **Push notifications** | OneSignal integration for message and call alerts |
| **Notification deep links** | DM, group DM, channel message, direct call invite/cancel |
| **Device token sync** | `PUT /users/onesignal-subscription-id` on login |
| **Centrifugo WebSockets** | Real-time: DMs, channels, replies, general notifications |
| **Presence** | Online/away status |
| **iOS VoIP** | Background mode for incoming calls |
| **Notification schedule** | Quiet hours with start/end time configuration |

---

### 5.12 Roles & Permissions

Organisation roles (not academic roles):

| Role | Summary |
|------|---------|
| **Administrator** | Full org control: channels, members, billing, agents, workflows, integrations, roles, analytics, webhooks |
| **Manager** | Most admin capabilities minus some org-level settings |
| **Project Lead** | Channel management, invites, messaging |
| **User** | View channels, edit messages, create channels, comment in threads |
| **Guest** | View channels, comment in threads only |
| **Bot** | Analytics and channel view access |

**Permission examples:** `can_invite_members`, `can_manage_channels`, `can_create_agents`, `can_view_billing`, `can_edit_messages`, `can_delete_files`, `can_archive_channels`, and more.

Permissions are enforced in the UI via `hasPermission()` — e.g., Invite People only appears for users with `can_invite_members`.

**Additional role concepts:**
- Channel administrator (`is_admin` on channel membership)
- Group admin (group chat level)
- Buzz participant role (caller/receiver)

---

## 6. User Journeys

### 6.1 New User Sign-Up
```
Welcome → Grant permissions → Create Account → Sign up (email or Google/Apple)
→ Authenticated → Chats tab (may need org invite or create org)
```

### 6.2 Join an Organisation
```
Receive invite email/link → Sign up or sign in → Accept invite
→ Organisation appears in drawer → Switch to org → Access channels & chats
```

### 6.3 Start a Buzz Meeting
```
Buzz tab → New Buzz → Green Room (preview, copy link) → Join call
OR: Buzz tab → Join with code → Enter code → Join call
OR: Channel → Start Buzz → Green Room → Call
```

### 6.4 Direct Message Flow
```
Chats tab → Start DM or open conversation → Send text/media/voice
→ @mention someone → They see it in Mentions tab
→ Reply in thread → View thread screen
```

### 6.5 Channel Collaboration
```
Channels tab → Browse or Create channel → Post update
→ Members reply in thread → Start Buzz from channel for live session
```

### 6.6 Organisation Admin
```
Drawer → Add organisation OR Settings → Invite People
→ Assign role → Members join → Create channels → Manage files & agents
```

---

## 7. Navigation Architecture

```
App
├── Auth Stack (unauthenticated)
│   ├── Welcome
│   ├── Sign Up / Sign In
│   └── Forgot Password (email → code → reset)
│
└── Main App (authenticated)
    ├── Bottom Tabs
    │   ├── Chats (+ Organisation Drawer)
    │   ├── Channels
    │   ├── Mentions
    │   ├── Buzz
    │   └── Settings
    │
    └── Modal Stacks
        ├── Chat Stack (DM, group, threads, calls, media)
        ├── Channel Stack (chat, details, threads, Buzz, notifications)
        ├── Buzz Stack (Green Room, call, join)
        ├── Direct Call Stack (incoming, ongoing)
        ├── Mention Stack (thread)
        ├── Settings Stack (profile, security, invite, billing*, delete)
        ├── File Stack (browser, detail)
        └── Agent Stack (list, marketplace, create, details)*
```

\* Billing not linked from Settings hub; Agent stack may need root navigator registration.

---

## 8. Technical Overview

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.83, React 19 |
| Language | TypeScript |
| Navigation | React Navigation 7 (stack, tabs, drawer) |
| State | React Context + reducer |
| HTTP API | Axios (`BASE_URL` from environment) |
| Real-time | Centrifuge 5.x |
| Video / voice | react-native-agora 4.x |
| Push | react-native-onesignal 5.x + iOS VoIP / Android FGS |
| Auth | Email/password, Google, Apple |
| Storage | AsyncStorage |
| UI | Custom components, Reanimated, bottom sheets, Lato font |
| Media | Fast Image, Image Picker/Cropper, Video, Audio Recorder, Document Picker |

**Bundle identifiers:**
- iOS: `net.emerj.zedu`
- Android: `net.emerj.zedu`

**Brand colors:**
- Primary: `#6C47FF`
- Secondary / nav: `#303073`

---

## 9. Pricing & Plans

| Aspect | Current State |
|--------|---------------|
| Default plan | Free |
| Plan discovery | API-driven (`/subscriptions/plans`) |
| Billing UI | Monthly/annual toggle, plan cards, plan detail with AI credits |
| Checkout | Not in-app — Contact Sales at zedu.chat/contact |
| IAP / Stripe | Not implemented |
| Settings access | Billing screens exist but are not linked from Settings |

---

## 10. Brand & Identity

| Element | Value |
|---------|-------|
| Product name | Zedu |
| Store / display name | Zedu - Chat, Video & Teams |
| Publisher | Emerj LLC |
| Domain | zedu.chat |
| Tagline | Seamless video calls and meetings for every learning community. |
| Primary color | Purple `#6C47FF` |
| Font | Lato |

**Legacy note:** Some billing copy still references “Telex” from a prior product name. Firebase config files may contain legacy `net.emerj.telex` references.

---

## 11. App Store & Play Store Metadata

### Recommended App Title (30 characters max)
```
Zedu - Chat, Video & Teams
```
*(26 characters — fits Apple App Store and Google Play title limits)*

### Apple App Store Subtitle (30 characters max)
```
For learning communities
```

### Short Description — Google Play (80 characters max)
```
Chat, video meetings & team channels built for schools and learning communities.
```
*(79 characters)*

### Full Description — Google Play & Apple App Store

```
Zedu brings your learning community together in one place — with team chat, channels, instant video meetings, and secure direct calls.

Built for schools, training organisations, study groups, and education teams, Zedu replaces the need to juggle separate messaging and video apps. Create an organisation workspace, invite your team, and start collaborating in minutes.

TEAM CHAT & CHANNELS
• Direct messages and group chats with real-time delivery
• Organisation channels for one-to-many updates
• @mentions with a dedicated Mentions inbox
• Thread replies, emoji reactions, voice messages, and media sharing
• Favourite conversations and smart filters (All, Unread, Groups)

BUZZ VIDEO MEETINGS
• Start instant video meetings with one tap
• Share a meeting link or join with a code
• Green Room lobby to preview your camera and microphone before joining
• Host-controlled admission — your meetings stay private and secure
• Screen sharing and in-call reactions

NATIVE DIRECT CALLS
• 1:1 voice and video calls from any conversation
• Incoming call notifications, even when the app is in the background
• Minimizable call widget so you can multitask during calls

ORGANISATION WORKSPACES
• Belong to multiple organisations and switch between them instantly
• Role-based permissions: Administrator, Manager, Project Lead, User, and Guest
• Invite members by email or shareable link with role assignment
• Organisation-wide file management with folders and uploads

AI AGENTS
• Browse the agent marketplace and install assistants for your team
• Create custom AI agents with name, tone, and visibility settings

STAY IN CONTROL
• Custom status with emoji and auto-clear
• Notification schedule and email preferences
• Security settings and session management
• Sign in with email, Google, or Apple

Zedu is made for every learning community that needs seamless communication and video — without the complexity of enterprise tools.

Privacy Policy: https://zedu.chat/policy
Terms of Service: https://zedu.chat/terms-of-service
Support: https://zedu.chat/contact
```

### Promotional Text — Apple App Store (170 characters max)
```
Chat, Buzz video meetings, and team channels — all in one workspace for schools and learning communities. Start free today.
```
*(124 characters)*

### Keywords — Apple App Store (100 characters max)
```
education,chat,video,meetings,school,teams,channels,learning,collaboration,students,teachers,zoom
```
*(97 characters)*

### Category Suggestions
- **Apple:** Education (primary), Business (secondary)
- **Google Play:** Education (primary), Communication (secondary)

---

## 12. Store Listing Update Checklist

The in-app display name has been updated in the codebase. **Store listing titles must also be updated manually** in each console:

### Google Play Console
1. Open [Google Play Console](https://play.google.com/console) → your app
2. **Grow → Store presence → Main store listing**
3. Set **App name** to: `Zedu - Chat, Video & Teams`
4. Paste the **Short description** and **Full description** from Section 11
5. Save and submit for review if required

### Apple App Store Connect
1. Open [App Store Connect](https://appstoreconnect.apple.com) → your app
2. **App Information** → set name if creating new version metadata
3. Under the app version → set **Name** to: `Zedu - Chat, Video & Teams`
4. Set **Subtitle** to: `For learning communities`
5. Paste **Description**, **Promotional Text**, and **Keywords** from Section 11
6. Save and submit with your next build

### Codebase files updated (device home-screen name)
- `app.json` → `displayName`
- `android/app/src/main/res/values/strings.xml` → `app_name`
- `ios/Zedu/Info.plist` → `CFBundleDisplayName`
- `ios/Zedu.xcodeproj/project.pbxproj` → `INFOPLIST_KEY_CFBundleDisplayName`

---

## 13. Known Gaps & Future Considerations

| Item | Status |
|------|--------|
| LMS features (courses, assignments, grades) | Not in scope |
| In-app billing / IAP | Not implemented |
| Billing screen in Settings | Built but not linked |
| Agent stack in root navigator | May need registration |
| Organisation signup UI | Commented out in signup flow |
| i18n / localization | English only |
| Telex legacy branding | Remains in billing copy |
| Workflows, integrations, webhooks | Backend permissions only; no mobile UI |
| Analytics dashboard | Permission only; no dedicated screen |

---

## 14. Support & Legal

| Resource | URL |
|----------|-----|
| Website | https://zedu.chat |
| Privacy Policy | https://zedu.chat/policy |
| Terms of Service | https://zedu.chat/terms-of-service |
| Contact / Sales | https://zedu.chat/contact |
| Help (in-app) | Drawer → Help → zedu.chat/contact |

---

*This document reflects the Zedu mobile codebase as of version 1.0.4. Features marked with caveats may be partially implemented or pending navigation wiring.*
