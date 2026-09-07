# LessTaxi Task Manager

A full-stack task management application built for the LessTaxi Software
Engineer Intern technical assignment.

Users organize tasks across To Do, Doing, and Done columns. The application
supports authentication, role-based permissions, task claiming, and
administrator assignment and reassignment.

## Features

- User registration and login.
- Password visibility toggle on authentication forms.
- JWT authentication with backend role-based authorization.
- Administrator creation through a database seed script.
- Task creation, editing, and deletion.
- Drag-and-drop status changes with database persistence.
- Status dropdown as an alternative to dragging.
- Self-assignment of unassigned tasks.
- Administrator assignment, reassignment, and unassignment.
- Administrator list of registered users.
- Responsive task boards.
- Loading, success, and error messages.
- Login and registration rate limits.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, CSS |
| Drag and drop | dnd-kit |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| Validation | express-validator |
| Request limiting | express-rate-limit |

React supports reusable interface components. Express provides REST APIs
and authorization middleware. MongoDB stores users and tasks, while
Mongoose defines schemas and relationships.

The frontend and backend are separate projects within one repository.

## Project Structure

- `frontend/src/pages`: authentication and task-board screens.
- `frontend/src/components`: task action controls.
- `frontend/src/services`: shared API client.
- `backend/src/config`: database and environment configuration.
- `backend/src/controllers`: API request handling.
- `backend/src/middleware`: authentication, errors, and rate limits.
- `backend/src/models`: User and Task schemas.
- `backend/src/routes`: API routes and request validation.
- `backend/src/scripts`: administrator seeding and password reset.
- `backend/src/utils`: JWT generation.

## Roles and Permissions

| Action | Normal user | Administrator |
| --- | --- | --- |
| Create tasks | Yes | Yes |
| View tasks | Created by them, assigned to them, or unassigned | All tasks |
| Claim an unassigned task | For themselves | For themselves |
| Assign or reassign to another account | No | Yes |
| Unassign a task | No | Yes |
| Edit, delete, or change task status | Tasks assigned to them, or their own unassigned tasks | All tasks |
| View the registered-user list | No | Yes |

### Ownership interpretation

An assigned task is managed by its current assignee. Its creator retains
visibility after reassignment but cannot modify it unless they are also
the assignee or an administrator.

The creator can manage a task while it remains unassigned. Any signed-in
user can claim an unassigned task.

The backend enforces these permissions independently of the interface.
Public registration always creates a normal user.

## Local Setup

### Prerequisites

- Node.js and npm compatible with the package engine requirements.
- Git.
- A MongoDB database.
- For MongoDB Atlas: a database user and an IP access-list entry allowing
  your development machine to connect.

### Clone the repository

```powershell
git clone https://github.com/minidumaheesha/lesstaxi-task-management.git
cd lesstaxi-task-management
```

A private repository requires authorized GitHub access.

### Backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Edit `backend/.env` and supply your own configuration:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` locally; `production` when deployed |
| `PORT` | Backend port; defaults to `5000` |
| `CLIENT_URL` | Frontend origin, without a trailing slash |
| `MONGODB_URI` | Private MongoDB connection string |
| `JWT_SECRET` | Random signing secret, at least 32 bytes |
| `JWT_EXPIRES_IN` | Token lifetime, such as `7d` |
| `ADMIN_NAME` | Name used when seeding the administrator |
| `ADMIN_EMAIL` | Administrator email |
| `ADMIN_PASSWORD` | Private password used by admin scripts |

Generate a JWT secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
```

Place the generated value in your private `.env` file.

Start the backend:

```powershell
npm run dev
```

Health endpoint: `http://localhost:5000/api/health`

### Create the administrator

Set the admin variables in `backend/.env`, then run from `backend`:

```powershell
npm run seed:admin
```

The seed creates an administrator if one does not already exist. It
does not promote a normal user or overwrite an existing admin password.

The admin password must contain at least 12 characters, including
uppercase, lowercase, and a number, and must not exceed 72 UTF-8 bytes.

