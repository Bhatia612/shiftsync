# API Reference

Everything the ShiftSync API can do. All routes live under `/api/v1` and speak JSON.

## Logging in

Auth is a session cookie. When you log in, the server sets an httpOnly cookie called `token`, and the browser sends it back on every request after that. Endpoints marked **Auth required** turn away anyone without a valid session (`401 UNAUTHENTICATED`).

## Roles

Everyone on a team is either a `MANAGER` or an `EMPLOYEE`, and that role is per-team - it lives on your membership, not on your account. For now, each person is on one team.

Roles are an API concern. The frontend also has a separate "mode" (a manager can view the app as an employee or as a manager), but that's a client-side view toggle - it doesn't change what the API allows. The API always enforces permissions from the membership role.

## When something goes wrong

Every error comes back in the same shape:

```json
{ "error": { "message": "string", "code": "STRING_CODE" } }
```

The status codes used throughout:

| Code | Means |
|------|-------|
| 200 | It worked (read or update) |
| 201 | Something was created |
| 204 | Something was deleted, nothing to return |
| 400 | The request was malformed |
| 401 | You're not logged in |
| 403 | You're logged in but not allowed |
| 404 | It doesn't exist |
| 409 | It conflicts with the current state |

---

## Auth

### POST /auth/signup

Make an account.

**Auth:** none
**Body:** `{ "name": string, "email": string, "password": string }`

Returns the new user:

```json
{ "user": { "id": "string", "name": "string", "email": "string" } }
```

**Errors:** `400 VALIDATION_ERROR` (missing name, bad email, or password under 8 characters) · `409 EMAIL_TAKEN`

---

### POST /auth/login

Log in and start a session. Sets the `token` cookie.

**Auth:** none
**Body:** `{ "email": string, "password": string }`

Returns the user. **Errors:** `400 VALIDATION_ERROR` · `401 INVALID_CREDENTIALS` (same message whether the email is unknown or the password is wrong).

---

### POST /auth/logout

End the session and clear the cookie.

**Auth:** none · **Body:** none

Returns `{ "message": "Logged out" }`.

---

### GET /auth/me

Who am I, and what team am I on.

**Auth:** required

```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "membership": { "teamId": "string", "role": "MANAGER | EMPLOYEE" }
}
```

`membership` is `null` if you haven't joined a team yet.

---

## Teams

### POST /teams

Start a team. You become its manager.

**Auth:** required
**Body:** `{ "name": string }`

Returns `{ "team": { "id": "string", "name": "string" } }`. **Error:** `409 ALREADY_ON_TEAM`.

---

### GET /teams/:teamId

Get a team's details.

**Auth:** required, must be on the team

```json
{ "team": { "id": "string", "name": "string", "createdAt": "datetime" } }
```

**Errors:** `403 NOT_TEAM_MEMBER` · `404 TEAM_NOT_FOUND`

---

### GET /teams/:teamId/members

List everyone on the team.

**Auth:** required, must be on the team

```json
{ "members": [ { "userId": "string", "name": "string", "email": "string", "role": "MANAGER | EMPLOYEE" } ] }
```

---

### POST /teams/:teamId/members

Add someone by their email. They need an account already.

**Auth:** required, manager
**Body:** `{ "email": string, "role": "MANAGER" | "EMPLOYEE" }`

Returns the new membership. **Errors:** `403 NOT_TEAM_MANAGER` · `404 USER_NOT_FOUND` · `409 ALREADY_ON_TEAM`.

---

### PATCH /teams/:teamId/members/:userId

Change someone's role.

**Auth:** required, manager
**Body:** `{ "role": "MANAGER" | "EMPLOYEE" }`

Returns the updated membership. **Errors:** `403 NOT_TEAM_MANAGER` · `404 MEMBERSHIP_NOT_FOUND`.

---

### DELETE /teams/:teamId/members/:userId

Remove someone from the team.

**Auth:** required, manager

Returns `204`, no body. **Errors:** `403 NOT_TEAM_MANAGER` · `404 MEMBERSHIP_NOT_FOUND`.

---

## Positions

A position is a job someone does on a shift - Cashier, Cook, Baker. Each team has its own set, and names can't repeat within a team. Every shift has one.

### POST /teams/:teamId/positions

Add a position.

**Auth:** required, manager
**Body:** `{ "name": string }`

```json
{ "position": { "id": "string", "teamId": "string", "name": "string", "createdAt": "datetime" } }
```

**Errors:** `400 VALIDATION_ERROR` (empty name) · `403 NOT_TEAM_MANAGER` · `409 POSITION_EXISTS`.

---

### GET /teams/:teamId/positions

List the team's positions, sorted by name.

**Auth:** required, must be on the team

```json
{ "positions": [ { "id": "string", "teamId": "string", "name": "string", "createdAt": "datetime" } ] }
```

