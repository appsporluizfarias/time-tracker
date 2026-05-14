import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Apexio Timer API",
    version: "1.0.0",
    description:
      "REST API for the Apexio Timer developer time tracking application.\n\n" +
      "**Authentication:** Generate a Bearer token in *Settings → API Tokens* and include it in the `Authorization` header: `Bearer <token>`\n\n" +
      "**Rate limit:** 100 requests/minute per token.\n\n" +
      "**Admin-only endpoints** are marked with 🔒 and require a token from a user with the `ADMIN` role.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  tags: [
    { name: "Time Entries", description: "Log and manage time entries" },
    {
      name: "Team Management",
      description:
        "🔒 **Admin only.** Manage team members — list, update, approve, block.",
    },
    { name: "Projects", description: "Manage projects" },
    { name: "Clients", description: "Manage clients" },
    { name: "Sprints", description: "Manage sprints" },
    { name: "Tasks", description: "Manage tasks" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API token generated in Settings > API Tokens",
      },
    },
    schemas: {
      TimeEntry: {
        type: "object",
        properties: {
          id: { type: "string" },
          date: { type: "string", format: "date-time" },
          hours: { type: "number", nullable: true },
          description: { type: "string" },
          billable: { type: "boolean" },
          osNumber: {
            type: "string",
            nullable: true,
            description: "OS / ticket number (null if not set)",
            example: "OS-1234",
          },
          startAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Timer start timestamp (set when using the timer)",
          },
          endAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Timer stop timestamp",
          },
          userId: { type: "string" },
          projectId: { type: "string", nullable: true },
          clientId: { type: "string", nullable: true },
          sprintId: { type: "string", nullable: true },
          taskId: { type: "string", nullable: true },
          integratedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Timestamp when this entry was integrated with an external system. null = not yet integrated.",
            example: "2026-05-14T22:30:00.000Z",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", nullable: true },
              email: { type: "string" },
            },
          },
          project: {
            nullable: true,
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              color: { type: "string" },
            },
          },
          client: {
            nullable: true,
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
          sprint: {
            nullable: true,
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
          },
          task: {
            nullable: true,
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
            },
          },
        },
      },
      TeamMember: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", nullable: true },
          email: { type: "string" },
          role: {
            type: "string",
            enum: ["ADMIN", "DEV", "VIEWER"],
          },
          status: {
            type: "string",
            enum: ["active", "pending", "blocked"],
            description:
              "active = approved+active | pending = awaiting approval | blocked = access denied",
          },
          createdAt: { type: "string", format: "date-time" },
          lastLoginAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
        },
      },
      TeamMemberProfile: {
        allOf: [
          { $ref: "#/components/schemas/TeamMember" },
          {
            type: "object",
            properties: {
              totalHours: { type: "number", description: "Sum of all logged hours" },
              entriesCount: { type: "integer", description: "Total number of time entries" },
            },
          },
        ],
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          color: { type: "string" },
          clientId: { type: "string", nullable: true },
        },
      },
      Client: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", nullable: true },
          company: { type: "string", nullable: true },
        },
      },
      Sprint: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          projectId: { type: "string" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: {
            type: "string",
            enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
          },
          projectId: { type: "string" },
          sprintId: { type: "string", nullable: true },
        },
      },
      PaginatedTeam: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/TeamMember" },
          },
          meta: {
            type: "object",
            properties: {
              total: { type: "integer" },
              page: { type: "integer" },
              limit: { type: "integer" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  paths: {
    // ── Time Entries ────────────────────────────────────────────────────────
    "/time-entries": {
      get: {
        summary: "List time entries",
        tags: ["Time Entries"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "startDate",
            schema: { type: "string", format: "date" },
            description: "Filter from date (ISO 8601)",
          },
          {
            in: "query",
            name: "endDate",
            schema: { type: "string", format: "date" },
            description: "Filter to date (ISO 8601)",
          },
          { in: "query", name: "projectId", schema: { type: "string" } },
          {
            in: "query",
            name: "userId",
            schema: { type: "string" },
            description: "Admin/Viewer only",
          },
          {
            in: "query",
            name: "osNumber",
            schema: { type: "string" },
            description: "Partial case-insensitive match (e.g. OS-12 matches OS-1234)",
          },
          {
            in: "query",
            name: "integrated",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Filter by integration status. `true` = only integrated entries (integratedAt is set), `false` = only non-integrated entries (integratedAt is null).",
          },
        ],
        responses: {
          "200": {
            description: "List of time entries",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/TimeEntry" },
                },
                example: [
                  {
                    id: "clx123",
                    date: "2025-04-28T00:00:00.000Z",
                    hours: 2.0,
                    description: "Implementar login OAuth",
                    billable: true,
                    osNumber: "OS-1234",
                    startAt: "2025-04-28T09:00:00.000Z",
                    endAt: "2025-04-28T11:00:00.000Z",
                    integratedAt: null,
                    user: { id: "usr1", name: "João Dev", email: "joao@empresa.com" },
                    project: { id: "prj1", name: "Axia Health", color: "#6366f1" },
                    client: { id: "cli1", name: "Cliente X" },
                    sprint: { id: "spr1", name: "Sprint 3" },
                    task: { id: "tsk1", title: "Auth module" },
                  },
                  {
                    id: "clx456",
                    date: "2026-05-14T00:00:00.000Z",
                    hours: 3.5,
                    description: "Deploy em produção via pipeline",
                    billable: true,
                    osNumber: "OS-5678",
                    startAt: "2026-05-14T14:00:00.000Z",
                    endAt: "2026-05-14T17:30:00.000Z",
                    integratedAt: "2026-05-14T22:30:00.000Z",
                    user: { id: "usr1", name: "João Dev", email: "joao@empresa.com" },
                    project: { id: "prj1", name: "Axia Health", color: "#6366f1" },
                    client: null,
                    sprint: null,
                    task: null,
                  },
                ],
              },
            },
          },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      post: {
        summary: "Create a time entry",
        tags: ["Time Entries"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date"],
                properties: {
                  date: { type: "string", format: "date-time" },
                  hours: { type: "number", minimum: 0.01, maximum: 24 },
                  description: { type: "string" },
                  billable: { type: "boolean", default: false },
                  osNumber: { type: "string", example: "OS-1234" },
                  startAt: { type: "string", format: "date-time" },
                  endAt: { type: "string", format: "date-time" },
                  projectId: { type: "string" },
                  clientId: { type: "string" },
                  sprintId: { type: "string" },
                  taskId: { type: "string" },
                  integratedAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    description: "Set to an ISO 8601 timestamp to mark as integrated, or null to clear.",
                    example: "2026-05-14T22:30:00.000Z",
                  },
                },
              },
              examples: {
                minimal: {
                  summary: "Minimal — só data",
                  value: {
                    date: "2026-05-14T00:00:00.000Z",
                    hours: 1.5,
                    description: "Revisão de código",
                    billable: false,
                  },
                },
                full: {
                  summary: "Completo — com OS e integração",
                  value: {
                    date: "2026-05-14T00:00:00.000Z",
                    hours: 3.0,
                    description: "Deploy em produção via pipeline",
                    billable: true,
                    osNumber: "OS-5678",
                    startAt: "2026-05-14T14:00:00.000Z",
                    endAt: "2026-05-14T17:00:00.000Z",
                    projectId: "prj1",
                    integratedAt: "2026-05-14T22:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created time entry",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TimeEntry" },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/time-entries/{id}": {
      get: {
        summary: "Get a time entry",
        tags: ["Time Entries"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Time entry",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TimeEntry" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        summary: "Update a time entry",
        tags: ["Time Entries"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  date: { type: "string", format: "date-time" },
                  hours: { type: "number" },
                  description: { type: "string" },
                  billable: { type: "boolean" },
                  osNumber: { type: "string", nullable: true },
                  projectId: { type: "string", nullable: true },
                  clientId: { type: "string", nullable: true },
                  sprintId: { type: "string", nullable: true },
                  taskId: { type: "string", nullable: true },
                  integratedAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    description: "Set to an ISO 8601 timestamp to mark as integrated, or null to clear.",
                    example: "2026-05-14T22:30:00.000Z",
                  },
                },
              },
              examples: {
                markIntegrated: {
                  summary: "Marcar como integrado",
                  value: { integratedAt: "2026-05-14T22:30:00.000Z" },
                },
                clearIntegration: {
                  summary: "Remover integração",
                  value: { integratedAt: null },
                },
                updateHours: {
                  summary: "Corrigir horas",
                  value: { hours: 2.5, description: "Revisão de PR" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated time entry",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TimeEntry" },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
    // ── Team Management ─────────────────────────────────────────────────────
    "/team": {
      get: {
        summary: "🔒 List team members",
        description: "**Admin only.** Returns a paginated list of all users.",
        tags: ["Team Management"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "role",
            schema: { type: "string", enum: ["ADMIN", "DEV", "VIEWER"] },
            description: "Filter by role",
          },
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["active", "pending", "blocked"] },
            description: "Filter by status",
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 20, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated team member list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedTeam" },
                example: {
                  data: [
                    {
                      id: "clx...",
                      name: "João Dev",
                      email: "joao@empresa.com",
                      role: "DEV",
                      status: "active",
                      createdAt: "2025-04-01T10:00:00Z",
                      lastLoginAt: "2025-04-28T08:30:00Z",
                    },
                  ],
                  meta: { total: 12, page: 1, limit: 20 },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { $ref: "#/components/responses/AdminOnly" },
        },
      },
    },
    "/team/{id}": {
      get: {
        summary: "🔒 Get team member profile",
        description:
          "**Admin only.** Returns full profile including total logged hours and entry count.",
        tags: ["Team Management"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Team member profile with stats",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TeamMemberProfile" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { $ref: "#/components/responses/AdminOnly" },
          "404": { description: "User not found" },
        },
      },
      patch: {
        summary: "🔒 Update team member",
        description:
          "**Admin only.** Update name, role, or status. Setting `status: blocked` deletes active sessions immediately.",
        tags: ["Team Management"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 1 },
                  role: { type: "string", enum: ["ADMIN", "DEV", "VIEWER"] },
                  status: {
                    type: "string",
                    enum: ["active", "pending", "blocked"],
                    description:
                      "active → approved+active | pending → not approved | blocked → approved but inactive (sessions deleted)",
                  },
                },
              },
              examples: {
                promote: {
                  summary: "Promote to Admin",
                  value: { role: "ADMIN" },
                },
                block: {
                  summary: "Block user",
                  value: { status: "blocked" },
                },
                rename: {
                  summary: "Rename",
                  value: { name: "João Silva" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated team member",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TeamMember" },
              },
            },
          },
          "400": {
            description: "Validation error or self-block attempt",
            content: {
              "application/json": {
                example: { error: "You cannot block your own account." },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { $ref: "#/components/responses/AdminOnly" },
          "404": { description: "User not found" },
        },
      },
    },
    "/team/{id}/approve": {
      post: {
        summary: "🔒 Approve pending user",
        description:
          "**Admin only.** Shortcut to approve a pending registration — sets status to `active`.",
        tags: ["Team Management"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "User approved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TeamMember" },
                example: { id: "clx...", status: "active" },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { $ref: "#/components/responses/AdminOnly" },
          "404": { description: "User not found" },
        },
      },
    },
    "/team/{id}/block": {
      post: {
        summary: "🔒 Block a user",
        description:
          "**Admin only.** Shortcut to block a user — sets status to `blocked` and deletes active sessions. Returns `400` if targeting own account.",
        tags: ["Team Management"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "User blocked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TeamMember" },
                example: { id: "clx...", status: "blocked" },
              },
            },
          },
          "400": {
            description: "Cannot block own account",
            content: {
              "application/json": {
                example: { error: "You cannot block your own account." },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { $ref: "#/components/responses/AdminOnly" },
          "404": { description: "User not found" },
        },
      },
    },
    // ── Projects / Clients / Sprints / Tasks ────────────────────────────────
    "/projects": {
      get: {
        summary: "List projects",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of projects",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Project" } },
              },
            },
          },
        },
      },
    },
    "/clients": {
      get: {
        summary: "List clients",
        tags: ["Clients"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of clients",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Client" } },
              },
            },
          },
        },
      },
    },
    "/sprints": {
      get: {
        summary: "List sprints",
        tags: ["Sprints"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "query", name: "projectId", schema: { type: "string" } }],
        responses: {
          "200": {
            description: "List of sprints",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Sprint" } },
              },
            },
          },
        },
      },
    },
    "/tasks": {
      get: {
        summary: "List tasks",
        tags: ["Tasks"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "projectId", schema: { type: "string" } },
          { in: "query", name: "sprintId", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "List of tasks",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Task" } },
              },
            },
          },
        },
      },
    },
  },
  // Reusable responses
  responses: {
    AdminOnly: {
      description: "Admin access required",
      content: {
        "application/json": {
          example: {
            error: "Admin access required. This endpoint is restricted to Admin users.",
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