To reset an existing administrator's password, set the new
`ADMIN_PASSWORD` in the private backend environment and run:

```powershell
node src/scripts/resetAdminPassword.js
```

Changing the environment variable alone does not update the stored password.

### Frontend

Open a separate terminal from the repository root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
```

Set:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```powershell
npm run dev
```

Open `http://localhost:5173`. Keep both development servers running.

## API Endpoints

Protected endpoints require:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public, rate limited |
| POST | `/api/auth/login` | Public, rate limited |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/tasks` | Authenticated; results filtered by permissions |
| POST | `/api/tasks` | Authenticated |
| PATCH | `/api/tasks/:id` | Permitted task manager |
| DELETE | `/api/tasks/:id` | Permitted task manager |
| PATCH | `/api/tasks/:id/status` | Permitted task manager |
| PATCH | `/api/tasks/:id/claim` | Authenticated; task must be unassigned |
| GET | `/api/admin/users` | Administrator |
| PATCH | `/api/admin/tasks/:id/assign` | Administrator |

### Request examples

Create a task:

```json
{
  "title": "Build login page",
  "description": "Create and test the login form."
}
```

Change status:

```json
{
  "status": "doing"
}
```

Assign a task:

```json
{
  "assignedUser": "<user-id>"
}
```

Unassign a task:

```json
{
  "assignedUser": null
}
```

Task statuses are `todo`, `doing`, and `done`.

## Database Design

### User

Stores name, unique email, password hash, role, and timestamps.

### Task

Stores title, description, status, creator reference, optional assignee
reference, and timestamps.

Creator and assignee reference User documents. Task indexes support
queries by creator and assignee.

Claiming uses a conditional database update that succeeds only while
the task remains unassigned.

## Security

- Passwords are hashed using bcryptjs.
- Authentication inputs are validated on the backend.
- Password inputs are limited to 72 UTF-8 bytes.
- JWT verification checks algorithm, issuer, audience, and expiry.
- Backend middleware enforces administrator access.
- Task mutations apply permission checks within database queries.
- Registration does not accept a caller-selected role.
- Secrets are supplied through backend environment variables.
- Actual `.env` files are excluded from Git.
- Frontend environment variables contain public configuration only.

Login is limited to 20 requests per 15 minutes per client IP.
Registration is limited to 10 requests per hour per client IP.

Rate limits use in-memory storage and reset on server restart.
Multiple backend instances would require shared rate-limit storage.
Proxy configuration must match the deployment environment.

Tokens are stored in sessionStorage. Logging out removes the browser's
token; it does not revoke an already issued token on the server.
Changing the JWT secret invalidates existing tokens.

## Verification

Run frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

Manual checks performed during development include:

- User registration and login.
- Administrator seed creation and repeat execution.
- Administrator access to the user-list endpoint.
- `403` for normal-user access to administrator endpoints.
- `401` for unauthenticated protected requests.
- Rejection of claims on already assigned tasks.
- Reassignment with permission changes for the previous assignee.
- Authorized task editing and deletion.
- Rejection of unauthorized task changes.
- Rejection of non-string password inputs.
- `429` after the configured login request limit.
- Disabling task movement while editing.

Frontend lint and production build checks passed locally.

Production smoke testing remains pending deployment.

## Deployment

Deployment is in progress. Live URLs and final hosting instructions
will be added before submission.

Deployment configuration must include:

- Backend environment variables and database network access.
- `NODE_ENV=production` on the backend.
- `CLIENT_URL` set to the deployed frontend origin.
- `VITE_API_URL` set to the deployed backend URL ending in `/api`.
- Frontend routing fallback so direct visits to `/login` and
  `/dashboard` serve the application.
- Correct proxy configuration for client-IP rate limiting.

The frontend API URL is included at build time. Rebuild the frontend
after changing it.

## Screenshots

Final application screenshots will be added before submission:

- Login and registration.
- Normal-user task board.
- Administrator board and registered-user list.
- Task assignment and editing.
- Mobile layout.

## Author

Minidu Maheesha Weerasuriya

GitHub: https://github.com/minidumaheesha