# ShiftSync API Contract

All routes are versioned and prefixed with `/api/v1`. Auth uses JWT stored in an httpOnly cookie — no tokens in request/response bodies.

**Roles:** `manager` | `employee` — scoped per-team via `Membership`, not global on `User`.

---

## Auth

### POST `/api/v1/auth/signup`
**Body:** `{ "name": string, "email": string, "password": string }`
**Response 201:** `{ "user": { "id", "name", "email" } }`
**Errors:** `400` validation, `409` email already exists

### POST `/api/v1/auth/login`
**Body:** `{ "email": string, "password": string }`
**Response 200:** `{ "user": { "id", "name", "email" } }` — sets httpOnly JWT cookie
**Errors:** `401` invalid credentials

### POST `/api/v1/auth/logout`
**Response 200:** `{ "message": "Logged out" }` — clears cookie

### GET `/api/v1/auth/me`
**Auth:** required
**Response 200:** `{ "user": { "id", "name", "email" }, "membership": { "teamId", "role" } | null }`
**Errors:** `401` not authenticated

---

## Teams & Membership

### POST `/api/v1/teams`
**Auth:** required (creator becomes `manager`)
**Body:** `{ "name": string }`
**Response 201:** `{ "team": { "id", "name" } }`

### GET `/api/v1/teams/:teamId`
**Auth:** member of team
**Response 200:** `{ "team": { "id", "name", "createdAt" } }`
**Errors:** `403` not a member, `404` team not found

### GET `/api/v1/teams/:teamId/members`
**Auth:** member of team
**Response 200:** `{ "members": [{ "userId", "name", "email", "role" }] }`

### POST `/api/v1/teams/:teamId/members`
**Auth:** manager of team
**Body:** `{ "email": string, "role": "manager" | "employee" }`
**Response 201:** `{ "membership": { "userId", "teamId", "role" } }`
**Errors:** `403` not a manager, `404` user not found, `409` user already has a membership elsewhere (v1 rule)

### PATCH `/api/v1/teams/:teamId/members/:userId`
**Auth:** manager of team
**Body:** `{ "role": "manager" | "employee" }`
**Response 200:** `{ "membership": { "userId", "teamId", "role" } }`

### DELETE `/api/v1/teams/:teamId/members/:userId`
**Auth:** manager of team
**Response 204**

---

## Shifts

### POST `/api/v1/teams/:teamId/shifts`
**Auth:** manager of team
**Body:** `{ "date": string, "startTime": string, "endTime": string, "assignedUserId": string | null }`
**Response 201:** `{ "shift": { "id", "teamId", "date", "startTime", "endTime", "assignedUserId" } }`
**Errors:** `409` overlap — assignedUserId already has a shift in this time range

### GET `/api/v1/teams/:teamId/shifts?from=&to=`
**Auth:** member of team
**Response 200:** `{ "shifts": [ ... ] }`

### GET `/api/v1/shifts/:shiftId`
**Auth:** member of the shift's team
**Response 200:** `{ "shift": { ... } }`
**Errors:** `404`

### PATCH `/api/v1/shifts/:shiftId`
**Auth:** manager of team
**Body:** partial `{ "date"?, "startTime"?, "endTime"?, "assignedUserId"? }`
**Response 200:** `{ "shift": { ... } }`
**Errors:** `409` overlap

### DELETE `/api/v1/shifts/:shiftId`
**Auth:** manager of team
**Response 204**

---

## SwapRequests

**States:** `pending_employee` → `pending_manager` → `approved` | `denied`, plus `cancelled` (only from `pending_employee`, only by initiator).

### POST `/api/v1/swap-requests`
**Auth:** employee, must own the shift
**Body:** `{ "shiftId": string, "targetUserId": string, "counterShiftId": string | null }`
**Response 201:** `{ "swapRequest": { "id", "status": "pending_employee", ... } }`
**Errors:** `403` doesn't own shift, `404` shift/target not found

### GET `/api/v1/swap-requests?status=&role=`
**Auth:** required
**Behavior:** employees see requests where they are initiator or target; managers with `role=manager` see their team's `pending_manager` queue
**Response 200:** `{ "swapRequests": [ ... ] }`

### GET `/api/v1/swap-requests/:id`
**Auth:** initiator, target, or manager of relevant team
**Response 200:** `{ "swapRequest": { ... } }`

### PATCH `/api/v1/swap-requests/:id/respond`
**Auth:** target employee only
**Body:** `{ "decision": "accept" | "decline" }`
**Response 200:** `{ "swapRequest": { "status": "pending_manager" | "denied" } }`
**Errors:** `409` not in `pending_employee` state

### PATCH `/api/v1/swap-requests/:id/approve`
**Auth:** manager of team
**Response 200:** `{ "swapRequest": { "status": "approved" } }` — reassigns shift(s) atomically
**Errors:** `409` not in `pending_manager` state

### PATCH `/api/v1/swap-requests/:id/deny`
**Auth:** manager of team
**Response 200:** `{ "swapRequest": { "status": "denied" } }`

### PATCH `/api/v1/swap-requests/:id/cancel`
**Auth:** initiator only
**Response 200:** `{ "swapRequest": { "status": "cancelled" } }`
**Errors:** `409` not in `pending_employee` state

---

## Notifications

### GET `/api/v1/notifications?unread=`
**Auth:** required
**Response 200:** `{ "notifications": [{ "id", "type", "payload", "read", "createdAt" }] }`

### PATCH `/api/v1/notifications/:id/read`
**Auth:** owner of notification
**Response 200:** `{ "notification": { "read": true } }`

### PATCH `/api/v1/notifications/read-all`
**Auth:** required
**Response 200:** `{ "updated": number }`

### GET `/api/v1/notifications/stream`
**Auth:** required
**Response:** SSE stream (`text/event-stream`) — pushes `Notification` objects as they're created for the connected user

---

## Standard error shape

```json
{ "error": { "message": string, "code": string } }
```

## Status code conventions
- `200` success (read/update), `201` created, `204` deleted (no body)
- `400` validation error, `401` not authenticated, `403` authenticated but not authorized, `404` not found, `409` conflict (state/business rule violation)