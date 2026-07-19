# DOC-002: ZayJar System Architecture

## Document Control

| Field | Value |
| --- | --- |
| Document ID | DOC-002 |
| Document Title | ZayJar System Architecture |
| Product | ZayJar Restaurant SaaS Platform |
| Version | 1.0 |
| Status | Official Draft |
| Classification | Internal Engineering Architecture |
| Owner | ZayJar Engineering |
| Intended Audience | Engineering, Architecture, Security, DevOps, QA, Product, and Technical Operations |
| Created Date | 2026-07-19 |
| Repository Location | `docs/DOC-002-System-Architecture.md` |
| Parent Specification | `docs/DOC-001-Master-Project-Specification.md` |

## Table of Contents

1. [Purpose](#1-purpose)
2. [Architecture Principles](#2-architecture-principles)
3. [Overall Architecture](#3-overall-architecture)
4. [Multi-Tenant Architecture](#4-multi-tenant-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [API Architecture](#7-api-architecture)
8. [Database Architecture](#8-database-architecture)
9. [Authentication Architecture](#9-authentication-architecture)
10. [Authorization Architecture](#10-authorization-architecture)
11. [File Storage Architecture](#11-file-storage-architecture)
12. [Caching Architecture](#12-caching-architecture)
13. [Queue System](#13-queue-system)
14. [Background Jobs](#14-background-jobs)
15. [Notifications](#15-notifications)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Scaling Strategy](#17-scaling-strategy)
18. [Security Architecture](#18-security-architecture)
19. [Observability and Operations](#19-observability-and-operations)
20. [Architecture Decision Guidance](#20-architecture-decision-guidance)

## 1. Purpose

This document defines the system architecture for the ZayJar Restaurant SaaS Platform. It translates the product and engineering direction established in DOC-001 into a practical architecture model for implementation, deployment, operation, scaling, and future extension.

DOC-002 is a system-level architecture document. It does not replace detailed API specifications, database schema documentation, infrastructure-as-code definitions, security runbooks, or implementation tickets. Instead, it defines the architectural boundaries and responsibilities that those future documents must follow.

The architecture described here assumes ZayJar is a multi-tenant SaaS platform serving multiple independent restaurants from shared platform infrastructure while preserving strict restaurant isolation.

## 2. Architecture Principles

ZayJar must be built around a small set of durable architecture principles. These principles apply across frontend, backend, database, infrastructure, security, and operations work.

### 2.1 Tenant Isolation First

Restaurant isolation is the highest-priority architecture requirement. Every tenant-owned record, request, job, notification, cache entry, file, and report must be associated with a tenant context where applicable. The system must prevent one restaurant from reading, modifying, deleting, inferring, or operationally affecting another restaurant's private data.

### 2.2 Modular Platform Design

The initial system should favor a modular monolith or clearly modular service design before introducing unnecessary distributed complexity. Modules must have explicit domain responsibilities and must avoid uncontrolled coupling between tenant management, catalog, ordering, subscription, administration, notifications, and reporting concerns.

### 2.3 Server-Side Enforcement

Security, tenant isolation, subscription entitlements, and authorization must be enforced by backend services. Frontend logic may improve usability by hiding unavailable controls, but it must never be the only enforcement layer.

### 2.4 Operational Readiness

The platform must be observable, deployable, recoverable, and supportable. Logs, metrics, backups, health checks, migrations, and incident workflows are part of the architecture, not optional operational extras.

### 2.5 Evolution Without Rewrite

The architecture must support future growth into advanced modules such as payments, delivery integrations, analytics, loyalty, marketing automation, kitchen workflows, and multi-location restaurant groups. The system should allow these capabilities to be added without rewriting the core tenant, catalog, order, and subscription foundation.

## 3. Overall Architecture

ZayJar is organized as a layered SaaS system with customer-facing, restaurant-facing, platform-facing, application, domain, persistence, integration, and operations layers.

### 3.1 Logical Architecture Layers

The platform contains the following logical layers:

| Layer | Responsibility |
| --- | --- |
| Customer Storefront | Public restaurant experiences used by customers to browse restaurants, view menu items, and place orders. |
| Restaurant Administration | Tenant-specific management interface for restaurant owners, managers, and staff. |
| Platform Administration | Internal SaaS control plane for tenant, subscription, support, and operational administration. |
| API Layer | Validates requests, resolves tenant context, authenticates users, authorizes actions, and exposes platform capabilities to clients. |
| Domain Layer | Implements business rules for tenants, restaurants, catalog, orders, subscriptions, users, notifications, and reporting. |
| Persistence Layer | Stores relational data, audit records, job state, configuration, and tenant-owned operational records. |
| Integration Layer | Connects to external services such as payment providers, notification providers, analytics tools, and delivery systems. |
| Operations Layer | Provides logging, metrics, tracing, deployment, backup, incident response, and system administration capabilities. |

### 3.2 Recommended Initial Deployment Shape

The recommended initial deployment shape is:

- A web frontend application for customer storefront and administration views.
- A backend API application for business logic and data access.
- A relational database for transactional data.
- Object storage for uploaded files and generated assets.
- A cache service for temporary and derived data.
- A queue service for asynchronous work.
- Background workers for jobs and notification delivery.
- Centralized logging and monitoring.

This architecture may run as a small number of deployable services at first. It should be structured so that high-load areas can later be separated into independent services if needed.

### 3.3 Primary Runtime Flows

Core user flows should follow predictable request paths:

1. A client sends a request to the frontend or API.
2. The API authenticates the caller when required.
3. The API resolves tenant context from route, domain, session, token, or administrative selection.
4. The API authorizes the action for the actor and tenant.
5. The domain layer applies business rules.
6. The persistence layer reads or writes tenant-scoped data.
7. The API emits domain events or queue jobs where asynchronous work is required.
8. The response returns only data permitted for the caller and tenant.

### 3.4 Architectural Boundaries

The following boundaries must be preserved:

- Frontend components must not directly access the database.
- API handlers must not bypass authorization for tenant-scoped actions.
- Domain logic must not be scattered across unrelated UI components.
- Background jobs must not process tenant-owned data without tenant context.
- Platform administration must remain separate from restaurant administration.
- Integration failures must not corrupt core transactional data.

## 4. Multi-Tenant Architecture

ZayJar's multi-tenant architecture is based on shared infrastructure with strict logical isolation. A restaurant is the primary tenant unit.

### 4.1 Tenant Model

A tenant represents a restaurant business operating on the platform. Each tenant owns:

- Restaurant profile and configuration.
- Menu or product catalog.
- Orders and order history.
- Restaurant users and role assignments.
- Subscription state and entitlements.
- Uploaded assets and tenant-specific files.
- Tenant-specific notification and integration settings.
- Tenant-specific reporting data.

### 4.2 Tenant Context Resolution

Tenant context may be resolved from:

- Public storefront slug or domain.
- Authenticated restaurant user membership.
- Platform administrator selection.
- API route parameters validated against authorization.
- Background job payloads containing validated tenant identifiers.
- Webhook mappings to tenant-owned integration records.

Tenant context must be explicit before any tenant-scoped operation executes.

### 4.3 Tenant Identifier Requirements

Every tenant-owned record must include a stable tenant identifier unless the record is intentionally global. Tenant identifiers must be opaque to customers and must not be treated as sufficient proof of access.

Tenant identifiers must be used for:

- Query scoping.
- Authorization decisions.
- Cache key namespacing.
- File storage namespacing.
- Queue job scoping.
- Audit logging.
- Reporting aggregation.

### 4.4 Shared Infrastructure Rules

ZayJar may use shared compute, database, object storage, cache, queues, and monitoring infrastructure. Shared infrastructure is acceptable only when logical isolation is enforced at every access boundary.

The platform must avoid:

- Global queries that return tenant-owned data without tenant filters.
- Cache keys that can collide across tenants.
- File paths that mix tenant assets without namespace controls.
- Background jobs that process tenant data without tenant identifiers.
- Admin routes that silently bypass tenant controls.

### 4.5 Tenant Lifecycle Architecture

Tenant lifecycle states should be represented as explicit states rather than ad hoc flags. Recommended states include prospect, trial, active, suspended, cancelled, and archived.

Tenant lifecycle must influence:

- Storefront visibility.
- Ordering availability.
- Restaurant administration access.
- Subscription enforcement.
- Billing workflows.
- Support and platform administration actions.
- Background job eligibility.

## 5. Frontend Architecture

The frontend architecture must support customer storefronts, restaurant administration, and platform administration while keeping role and tenant boundaries clear.

### 5.1 Frontend Applications

ZayJar may implement frontend capabilities as one application with separate route groups or as separate applications. The recommended initial approach is a single frontend codebase with clear modules for:

- Public storefront.
- Restaurant admin portal.
- Platform admin portal.
- Shared UI components.
- Authentication and session handling.
- API client utilities.

If the platform grows, the admin and storefront experiences may be split into independently deployed frontend applications.

### 5.2 Public Storefront Frontend

The storefront frontend is responsible for customer-facing restaurant experiences.

Responsibilities:

- Resolve restaurant by slug, domain, or route.
- Display public restaurant profile information.
- Display active menu items and categories.
- Show availability and operating state.
- Support order creation flows.
- Show customer-facing confirmation and status information where supported.

The storefront must never expose restaurant administrative controls or private operational fields.

### 5.3 Restaurant Admin Frontend

The restaurant admin frontend is responsible for tenant operations.

Responsibilities:

- Manage restaurant profile settings.
- Manage menu items, prices, categories, images, and availability.
- View and process orders.
- Manage staff access where supported.
- View tenant-specific reports.
- Display subscription status and plan limitations where appropriate.

Restaurant admin views must be tenant-aware and must clearly show which restaurant is active when a user has access to multiple restaurants.

### 5.4 Platform Admin Frontend

The platform admin frontend is an internal control plane.

Responsibilities:

- Manage tenant records.
- Review subscription state.
- Suspend, reactivate, or archive restaurants.
- Support onboarding workflows.
- Investigate operational issues.
- View platform-level health and support indicators.

Platform admin routes must require privileged access and must not be available to ordinary restaurant users.

### 5.5 Frontend State Management

Frontend state should separate:

- Authentication session state.
- Active tenant context.
- UI state.
- Server-derived resource state.
- Form state.

Tenant context must not be stored only in local browser state. The backend must validate tenant access on every privileged request.

### 5.6 Frontend API Client

The frontend API client should provide:

- Consistent request formatting.
- Authentication token or cookie handling.
- Standard error handling.
- Tenant-aware request construction.
- Retry behavior only for safe operations.
- Clear handling of authorization, subscription, and validation failures.

The frontend must avoid retrying non-idempotent operations such as order creation unless the backend supports idempotency keys.

## 6. Backend Architecture

The backend is the authoritative enforcement layer for business rules, tenant isolation, authentication, authorization, subscription entitlements, and data integrity.

### 6.1 Backend Application Structure

The recommended backend structure is modular and domain-oriented:

| Module | Responsibility |
| --- | --- |
| Identity | Authentication, sessions, account recovery, identity provider integration. |
| Access Control | Role definitions, permission checks, tenant membership, platform admin privileges. |
| Tenant Management | Tenant creation, lifecycle, tenant metadata, active tenant context. |
| Restaurant Profile | Restaurant name, public details, operating state, brand configuration. |
| Catalog | Menu items, categories, availability, pricing, item images. |
| Orders | Cart/order creation, order lifecycle, order history, operational status. |
| Subscription | Plans, subscription states, entitlements, billing integration hooks. |
| Files | Upload validation, storage keys, asset metadata, access checks. |
| Notifications | Notification preferences, templates, delivery orchestration. |
| Jobs | Background job scheduling, execution, retries, dead-letter handling. |
| Reporting | Tenant and platform metrics, reporting queries, aggregation rules. |
| Audit | Security and administrative event recording. |

### 6.2 Backend Layering

Backend modules should follow a consistent internal pattern:

- Routes or controllers receive requests.
- Request validators validate structure and types.
- Authentication middleware identifies the actor.
- Tenant resolution middleware establishes tenant context where required.
- Authorization services decide whether the action is permitted.
- Domain services execute business logic.
- Repositories or data access services perform database operations.
- Events or jobs are emitted for asynchronous work.
- Responses are normalized before returning to clients.

### 6.3 Domain Service Responsibilities

Domain services must contain core business rules. Examples include:

- A suspended tenant cannot accept new customer orders.
- A restaurant manager cannot update another restaurant's menu item.
- A menu item cannot be deleted if historical order records require it; it should be deactivated instead.
- Subscription entitlements determine access to plan-limited features.
- Order status transitions must follow a valid lifecycle.

### 6.4 Error Handling

The backend must distinguish between:

- Validation errors.
- Authentication failures.
- Authorization failures.
- Tenant not found errors.
- Subscription restriction errors.
- Conflict errors.
- External integration failures.
- Unexpected server errors.

Error responses should be safe, consistent, and not disclose sensitive tenant or system details.

## 7. API Architecture

The API architecture must expose ZayJar capabilities through controlled, versionable, tenant-aware interfaces.

### 7.1 API Style

The initial API may be REST-style, RPC-style, or a structured hybrid, provided it meets these requirements:

- Consistent resource naming.
- Consistent authentication behavior.
- Server-side authorization.
- Tenant-aware access patterns.
- Predictable error responses.
- Input validation for every write operation.
- Stable contracts for frontend clients.

REST-style endpoints are recommended for foundational CRUD and operational resources.

### 7.2 API Resource Groups

Recommended API groups include:

- `/auth` for authentication and session operations.
- `/tenants` or `/restaurants` for tenant and restaurant profile operations.
- `/catalog` or `/restaurants/{restaurantId}/items` for menu management.
- `/orders` for order creation and order lifecycle operations.
- `/subscriptions` for plans, states, and entitlements.
- `/admin` for platform administration.
- `/files` for uploads and asset metadata.
- `/notifications` for preferences and delivery state.
- `/reports` for analytics and summaries.

Endpoint naming may change during detailed API design, but the separation of responsibilities must remain clear.

### 7.3 Tenant-Scoped API Requirements

Every tenant-scoped API must:

- Resolve tenant context.
- Verify the actor is allowed to access that tenant.
- Filter data by tenant identifier.
- Return only tenant-permitted fields.
- Apply subscription restrictions where relevant.
- Record audit events for sensitive actions.

### 7.4 Public API Requirements

Public storefront APIs may be unauthenticated, but they must still be tenant-scoped. Public APIs must return only data intended for customers.

Public APIs must not expose:

- Internal tenant identifiers unless explicitly safe.
- Administrative notes.
- Subscription billing details.
- Private customer data.
- Staff user records.
- Platform operational metadata.

### 7.5 Idempotency

APIs that create orders, process payments, consume webhooks, or enqueue important jobs should support idempotency. Idempotency prevents duplicate business effects when clients retry requests or external providers resend events.

### 7.6 API Versioning

The platform should support API versioning before public external integrations depend on it. Internal frontend APIs may evolve faster, but external APIs and webhook contracts must be versioned and documented.

## 8. Database Architecture

The database architecture must support transactional correctness, tenant isolation, operational reporting, and future growth.

### 8.1 Recommended Database Model

A relational database is recommended for the primary transactional store because the platform depends on structured relationships between tenants, users, menu items, orders, subscriptions, and audit records.

The database should support:

- Transactions.
- Foreign keys where appropriate.
- Tenant-aware indexes.
- Schema migrations.
- Backup and restore procedures.
- Read replicas when scaling requires them.

### 8.2 Core Data Domains

Core data domains include:

- Tenants or restaurants.
- Restaurant profiles.
- Users and identities.
- Tenant memberships and roles.
- Menu items and categories.
- Orders and order line items.
- Subscription plans and subscriptions.
- Entitlements.
- File metadata.
- Notification records.
- Audit events.
- Background job records where needed.

### 8.3 Tenant-Aware Schema Rules

Tenant-owned tables must include a tenant identifier. Examples include:

- Menu items.
- Categories.
- Orders.
- Order line items.
- Restaurant settings.
- Staff memberships.
- File metadata.
- Notification preferences.
- Tenant reports.

Global tables may include:

- Platform plan definitions.
- System configuration.
- Global feature flags.
- Platform administrator identities.

Global tables must be intentionally designed and reviewed.

### 8.4 Indexing Strategy

Indexes should support common tenant-scoped access patterns:

- Tenant plus status.
- Tenant plus created date.
- Tenant plus updated date.
- Tenant plus slug or public identifier.
- Tenant plus item availability.
- Tenant plus order status.
- Tenant plus subscription state.

Indexes should be reviewed as real usage and query patterns become available.

### 8.5 Migration Strategy

Database migrations must be versioned, repeatable, and safe for production deployment. Migrations should avoid long locks on high-volume tables and should be designed with rollback or forward-fix procedures.

Schema changes that affect tenant isolation must receive additional review.

### 8.6 Data Retention

Retention policies must be defined for:

- Orders.
- Customer details.
- Audit logs.
- Notification delivery records.
- Job execution records.
- Uploaded files.
- Deleted or archived tenants.

Retention policies must balance business needs, support needs, privacy obligations, and storage cost.

## 9. Authentication Architecture

Authentication establishes the identity of administrative users, restaurant users, platform operators, and integration callers.

### 9.1 Authentication Requirements

The platform must authenticate all privileged users before allowing access to restaurant administration or platform administration capabilities.

Authentication should support:

- Secure sign-in.
- Session management.
- Password reset or account recovery.
- Strong password handling if passwords are used.
- Optional multi-factor authentication for privileged roles.
- External identity provider integration where future requirements justify it.

### 9.2 Session Model

The session model may use secure cookies, bearer tokens, or a managed identity provider. Regardless of mechanism, sessions must:

- Identify the actor.
- Expire according to policy.
- Be revocable where practical.
- Protect against common session attacks.
- Avoid storing sensitive secrets in client-accessible storage.

### 9.3 Identity Records

Identity records should be distinct from tenant membership records. A user identity may be associated with one or more restaurant tenants through membership records and roles.

This separation supports:

- Users who manage multiple restaurants.
- Platform administrators who do not belong to a restaurant tenant.
- Future organization or restaurant group models.
- Clear audit trails.

### 9.4 Integration Authentication

External systems must authenticate through provider-specific mechanisms such as signed webhooks, API keys, OAuth, or mutual credentials. Webhook authentication must be verified before processing business effects.

## 10. Authorization Architecture

Authorization determines what an authenticated actor may do in a specific context.

### 10.1 Authorization Model

ZayJar should use role-based access control with tenant-aware permission checks. The model should support platform roles, restaurant roles, and system roles.

Recommended role categories:

- Platform owner.
- Platform administrator.
- System operator.
- Restaurant owner.
- Restaurant manager.
- Restaurant staff.
- Customer or public user.
- Integration actor.

### 10.2 Authorization Decision Inputs

Authorization decisions must consider:

- Actor identity.
- Actor role.
- Tenant context.
- Resource ownership.
- Requested action.
- Subscription state.
- Feature entitlement.
- Operational status.

A role alone is not enough. For example, a restaurant manager role must be evaluated against the specific tenant being accessed.

### 10.3 Permission Enforcement Points

Authorization must be enforced at:

- API middleware or route guards.
- Domain service methods for sensitive actions.
- Repository query scopes where practical.
- Background job execution for tenant-owned records.
- File access and signed URL generation.
- Platform administration actions.

### 10.4 Denial Behavior

When authorization fails, the system should return safe responses. It should avoid revealing whether a resource exists in another tenant unless the actor has permission to know that.

## 11. File Storage Architecture

File storage supports restaurant logos, menu item images, brand assets, exports, generated reports, and future uploaded documents.

### 11.1 Storage Provider

The recommended architecture uses object storage rather than local server disk for persistent files. Object storage may be provided by a cloud provider, managed storage service, or compatible self-hosted storage.

### 11.2 File Namespacing

Files must be namespaced by tenant where tenant-owned. Recommended key structure:

`tenants/{tenantId}/{assetType}/{fileId}`

Examples:

- `tenants/{tenantId}/logos/{fileId}`
- `tenants/{tenantId}/menu-items/{fileId}`
- `tenants/{tenantId}/reports/{fileId}`

Platform-owned assets may use a separate namespace such as `platform/{assetType}/{fileId}`.

### 11.3 File Metadata

The database should store file metadata including:

- File identifier.
- Tenant identifier where applicable.
- Storage key.
- Original filename.
- Content type.
- Size.
- Checksum where supported.
- Uploading actor.
- Created date.
- Access classification.

### 11.4 Access Control for Files

File access must be mediated by the backend or by short-lived signed URLs. The system must not expose unrestricted storage buckets for private tenant files.

Public restaurant images may be made publicly cacheable if explicitly classified as public assets. Private exports, reports, and administrative documents must remain restricted.

### 11.5 Upload Validation

Uploads must be validated for:

- Allowed content type.
- Maximum file size.
- Expected asset category.
- Tenant ownership.
- Malware scanning where required by future policy.

## 12. Caching Architecture

Caching improves performance but must never weaken tenant isolation or authorization.

### 12.1 Cache Use Cases

Recommended cache use cases include:

- Public restaurant profile data.
- Public menu data.
- Subscription entitlement snapshots.
- Session or token metadata.
- Rate limiting counters.
- Short-lived computed reports.
- Integration lookup data.

### 12.2 Cache Key Rules

Tenant-owned cache entries must include tenant identifiers in cache keys. Example:

`tenant:{tenantId}:menu:active`

Cache keys must also include relevant dimensions such as locale, visibility, role, or plan when those dimensions affect output.

### 12.3 Cache Invalidation

Cache invalidation must occur when source data changes. Examples:

- Menu cache invalidates when menu items change.
- Restaurant profile cache invalidates when public profile fields change.
- Entitlement cache invalidates when subscription state changes.
- Report cache invalidates when underlying order data changes or reaches expiry.

### 12.4 Security Considerations

Private data must not be stored in broadly shared caches without access controls and expiration. Cache entries must not allow a user from one tenant to receive data generated for another tenant.

## 13. Queue System

The queue system supports asynchronous and resilient processing for tasks that should not block customer or administrator requests.

### 13.1 Queue Use Cases

Recommended queue use cases include:

- Notification delivery.
- Image processing.
- Report generation.
- Webhook processing.
- Billing synchronization.
- Order event fanout.
- Audit enrichment.
- Integration retries.

### 13.2 Queue Payload Requirements

Queue payloads must include:

- Job type.
- Tenant identifier where applicable.
- Actor identifier where applicable.
- Resource identifiers.
- Idempotency key where needed.
- Attempt count or retry metadata.
- Created timestamp.

Queue payloads should avoid storing large sensitive objects. Workers should fetch current data from the database using tenant-scoped access patterns when practical.

### 13.3 Retry and Dead-Letter Strategy

Jobs should have bounded retries. Failed jobs that exceed retry limits should move to a dead-letter queue or failed-job store for investigation.

Retry behavior must avoid duplicate business effects. Jobs that call external systems should use idempotency where possible.

### 13.4 Queue Isolation

Queue workers may process jobs for multiple tenants, but each job must carry tenant context. A failure for one tenant's job must not block processing for all other tenants.

## 14. Background Jobs

Background jobs execute asynchronous work outside the request-response path.

### 14.1 Job Categories

Recommended job categories include:

- Immediate jobs for near-real-time notifications and order events.
- Scheduled jobs for subscription checks, cleanup, and reporting.
- Batch jobs for exports and analytics.
- Retry jobs for external integration recovery.
- Maintenance jobs for data hygiene and cache refresh.

### 14.2 Job Execution Requirements

Background jobs must:

- Load tenant context before processing tenant-owned resources.
- Revalidate resource state before applying changes.
- Be idempotent where repeated execution is possible.
- Record failures in logs or job state.
- Respect subscription and lifecycle state when applicable.
- Avoid long-running locks on transactional tables.

### 14.3 Scheduled Jobs

Scheduled jobs may include:

- Subscription state reconciliation.
- Trial expiration checks.
- Past-due subscription handling.
- Report precomputation.
- Stale upload cleanup.
- Notification retry cleanup.
- Audit log retention processing.

Scheduled jobs must be designed so that only one active scheduler performs a given global task at a time, or the job must be safe for concurrent execution.

## 15. Notifications

Notifications support operational and customer communication. They may be delivered through email, SMS, in-app messages, push notifications, or webhooks depending on future product decisions.

### 15.1 Notification Types

Potential notification types include:

- Order confirmation.
- Order status update.
- New order alert for restaurant staff.
- Subscription status notification.
- Account invitation.
- Password reset or account recovery.
- Operational alerts for platform administrators.
- Integration failure alerts.

### 15.2 Notification Architecture

Notification delivery should use a queued architecture:

1. Domain event occurs.
2. Notification service determines eligible recipients and channels.
3. Notification record is created.
4. Queue job is scheduled for delivery.
5. Worker sends notification through provider.
6. Delivery result is recorded.
7. Failed deliveries retry according to policy.

### 15.3 Tenant-Aware Notification Rules

Notifications must be tenant-aware. A notification generated for one restaurant must never be sent to another restaurant's staff or customers.

Notification templates and preferences may be tenant-specific. Tenant-specific customization must be validated and sanitized before use.

### 15.4 Notification Provider Abstraction

The platform should isolate notification providers behind internal interfaces so providers can be changed or expanded without rewriting domain workflows.

Provider integrations should support:

- Authentication and secret management.
- Rate-limit handling.
- Retry-safe delivery behavior.
- Delivery status tracking.
- Failure logging.

## 16. Deployment Architecture

Deployment architecture defines how ZayJar is released, hosted, configured, monitored, and recovered.

### 16.1 Environments

Recommended environments include:

- Local development.
- Test or CI environment.
- Staging environment.
- Production environment.

Each environment must have separate configuration and data. Production data must not be copied into lower environments unless sanitized and approved by policy.

### 16.2 Deployable Components

Recommended deployable components include:

- Frontend web application.
- Backend API application.
- Background worker application.
- Scheduler or job coordinator.
- Database migrations.
- Supporting infrastructure configuration.

### 16.3 Configuration Management

Configuration must be environment-specific and should be supplied through environment variables, managed secrets, or deployment configuration systems.

Configuration must include:

- Database connection settings.
- Cache connection settings.
- Queue connection settings.
- Object storage settings.
- Authentication secrets.
- External provider credentials.
- Feature flags.
- Operational limits.

Secrets must not be committed to source control.

### 16.4 Deployment Process

The deployment process should include:

- Build verification.
- Automated tests where available.
- Database migration planning.
- Release artifact creation.
- Deployment to target environment.
- Health check verification.
- Rollback or forward-fix plan.

### 16.5 Health Checks

Production services should expose health checks for:

- Application process readiness.
- Database connectivity.
- Cache connectivity where critical.
- Queue connectivity where critical.
- External dependency status where appropriate.

Health checks must not expose secrets or sensitive data.

## 17. Scaling Strategy

Scaling must support growth in tenants, customers, menu items, orders, assets, background work, and reporting activity.

### 17.1 Application Scaling

Frontend and backend applications should be stateless where practical so they can scale horizontally. Session state should be stored in secure cookies, a shared session store, or managed identity provider rather than local process memory.

### 17.2 Database Scaling

Database scaling should progress through stages:

1. Proper schema design and tenant-aware indexes.
2. Query optimization and slow query monitoring.
3. Connection pooling.
4. Read replicas for read-heavy workloads.
5. Archival strategies for high-volume historical data.
6. Partitioning or sharding only when justified by measured load.

Tenant-aware query design must come before complex database distribution.

### 17.3 Cache Scaling

Cache capacity should be scaled based on hit rate, memory pressure, and latency. Cache entries should be short-lived where data changes frequently.

### 17.4 Queue and Worker Scaling

Workers should scale independently from API servers. Separate queues may be introduced for:

- High-priority notifications.
- Long-running reports.
- External integration retries.
- Image processing.
- Maintenance jobs.

Queue separation prevents slow or failing workloads from blocking urgent operational jobs.

### 17.5 Tenant Growth Strategy

The platform must avoid per-tenant deployments as the default scaling model. Tenant growth should be handled through shared infrastructure, tenant-aware data access, and plan-based limits.

Dedicated infrastructure for enterprise tenants may be considered later, but it must be treated as an exception that does not weaken the standard multi-tenant architecture.

## 18. Security Architecture

Security architecture protects tenant data, platform operations, customer information, credentials, and system integrity.

### 18.1 Security Boundaries

Primary security boundaries include:

- Public storefront boundary.
- Restaurant administration boundary.
- Platform administration boundary.
- Backend API boundary.
- Database boundary.
- Object storage boundary.
- Queue and worker boundary.
- External integration boundary.

Each boundary must have explicit controls for identity, authorization, input validation, logging, and failure behavior.

### 18.2 Tenant Data Protection

Tenant data protection requires:

- Tenant-scoped data models.
- Tenant-aware authorization checks.
- Tenant-safe cache keys.
- Tenant-scoped file namespaces.
- Tenant-aware background jobs.
- Auditable platform administrator access.
- Tests covering cross-tenant access attempts.

### 18.3 Application Security Controls

Application security controls should include:

- Input validation for all write operations.
- Output encoding in frontend rendering.
- Protection against common web vulnerabilities.
- Secure session cookies or token handling.
- CSRF protection where cookie-based sessions are used.
- Rate limiting for sensitive endpoints.
- Audit logging for privileged operations.
- Dependency vulnerability review.

### 18.4 Secret Management

Secrets must be stored in managed secret systems, deployment platform secret stores, or secure environment configuration. Secrets include:

- Database credentials.
- API keys.
- JWT or session signing secrets.
- OAuth client secrets.
- Webhook signing secrets.
- Object storage credentials.
- Notification provider credentials.

Secrets must never be committed to the repository.

### 18.5 Platform Administration Security

Platform administration requires stronger controls than restaurant administration. Recommended controls include:

- Privileged role assignment.
- Multi-factor authentication where practical.
- Audit logs for tenant access and subscription changes.
- Restricted routes and APIs.
- Safe support tooling.
- Clear separation between read-only support and destructive actions.

### 18.6 External Integration Security

External integrations must validate incoming requests and protect outgoing credentials. Webhooks must be authenticated through provider signatures or equivalent verification before business logic executes.

Integration failures must be logged without exposing secrets or sensitive customer data.

### 18.7 Security Testing

Security testing should include:

- Cross-tenant access tests.
- Authorization bypass tests.
- Public API exposure tests.
- File access tests.
- Subscription restriction tests.
- Admin privilege tests.
- Dependency and secret scanning where supported.

## 19. Observability and Operations

Observability enables engineers and operators to understand platform health, tenant-specific issues, performance, and failure modes.

### 19.1 Logging

Logs should include enough context to diagnose issues while avoiding sensitive data leakage. Recommended log fields include:

- Request identifier.
- Actor identifier where available.
- Tenant identifier where applicable.
- Route or operation name.
- Error code or category.
- Duration.
- Job identifier for background work.

### 19.2 Metrics

Recommended metrics include:

- Request count and error rate.
- API latency.
- Storefront latency.
- Database query latency.
- Queue depth.
- Job success and failure counts.
- Notification delivery rate.
- Cache hit rate.
- Active tenant count.
- Order volume.

### 19.3 Alerts

Alerts should be defined for:

- Elevated error rates.
- API or storefront downtime.
- Database connectivity failures.
- Queue backlog growth.
- Worker failure loops.
- Notification provider failures.
- Authentication anomalies.
- Storage failures.

### 19.4 Audit Events

Audit events should be recorded for:

- Platform administrator tenant access.
- Tenant lifecycle changes.
- Subscription state changes.
- Role and permission changes.
- Significant catalog changes.
- Order status changes where operationally important.
- Security-sensitive account events.

## 20. Architecture Decision Guidance

Architecture decisions should be documented when they materially affect platform direction, security, tenant isolation, scalability, operational complexity, or future extension.

### 20.1 When to Create an Architecture Decision Record

Create an architecture decision record when deciding:

- Whether to split a module into a separate service.
- Which database or storage technology to use.
- How tenant isolation is enforced for a new domain.
- How authentication or authorization is implemented.
- Which queue or cache provider is adopted.
- How billing or payment integrations affect subscription state.
- How deployment and hosting are structured.

### 20.2 Decision Quality Criteria

Architecture decisions should be evaluated against:

- Tenant isolation.
- Security impact.
- Operational simplicity.
- Maintainability.
- Scalability.
- Cost.
- Team capability.
- Reversibility.
- Alignment with DOC-001.

## Approval Statement

DOC-002 defines the official system architecture direction for the ZayJar Restaurant SaaS Platform. Future implementation documents, API specifications, infrastructure plans, and security designs must align with this architecture unless a formally approved architecture revision supersedes it.
