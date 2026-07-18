# ShiftSync API Contract

Version: v1
Base URL: `/api/v1`
Content-Type: `application/json`

## Authentication

Session-based via JWT in an httpOnly cookie named `token`. Set on login, cleared on logout. Endpoints marked **Auth: required** return `401 UNAUTHENTICATED` without a valid session.

## Roles

`MANAGER` | `EMPLOYEE` — scoped per team via Membership. v1 restricts each user to one team.

## Error Format

All errors return:

```json
{ "error": { "message": "string", "code": "STRING_CODE" } }
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (read/update) |
| 201 | Resource created |
| 204 | Resource deleted, no body |
| 400 | Invalid request body or parameters |
| 401 | Not authenticated |
| 403 | Authenticated but not permitted |
| 404 | Resource not found |
| 409 | Conflict with current state |

---

## Auth Endpoints

### POST /auth/signup

Create a user account.

| | |
|---|---|
| Auth | none |
| Body | `{ "name": string, "email": string, "password": string }` |

**Response 201**
```json
{ "user": { "id": "string", "name": "string", "email": "string" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 400 VALIDATION_ERROR | Missing name, invalid email, password < 8 chars |
| 409 EMAIL_TAKEN | Email already registered |

---

### POST /auth/login

Authenticate and start a session. Sets `token` cookie.

| | |
|---|---|
| Auth | none |
| Body | `{ "email": string, "password": string }` |

**Response 200**
```json
{ "user": { "id": "string", "name": "string", "email": "string" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 400 VALIDATION_ERROR | Missing fields |
| 401 INVALID_CREDENTIALS | Email or password incorrect |

---

### POST /auth/logout

End the session. Clears `token` cookie.

| | |
|---|---|
| Auth | none |
| Body | none |

**Response 200**
```json
{ "message": "Logged out" }
```

---

### GET /auth/me

Return the current user and their team membership.

| | |
|---|---|
| Auth | required |

**Response 200**
```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "membership": { "teamId": "string", "role": "MANAGER | EMPLOYEE" }
}
```

`membership` is `null` if the user has not joined a team.

---

## Team Endpoints

### POST /teams

Create a team. Creator becomes MANAGER.

| | |
|---|---|
| Auth | required |
| Body | `{ "name": string }` |

**Response 201**
```json
{ "team": { "id": "string", "name": "string" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 409 ALREADY_ON_TEAM | User already belongs to a team |

---

### GET /teams/:teamId

Get team details.

| | |
|---|---|
| Auth | required, team member |

**Response 200**
```json
{ "team": { "id": "string", "name": "string", "createdAt": "datetime" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MEMBER | Requester not on this team |
| 404 TEAM_NOT_FOUND | No such team |

---

### GET /teams/:teamId/members

List team members.

| | |
|---|---|
| Auth | required, team member |

**Response 200**
```json
{ "members": [ { "userId": "string", "name": "string", "email": "string", "role": "MANAGER | EMPLOYEE" } ] }
```

---

### POST /teams/:teamId/members

Add a user to the team by email.

| | |
|---|---|
| Auth | required, team MANAGER |
| Body | `{ "email": string, "role": "MANAGER" \| "EMPLOYEE" }` |

**Response 201**
```json
{ "membership": { "userId": "string", "teamId": "string", "role": "string" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 404 USER_NOT_FOUND | No account with that email |
| 409 ALREADY_ON_TEAM | User already belongs to a team |

---

### PATCH /teams/:teamId/members/:userId

Change a member's role.

| | |
|---|---|
| Auth | required, team MANAGER |
| Body | `{ "role": "MANAGER" \| "EMPLOYEE" }` |

**Response 200**
```json
{ "membership": { "userId": "string", "teamId": "string", "role": "string" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 404 MEMBERSHIP_NOT_FOUND | User not on this team |

---

### DELETE /teams/:teamId/members/:userId

Remove a member from the team.

| | |
|---|---|
| Auth | required, team MANAGER |

**Response 204** — no body

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 404 MEMBERSHIP_NOT_FOUND | User not on this team |

---

## Position Endpoints

A position is a job role within a team (e.g. Cashier, Cook). Positions are defined per team and referenced by shifts. Position names are unique within a team.

### POST /teams/:teamId/positions

Create a position for the team.

| | |
|---|---|
| Auth | required, team MANAGER |
| Body | `{ "name": string }` |

**Response 201**
```json
{ "position": { "id": "string", "teamId": "string", "name": "string", "createdAt": "datetime" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 400 VALIDATION_ERROR | Name missing or empty |
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 409 POSITION_EXISTS | Team already has a position with that name |

---

### GET /teams/:teamId/positions

List the team's positions, sorted by name.

| | |
|---|---|
| Auth | required, team member |

**Response 200**
```json
{ "positions": [ { "id": "string", "teamId": "string", "name": "string", "createdAt": "datetime" } ] }
```

---

### DELETE /teams/:teamId/positions/:positionId

Delete a position. Fails if any shift still references it.

| | |
|---|---|
| Auth | required, team MANAGER |

**Response 204** — no body

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 404 POSITION_NOT_FOUND | No such position on this team |
| 409 POSITION_IN_USE | A shift still uses this position |

---

## Shift Endpoints

A shift belongs to a team, has a required position (job role), and may be assigned to one member or left open (`assignedUserId: null`). A user cannot hold two shifts with overlapping time ranges; operations that would cause this return `409 SHIFT_OVERLAP`.

### POST /teams/:teamId/shifts

Create a shift.

| | |
|---|---|
| Auth | required, team MANAGER |
| Body | `{ "positionId": string, "startTime": datetime, "endTime": datetime, "assignedUserId": string \| null }` |

**Response 201**
```json
{ "shift": { "id": "string", "teamId": "string", "positionId": "string", "startTime": "datetime", "endTime": "datetime", "assignedUserId": "string | null" } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 400 VALIDATION_ERROR | Invalid dates or startTime >= endTime |
| 400 POSITION_NOT_FOUND | positionId not found on this team |
| 400 NOT_TEAM_MEMBER | assignedUserId not on this team |
| 409 SHIFT_OVERLAP | Assignee has an overlapping shift |

---

### GET /teams/:teamId/shifts?from=&to=

List team shifts, optionally windowed by date range. Sorted by startTime ascending.

| | |
|---|---|
| Auth | required, team member |
| Query | `from` (datetime, optional), `to` (datetime, optional) |

**Response 200**
```json
{ "shifts": [ { "id": "string", "teamId": "string", "positionId": "string", "startTime": "datetime", "endTime": "datetime", "assignedUser": { "id": "string", "name": "string" } } ] }
```

`assignedUser` is `null` for open shifts.

---

### GET /shifts/:shiftId

Get a single shift.

| | |
|---|---|
| Auth | required, member of shift's team |

**Response 200** — same shift shape as above

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MEMBER | Requester not on shift's team |
| 404 SHIFT_NOT_FOUND | No such shift |

---

### PATCH /shifts/:shiftId

Update a shift. Partial body; omitted fields are unchanged. `assignedUserId: null` explicitly unassigns.

| | |
|---|---|
| Auth | required, MANAGER of shift's team |
| Body | `{ "positionId"?: string, "startTime"?: datetime, "endTime"?: datetime, "assignedUserId"?: string \| null }` |

**Response 200** — updated shift

**Errors**
| Code | Condition |
|------|-----------|
| 400 VALIDATION_ERROR | Invalid dates or startTime >= endTime |
| 400 POSITION_NOT_FOUND | positionId not found on this team |
| 400 NOT_TEAM_MEMBER | assignedUserId not on this team |
| 404 SHIFT_NOT_FOUND | No such shift |
| 409 SHIFT_OVERLAP | Assignee has an overlapping shift |

---

### DELETE /shifts/:shiftId

Delete a shift.

| | |
|---|---|
| Auth | required, MANAGER of shift's team |

**Response 204** — no body

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 404 SHIFT_NOT_FOUND | No such shift |

---

## Swap Request Endpoints

A swap request proposes transferring the initiator's shift to a target user. If `counterShiftId` is set, the target's shift transfers to the initiator in the same operation (two-way trade).

**State machine:**

| State | Meaning |
|-------|---------|
| PENDING_EMPLOYEE | Awaiting target's response |
| PENDING_MANAGER | Target accepted; awaiting manager |
| APPROVED | Manager approved; shifts reassigned |
| DENIED | Target declined or manager denied |
| CANCELLED | Initiator withdrew before target responded |

**Transitions:**

| From | Action | Actor | To |
|------|--------|-------|-----|
| PENDING_EMPLOYEE | respond (accept) | target | PENDING_MANAGER |
| PENDING_EMPLOYEE | respond (decline) | target | DENIED |
| PENDING_EMPLOYEE | cancel | initiator | CANCELLED |
| PENDING_MANAGER | approve | manager | APPROVED |
| PENDING_MANAGER | deny | manager | DENIED |

Any action outside these transitions returns `409 INVALID_TRANSITION`. Shift reassignment happens only on approval, atomically, with the overlap check re-run at that moment.

**Object shape:**
```json
{
  "id": "string",
  "initiatorUserId": "string",
  "shiftId": "string",
  "targetUserId": "string",
  "counterShiftId": "string | null",
  "status": "PENDING_EMPLOYEE | PENDING_MANAGER | APPROVED | DENIED | CANCELLED",
  "createdAt": "datetime",
  "respondedAt": "datetime | null",
  "resolvedAt": "datetime | null"
}
```

### POST /swap-requests

Create a swap request. Initiator must be assigned to `shiftId`; if `counterShiftId` is set, target must be assigned to it.

| | |
|---|---|
| Auth | required |
| Body | `{ "shiftId": string, "targetUserId": string, "counterShiftId": string \| null }` |

**Response 201** — swap request object, status `PENDING_EMPLOYEE`

**Errors**
| Code | Condition |
|------|-----------|
| 400 VALIDATION_ERROR | Target is self, or counterShift not owned by target |
| 403 NOT_SHIFT_OWNER | Initiator not assigned to shiftId |
| 404 | Shift or target user not found |

---

### GET /swap-requests?status=&role=

List swap requests. Employees see requests where they are initiator or target. Managers passing `role=manager` see their team's PENDING_MANAGER queue. `status` filters either view.

| | |
|---|---|
| Auth | required |
| Query | `status` (optional), `role` (optional, `manager`) |

**Response 200**
```json
{ "swapRequests": [ ... ] }
```

---

### GET /swap-requests/:id

Get a single swap request.

| | |
|---|---|
| Auth | required; initiator, target, or MANAGER of relevant team |

**Response 200** — swap request object

**Errors**
| Code | Condition |
|------|-----------|
| 403 | Requester not involved and not a manager |
| 404 | No such request |

---

### PATCH /swap-requests/:id/respond

Target accepts or declines.

| | |
|---|---|
| Auth | required, target only |
| Body | `{ "decision": "accept" \| "decline" }` |

**Response 200** — status `PENDING_MANAGER` or `DENIED`

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_SWAP_TARGET | Requester is not the target |
| 409 INVALID_TRANSITION | Not in PENDING_EMPLOYEE |

---

### PATCH /swap-requests/:id/approve

Manager approves. Reassigns shift(s) atomically.

| | |
|---|---|
| Auth | required, MANAGER of relevant team |

**Response 200** — status `APPROVED`

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 409 INVALID_TRANSITION | Not in PENDING_MANAGER |
| 409 SHIFT_OVERLAP | Reassignment would double-book; request stays PENDING_MANAGER |

---

### PATCH /swap-requests/:id/deny

Manager denies.

| | |
|---|---|
| Auth | required, MANAGER of relevant team |

**Response 200** — status `DENIED`

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_TEAM_MANAGER | Requester not a manager |
| 409 INVALID_TRANSITION | Not in PENDING_MANAGER |

---

### PATCH /swap-requests/:id/cancel

Initiator withdraws the request.

| | |
|---|---|
| Auth | required, initiator only |

**Response 200** — status `CANCELLED`

**Errors**
| Code | Condition |
|------|-----------|
| 403 NOT_SWAP_INITIATOR | Requester is not the initiator |
| 409 INVALID_TRANSITION | Not in PENDING_EMPLOYEE |

---

## Notification Endpoints

Notifications are persisted rows delivered live over SSE when the user is connected. Users only ever access their own notifications.

**Object shape:**
```json
{
  "id": "string",
  "userId": "string",
  "type": "SWAP_REQUESTED | SWAP_ACCEPTED | SWAP_DENIED | SWAP_APPROVED | SWAP_CANCELLED",
  "payload": {},
  "read": false,
  "createdAt": "datetime"
}
```

### GET /notifications?unread=

List the current user's notifications, newest first.

| | |
|---|---|
| Auth | required |
| Query | `unread` (optional, `true` filters to unread) |

**Response 200**
```json
{ "notifications": [ ... ] }
```

---

### PATCH /notifications/:id/read

Mark one notification read.

| | |
|---|---|
| Auth | required, owner only |

**Response 200**
```json
{ "notification": { "id": "string", "read": true } }
```

**Errors**
| Code | Condition |
|------|-----------|
| 403 | Not the owner |
| 404 | No such notification |

---

### PATCH /notifications/read-all

Mark all of the current user's notifications read.

| | |
|---|---|
| Auth | required |

**Response 200**
```json
{ "updated": 0 }
```

---

### GET /notifications/stream

Open an SSE connection (`Content-Type: text/event-stream`). Server pushes each new notification for the authenticated user as it is created.

| | |
|---|---|
| Auth | required |

**Response** — SSE stream of notification objects