---

### DELETE /teams/:teamId/positions/:positionId

Remove a position. Won't work if any shift is still using it.

**Auth:** required, manager

Returns `204`, no body. **Errors:** `403 NOT_TEAM_MANAGER` · `404 POSITION_NOT_FOUND` · `409 POSITION_IN_USE`.

---

## Shifts

A shift belongs to a team, always has a position, and is either assigned to one person or left open (`assignedUserId: null`). Nobody can hold two shifts that overlap in time - anything that would cause that comes back as `409 SHIFT_OVERLAP`.

### POST /teams/:teamId/shifts

Create a shift.

**Auth:** required, manager
**Body:** `{ "positionId": string, "startTime": datetime, "endTime": datetime, "assignedUserId": string | null }`

```json
{ "shift": { "id": "string", "teamId": "string", "positionId": "string", "startTime": "datetime", "endTime": "datetime", "assignedUserId": "string | null" } }
```

**Errors:** `400 VALIDATION_ERROR` (bad dates, or start not before end) · `400 POSITION_NOT_FOUND` · `400 NOT_TEAM_MEMBER` (assignee isn't on the team) · `409 SHIFT_OVERLAP`.

---

### GET /teams/:teamId/shifts?from=&to=

List the team's shifts, oldest first. Narrow it to a date range with `from` and `to` (both optional).

**Auth:** required, must be on the team

```json
{ "shifts": [ { "id": "string", "teamId": "string", "positionId": "string", "startTime": "datetime", "endTime": "datetime", "assignedUser": { "id": "string", "name": "string" } } ] }
```

`assignedUser` is `null` for open shifts.

---

### GET /shifts/:shiftId

Get one shift. Same shape as above.

**Auth:** required, must be on the shift's team

**Errors:** `403 NOT_TEAM_MEMBER` · `404 SHIFT_NOT_FOUND`.

---

### PATCH /shifts/:shiftId

Update a shift. Send only the fields you're changing; the rest stay put. Passing `assignedUserId: null` unassigns it.

**Auth:** required, manager of the shift's team
**Body:** `{ "positionId"?: string, "startTime"?: datetime, "endTime"?: datetime, "assignedUserId"?: string | null }`

Returns the updated shift. **Errors:** `400 VALIDATION_ERROR` · `400 POSITION_NOT_FOUND` · `400 NOT_TEAM_MEMBER` · `404 SHIFT_NOT_FOUND` · `409 SHIFT_OVERLAP`.

---

### DELETE /shifts/:shiftId

Delete a shift.

**Auth:** required, manager of the shift's team

Returns `204`, no body. **Errors:** `403 NOT_TEAM_MANAGER` · `404 SHIFT_NOT_FOUND`.

---

## Swap Requests

A swap request is someone asking a teammate to take one of their shifts. It moves through a few stages, and the schedule only changes at the very end, once a manager approves.

**The stages:**

| Status | Where it's at |
|--------|---------------|
| PENDING_EMPLOYEE | waiting on the teammate to respond |
| PENDING_MANAGER | teammate agreed, waiting on the manager |
| APPROVED | manager signed off, shift reassigned |
| DENIED | teammate or manager said no |
| CANCELLED | the request was pulled back |

**Who can move it where:**

| From | Action | Who | To |
|------|--------|-----|-----|
| PENDING_EMPLOYEE | accept | the teammate | PENDING_MANAGER |
| PENDING_EMPLOYEE | decline | the teammate | DENIED |
| PENDING_EMPLOYEE | cancel | the requester or a team manager | CANCELLED |
| PENDING_MANAGER | approve | the manager | APPROVED |
| PENDING_MANAGER | deny | the manager | DENIED |

Any move that isn't in this table comes back as `409 INVALID_TRANSITION`. The shift only actually changes hands on approval - that happens in one transaction, and the overlap check runs again at that moment in case things shifted while the request was sitting.

**What a request looks like** (list and detail endpoints include the related shift, position, people, and resolver):

```json
{
  "id": "string",
  "initiatorUserId": "string",
  "shiftId": "string",
  "targetUserId": "string",
  "counterShiftId": "string | null",
  "resolvedByUserId": "string | null",
  "status": "PENDING_EMPLOYEE | PENDING_MANAGER | APPROVED | DENIED | CANCELLED",
  "createdAt": "datetime",
  "respondedAt": "datetime | null",
  "resolvedAt": "datetime | null",
  "shift": {
    "id": "string",
    "startTime": "datetime",
    "endTime": "datetime",
    "position": { "id": "string", "name": "string" }
  },
  "counterShift": {
    "id": "string",
    "startTime": "datetime",
    "endTime": "datetime",
    "position": { "id": "string", "name": "string" }
  },
  "initiator": { "id": "string", "name": "string", "email": "string" },
  "target": { "id": "string", "name": "string", "email": "string" },
  "resolvedBy": { "id": "string", "name": "string", "email": "string" }
}
```

`counterShift` is `null` unless it's a two-way trade. `resolvedBy` is `null` until the swap reaches a final state (approved, denied, or cancelled) - then it's whoever resolved it. The action endpoints below (`respond`, `approve`, `deny`, `cancel`) return the plain request without these extra pieces.

---

### POST /swap-requests

Ask a teammate to take your shift. You have to be assigned to the shift you're offering. The teammate can't already be scheduled during that shift. If you set `counterShiftId`, that shift has to belong to the person you're asking.

**Auth:** required
**Body:** `{ "shiftId": string, "targetUserId": string, "counterShiftId": string | null }`

Returns the new request in `PENDING_EMPLOYEE`. **Errors:** `400 VALIDATION_ERROR` (asking yourself, or a counter-shift that isn't theirs) · `403 NOT_SHIFT_OWNER` · `404` (shift or person not found) · `409 SHIFT_OVERLAP` (the teammate is already scheduled during this shift).

---

### GET /swap-requests?status=&role=

List swap requests. Normally you see any request you're part of - as the asker or the person being asked. Managers can add `role=manager` to see their team's swaps instead (all statuses when no `status` is given, so the client can split them into a queue and a history). Either view can be filtered by `status`.

**Auth:** required

Returns `{ "swapRequests": [ ... ] }`.

---

### GET /swap-requests/:id

Get one request. You can see it if you're involved, or if you manage the team it belongs to.

**Auth:** required

**Errors:** `403` (not involved and not the manager) · `404`.

---

### PATCH /swap-requests/:id/respond

The teammate accepts or declines.

**Auth:** required, must be the person asked
**Body:** `{ "decision": "accept" | "decline" }`

Moves to `PENDING_MANAGER` or `DENIED`. **Errors:** `403 NOT_SWAP_TARGET` · `409 INVALID_TRANSITION`.

---

### PATCH /swap-requests/:id/approve

The manager approves. This reassigns the shift (or shifts) in one transaction.

**Auth:** required, manager of the team

Moves to `APPROVED`. **Errors:** `403 NOT_TEAM_MANAGER` · `409 INVALID_TRANSITION` · `409 SHIFT_OVERLAP` (reassigning would double-book someone; the request stays put).

---

### PATCH /swap-requests/:id/deny

The manager turns it down.

**Auth:** required, manager of the team

Moves to `DENIED`. **Errors:** `403 NOT_TEAM_MANAGER` · `409 INVALID_TRANSITION`.

---

### PATCH /swap-requests/:id/cancel

Pull a pending request back. The requester can cancel their own request; a team manager can also cancel one that's still awaiting the teammate.

**Auth:** required, must be the requester or a manager of the team

Moves to `CANCELLED`. **Errors:** `403 NOT_SWAP_INITIATOR` (not the requester and not a team manager) · `409 INVALID_TRANSITION`.

---

## Notifications

Notifications are saved as they happen and also pushed live over a stream (see the last endpoint). You only ever see your own.

**Types, and who gets them:**

| Type | Sent to | When |
|------|---------|------|
| SWAP_REQUESTED | the target | someone asks them to cover a shift |
| SWAP_INITIATED | the team's managers | a swap is created, for awareness |
| SWAP_ACCEPTED | the initiator, and the managers | the target accepts (managers learn it's ready to approve) |
| SWAP_DENIED | the initiator and target | the target declines, or a manager denies |
| SWAP_APPROVED | the initiator and target | a manager approves |
| SWAP_CANCELLED | the target (and the initiator, if a manager cancelled) | the request is pulled back |

**What one looks like:**

```json
{
  "id": "string",
  "userId": "string",
  "type": "SWAP_REQUESTED | SWAP_INITIATED | SWAP_ACCEPTED | SWAP_DENIED | SWAP_APPROVED | SWAP_CANCELLED",
  "payload": {},
  "read": false,
  "createdAt": "datetime"
}
```

The `payload` carries context for the notification - always the `swapRequestId`, plus the names of the people involved (for example `fromName`, `toName`, or `byName`) so the client can show a readable message without extra lookups.

### GET /notifications?unread=

Your notifications, newest first. Add `unread=true` to see only the ones you haven't read.

**Auth:** required

Returns `{ "notifications": [ ... ] }`.

---

### PATCH /notifications/:id/read

Mark one as read.

**Auth:** required, must be yours

Returns `{ "notification": { ... } }`. **Errors:** `403` · `404`.

---

### PATCH /notifications/read-all

Mark everything read at once.

**Auth:** required

Returns the number updated.

---

### GET /notifications/stream

Open a live stream (Server-Sent Events). The server pushes each new notification down this connection as a `data:` line containing the notification JSON, for as long as you stay connected.

**Auth:** required (via the session cookie)
