# Architecture

How ShiftSync is put together, and why it's built the way it is.

## The shape of the problem

Scheduling looks like simple CRUD until you hit shift swaps. A swap isn't one action — it's a conversation. Someone offers a shift, someone else agrees to take it, and a manager signs off before anything actually changes. Three people, three decisions, and the schedule only moves at the very end.

That's what shaped most of the decisions here. The app isn't really about storing shifts. It's about moving a request through a series of approvals without letting the schedule get into a bad state along the way.

## The stack

The backend is Node and Express talking to a PostgreSQL database through Prisma. The frontend is React with Vite. They talk over a plain JSON API, and the user's login lives in an httpOnly cookie so the browser sends it automatically and no token ever touches JavaScript.

Postgres was the right call because the data is relational to its core — a user belongs to a team, a shift belongs to a team and points at a user, a swap points at a shift and two people. Foreign keys keep all of that honest. You can't have a shift on a team that doesn't exist.

## How a request flows

Every API call walks through the same layers, each with one job:

```
request
  → route          which URL maps to which handler
  → middleware     is this person logged in? are they allowed?
  → controller     read the request, hand off, shape the reply
  → service        the actual logic
  → Prisma
  → PostgreSQL
```

The important line here is between the controller and the service. Controllers stay dumb on purpose — they parse the request, call one service function, and format whatever comes back. Everything that's actually interesting — the swap rules, the double-booking check, sending notifications — lives in the service layer. That split means the logic can be reasoned about and tested on its own, without pretending to be an HTTP request.

## Who's allowed to do what

Permissions aren't global. You're not a "manager" everywhere — you're a manager *of a team*. That role lives on the membership, the row that ties a user to a team, rather than on the user themselves.

So before a manager-only action runs, a piece of middleware looks up that person's membership for the team in question and checks the role there. It also means the model is ready for a person to belong to more than one team later, with a different role in each, without tearing anything up.

## The swap state machine

This is the heart of the app. A swap request is always in exactly one of five states:

```
PENDING_EMPLOYEE   waiting on the teammate to respond
PENDING_MANAGER    teammate said yes, waiting on the manager
APPROVED           manager said yes, shift reassigned
DENIED             teammate or manager said no
CANCELLED          the person who asked pulled it back
```

What matters is that you can't jump around. Every allowed move — who's allowed to make it and where it lands — lives in a single table in one file. There's no swap logic scattered across the codebase making its own decisions. If a move isn't in that table, it's rejected, everywhere, the same way.

The other deliberate choice: **nothing touches the schedule until the manager approves.** A teammate accepting doesn't mean they own the shift. It means they're willing to. The shift only actually changes hands in the final step. That keeps every state before approval a proposal, not a fact — so a denial never has to undo anything, because nothing was done yet.

## Keeping the schedule sane

Two rules protect the schedule from ending up in a state that doesn't make sense.

**No one gets double-booked.** Before a shift is assigned to someone, the system checks whether they already have a shift that overlaps that time. This is a check in code rather than a database rule, because "these two time ranges overlap" isn't something a simple database constraint can express. There's a small tradeoff — two things happening at the exact same instant could slip past — which is a known limitation rather than an accident.

**Approval happens all at once.** When a manager approves a swap, the shift gets reassigned and the request gets marked resolved in a single database transaction. Either both happen or neither does. There's no window where the shift moved but the request still looks open, or the reverse.

## Live notifications

When something happens to a swap — requested, accepted, approved, denied — the people involved find out right away. That's done with Server-Sent Events, which is a one-way stream from the server to the browser.

It's one-way on purpose. The browser never needs to push anything back over this channel; it just needs to hear about things as they happen. A full two-way connection would be more machinery than the job calls for, so this is the simpler tool that fits.

Every notification is saved to the database first, then pushed live if the person happens to be connected. So someone who's offline doesn't miss anything — the notification is waiting for them, and the live push is just a bonus for whoever's watching right now.

## The frontend

The React app is organized by feature — auth, teams, schedule, requests — rather than by file type. Everything that makes the schedule work sits together in the schedule folder, instead of being split across a components pile, a hooks pile, and a services pile. When you're working on one part of the app, the pieces you need are in one place.

Server data is handled by React Query, which caches responses and refetches them when they go stale. The upshot is that when a swap gets approved and a shift changes hands, the schedule updates itself — the pages sharing that data don't have to coordinate, they just refetch.

