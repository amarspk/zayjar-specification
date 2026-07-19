# DOC-003: ZayJar Backend Architecture

## Document Control

| Field | Value |
| --- | --- |
| Document ID | DOC-003 |
| Document Title | ZayJar Backend Architecture |
| Product | ZayJar Restaurant SaaS Platform |
| Version | 1.0 |
| Status | Official Draft |
| Classification | Internal Engineering Architecture |
| Owner | ZayJar Engineering |
| Intended Audience | Backend Engineering, Architecture, Security, DevOps, QA, Product, and Technical Operations |
| Created Date | 2026-07-20 |
| Repository Location | `docs/DOC-003-Backend-Architecture.md` |
| Parent Specifications | `docs/DOC-001-Master-Project-Specification.md`, `docs/DOC-002-System-Architecture.md` |

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [Backend Philosophy](#3-backend-philosophy)
4. [Technology Stack](#4-technology-stack)
5. [Service Architecture](#5-service-architecture)
6. [API Layer](#6-api-layer)
7. [Business Logic Layer](#7-business-logic-layer)
8. [Repository Layer](#8-repository-layer)
9. [Multi-Tenant Data Access](#9-multi-tenant-data-access)
10. [Authentication Flow](#10-authentication-flow)
11. [Authorization Flow](#11-authorization-flow)
12. [Restaurant Isolation](#12-restaurant-isolation)
13. [Validation Strategy](#13-validation-strategy)
14. [Error Handling](#14-error-handling)
15. [Background Jobs](#15-background-jobs)
16. [Logging](#16-logging)
17. [Configuration Management](#17-configuration-management)
18. [Security Considerations](#18-security-considerations)
19. [Scalability](#19-scalability)
20. [Future Expansion](#20-future-expansion)
21. [References](#21-references)

## 1. Purpose

This document defines the backend architecture for the ZayJar Restaurant SaaS Platform. It describes how backend services should be organized, how requests should move through the system, how business rules should be enforced, and how the backend must preserve tenant isolation, security, reliability, and maintainability.

DOC-003 is subordinate to DOC-001 and DOC-002. DOC-001 defines the master product and engineering specification. DOC-002 defines the overall system architecture. DOC-003 focuses specifically on the backend application layer, including API handling, service boundaries, business logic, data access, authentication, authorization, background jobs, logging, configuration, security, scalability, and future extension.

The backend is the authoritative enforcement point for ZayJar. Frontend interfaces may guide users and hide unavailable actions, but backend services must enforce tenant boundaries, user permissions, subscription state, validation rules, data consistency, and security controls.

## 2. Scope

This document applies to all backend components that process ZayJar business operations, expose APIs, execute background jobs, access persistent data, enforce tenant context, or integrate with external systems.

### 2.1 In Scope

The following areas are in scope for DOC-003:

- Backend application structure.
- API request lifecycle.
- Domain and business logic organization.
- Repository and data access patterns.
- Multi-tenant data access rules.
- Authentication and authorization flows.
- Restaurant isolation enforcement.
- Validation strategy.
- Error handling standards.
- Background job execution.
- Logging and audit-oriented backend events.
- Configuration management.
- Backend security considerations.
- Backend scalability and future expansion.

### 2.2 Out of Scope

The following areas are not defined in full implementation detail by this document:

- Final source code structure.
- Final database schema.
- Final API endpoint contract.
- Final infrastructure provider selection.
- Final authentication provider selection.
- Final billing provider integration.
- Final queue technology implementation.
- Final deployment scripts or infrastructure-as-code modules.
- Frontend component architecture.

These items may be specified in future documents. Any future implementation details must remain aligned with the backend principles and boundaries defined here.

## 3. Backend Philosophy

The ZayJar backend must be designed as a reliable SaaS application backend rather than a collection of ad hoc routes. It must centralize business rules, protect tenant data, expose predictable APIs, support operational workflows, and remain maintainable as the product grows.

### 3.1 Backend as the Source of Enforcement

The backend must enforce:

- Authentication.
- Authorization.
- Tenant context.
- Restaurant isolation.
- Subscription state.
- Feature entitlements.
- Input validation.
- Business rules.
- Data integrity.
- Audit-relevant events.

No backend endpoint may rely on client-side checks as its only protection. Every sensitive operation must be validated and authorized on the server.

### 3.2 Explicit Tenant Context

Backend operations that act on restaurant-owned data must execute with explicit tenant context. Tenant context must be established before domain services or repositories access tenant-owned records.

Tenant context may be resolved from authenticated membership, public storefront routing, platform administrator selection, signed webhook mapping, or background job metadata. It must not be inferred casually from untrusted request input.

### 3.3 Domain-Oriented Modularity

Backend code should be organized around product domains rather than technical convenience alone. Domains should represent durable business areas such as tenants, restaurant profiles, catalog, orders, subscriptions, identity, access control, files, notifications, reporting, jobs, and audit.

Each domain should own its rules and expose a clear internal interface. Cross-domain interactions should be intentional and traceable.

### 3.4 Operational Simplicity

The backend should avoid premature distributed complexity. A modular monolith or a small number of deployable backend services is preferred until measured scale or operational needs justify decomposition.

The initial backend architecture should optimize for:

- Correct tenant isolation.
- Clear business rules.
- Reliable deployments.
- Testable modules.
- Consistent observability.
- Predictable failure behavior.

## 4. Technology Stack

The backend technology stack must support secure API development, tenant-aware data access, reliable background processing, deployment automation, and future scaling.

### 4.1 Technology Stack Requirements

The selected backend stack must provide:

- HTTP API support.
- Middleware or request pipeline support.
- Strong validation capabilities.
- Database migration support.
- Secure authentication integration.
- Structured logging.
- Background job or queue integration.
- Test automation support.
- Configuration and secret management integration.
- Production deployment compatibility.

### 4.2 Recommended Backend Runtime Characteristics

Regardless of language or framework, the backend runtime should support:

- Stateless horizontal scaling.
- Connection pooling for database access.
- Graceful shutdown for deployments.
- Health checks for readiness and liveness.
- Centralized error handling.
- Request correlation identifiers.
- Safe handling of concurrent requests.

### 4.3 Framework Selection Principles

A backend framework should be selected based on:

- Team capability.
- Ecosystem maturity.
- Security posture.
- Availability of stable libraries.
- Support for modular architecture.
- Support for testing and validation.
- Operational compatibility with the deployment environment.

Framework selection must not weaken tenant isolation or encourage business logic to be spread across uncontrolled request handlers.

### 4.4 External Dependencies

External dependencies should be limited, maintained, and reviewed. Dependencies that affect authentication, authorization, database access, payments, file uploads, queue execution, or security-sensitive behavior require additional review.

## 5. Service Architecture

The backend service architecture defines how the backend is divided into modules and how those modules interact.

### 5.1 Recommended Initial Architecture

The recommended initial backend architecture is a modular monolith. This means the backend may deploy as one application while maintaining strict internal module boundaries.

A modular monolith is appropriate because ZayJar requires strong consistency between tenants, catalog, orders, subscriptions, and access control. Premature microservices would increase operational complexity before the product has measured scaling needs.

### 5.2 Backend Modules

Recommended backend modules include:

| Module | Responsibility |
| --- | --- |
| Identity | User identity, authentication, sessions, account recovery, external identity integration. |
| Access Control | Roles, permissions, tenant membership, platform administrator privileges. |
| Tenant Management | Tenant records, tenant lifecycle, tenant metadata, tenant status. |
| Restaurant Profile | Public restaurant details, operating status, branding metadata, profile settings. |
| Catalog | Menu items, categories, prices, availability, item status, catalog images. |
| Orders | Order creation, order line items, order lifecycle, order history, operational status. |
| Subscription | Plans, subscription state, entitlements, billing event handling, plan limits. |
| Files | Upload validation, storage keys, metadata, signed URL generation, file access checks. |
| Notifications | Notification events, recipient selection, templates, delivery orchestration. |
| Jobs | Queue producers, worker handlers, retry policy, failed job handling. |
| Reporting | Tenant reports, platform summaries, aggregation rules, read-optimized queries. |
| Audit | Administrative events, security-sensitive events, tenant lifecycle events. |
| Configuration | Runtime settings, feature flags, environment-specific configuration access. |

### 5.3 Module Boundary Rules

Backend modules must follow these rules:

- Modules must not access another module's internal data structures directly.
- Shared utilities must not contain hidden business rules.
- Tenant isolation logic must be reusable and consistently applied.
- Subscription checks must be centralized enough to prevent inconsistent behavior.
- Cross-module operations must be expressed through service interfaces or domain events.
- Modules must expose only the operations required by other modules.

### 5.4 Service Interaction Patterns

Service interactions may use direct method calls inside a modular monolith. Domain events may be used when an operation should trigger asynchronous side effects such as notification delivery, report updates, or integration synchronization.

Synchronous service calls are appropriate for operations requiring immediate consistency. Asynchronous events are appropriate for non-blocking work, external communication, and retryable side effects.

## 6. API Layer

The API layer is the entry point for frontend clients, platform administration tools, public storefronts, integrations, and future external consumers.

### 6.1 API Responsibilities

The API layer is responsible for:

- Receiving HTTP requests.
- Applying authentication middleware.
- Resolving tenant context.
- Validating request parameters and payloads.
- Enforcing route-level authorization.
- Calling domain services.
- Returning normalized responses.
- Emitting audit and operational logs where appropriate.

### 6.2 API Request Lifecycle

A typical backend API request should follow this lifecycle:

1. Receive request.
2. Attach request identifier.
3. Parse request metadata.
4. Authenticate actor when required.
5. Resolve tenant context when required.
6. Validate input.
7. Authorize action.
8. Execute domain service operation.
9. Persist changes through repository layer.
10. Schedule asynchronous jobs where needed.
11. Return response.
12. Record structured logs and metrics.

### 6.3 API Route Categories

Recommended route categories include:

- Public storefront routes.
- Restaurant administration routes.
- Platform administration routes.
- Authentication routes.
- Subscription and entitlement routes.
- File upload and asset routes.
- Notification preference routes.
- Reporting routes.
- Webhook routes.

Each route category must have clear authentication and authorization behavior.

### 6.4 Public API Behavior

Public storefront APIs may be unauthenticated, but they must still be tenant-scoped. Public APIs may expose active restaurant profile data, active catalog data, order creation flows, and customer-safe order confirmation behavior.

Public APIs must not expose private restaurant data, platform administration data, staff records, subscription billing details, internal identifiers unless approved, or customer data belonging to other requests.

### 6.5 Administrative API Behavior

Restaurant administration APIs must require authenticated restaurant users and tenant membership checks. Platform administration APIs must require privileged platform roles.

Administrative APIs must not trust tenant identifiers sent by clients without verifying that the authenticated actor has access to the tenant and requested action.

## 7. Business Logic Layer

The business logic layer contains the domain rules that define how ZayJar behaves.

### 7.1 Domain Service Responsibilities

Domain services must enforce business rules such as:

- A suspended restaurant cannot accept new customer orders.
- A restaurant user can manage only restaurants assigned to that user.
- Menu item changes apply only to the owning restaurant.
- Historical order records must preserve order-time item and price details.
- Subscription entitlements determine access to plan-limited features.
- Order status transitions must follow a valid lifecycle.
- Platform administrators may perform privileged actions only through controlled paths.

### 7.2 Business Logic Placement

Business logic should be placed in domain services rather than controllers, frontend components, repositories, or scripts. Controllers should coordinate request handling. Repositories should persist and retrieve data. Domain services should decide what is allowed and what should happen.

### 7.3 Cross-Domain Rules

Some operations require multiple domains. Examples include:

- Creating an order requires tenant, catalog, subscription, and order domain checks.
- Suspending a restaurant requires tenant, subscription, storefront, notification, and audit behavior.
- Uploading a menu image requires tenant, file, catalog, and authorization checks.
- Inviting a restaurant manager requires identity, access control, notification, and tenant membership behavior.

Cross-domain workflows should use orchestrating services or clear application service methods so that logic remains readable and testable.

### 7.4 Domain Events

Domain events may be emitted when important business events occur. Recommended events include:

- Tenant created.
- Tenant suspended.
- Tenant reactivated.
- Restaurant profile updated.
- Menu item created or updated.
- Order created.
- Order status changed.
- Subscription state changed.
- Staff user invited.
- File uploaded.

Domain events should include tenant context where applicable and should avoid carrying large sensitive payloads.

## 8. Repository Layer

The repository layer provides controlled access to persistent data. It should hide raw database operations from controllers and most domain services while preserving query clarity.

### 8.1 Repository Responsibilities

Repositories are responsible for:

- Reading records by tenant and identifier.
- Persisting validated domain changes.
- Applying tenant-scoped query filters.
- Supporting transactional operations.
- Returning data structures expected by domain services.
- Avoiding unauthorized broad data access.

### 8.2 Repository Boundary Rules

Repositories must not make business policy decisions that belong in domain services. They may enforce low-level data safety rules such as tenant filters, soft-delete filters, and optimistic locking behavior.

Repositories must not expose generic unrestricted query methods to application code unless those methods are reserved for tightly controlled platform administration or migration use cases.

### 8.3 Transaction Management

Transactions should be used when multiple writes must succeed or fail together. Examples include:

- Creating an order and order line items.
- Updating subscription state and recording audit events.
- Creating tenant records and initial settings.
- Assigning user membership and role records.

Transaction boundaries should be explicit and should avoid unnecessary long-running operations.

### 8.4 Read Models

Read models may be introduced for reporting, dashboards, and high-volume views. Read models must preserve tenant isolation and must be rebuilt or invalidated safely when source data changes.

## 9. Multi-Tenant Data Access

Multi-tenant data access is a core backend responsibility. Every tenant-owned query and write must be scoped correctly.

### 9.1 Tenant-Scoped Data Access Rules

The following rules are mandatory:

- Tenant-owned tables must include tenant identifiers.
- Tenant-owned reads must filter by tenant identifier.
- Tenant-owned writes must verify tenant ownership.
- Tenant identifiers from clients must be validated against actor permissions.
- Background jobs must include tenant context before accessing tenant-owned data.
- Cache keys and file keys must include tenant context where applicable.

### 9.2 Tenant Context Object

The backend should use a tenant context object or equivalent construct that contains:

- Tenant identifier.
- Actor identifier where available.
- Actor role or permission summary.
- Request source.
- Subscription state or entitlement snapshot where applicable.
- Correlation identifier for logging.

This context should be passed explicitly to services and repositories that require tenant-aware behavior.

### 9.3 Global Data Access

Global data access must be intentionally limited. Examples of global data include plan definitions, feature flags, system configuration, and platform-level metadata.

Global data access must not become a path for retrieving tenant-owned records without filters.

### 9.4 Platform Administrator Access

Platform administrators may need cross-tenant visibility for support and operations. This access must use explicit platform administration paths, must require privileged roles, and should be auditable.

Platform administrator access must not be implemented by bypassing normal tenant rules in ordinary restaurant endpoints.

## 10. Authentication Flow

Authentication establishes the identity of a user or integration caller before privileged actions are allowed.

### 10.1 User Authentication Flow

A standard user authentication flow should include:

1. User submits credentials or uses an identity provider.
2. Backend validates the authentication request.
3. Backend creates a secure session or token.
4. Backend returns session state using secure transport.
5. Subsequent requests include the session or token.
6. Backend resolves the actor identity from the session or token.
7. Backend evaluates authorization separately for each protected action.

### 10.2 Session Requirements

Sessions must:

- Identify the authenticated actor.
- Expire according to policy.
- Be revocable where practical.
- Avoid exposing sensitive secrets to client-side scripts.
- Use secure cookie or token settings appropriate for the deployment model.
- Support logout behavior.

### 10.3 Account Recovery

Account recovery flows must be secure and time-limited. Recovery tokens must be single-use or otherwise protected against replay. Account recovery events should be logged as security-sensitive events.

### 10.4 Integration Authentication Flow

External integrations must authenticate through approved mechanisms such as signed webhooks, API keys, OAuth, or provider-managed signatures. Integration authentication must happen before any business effect is processed.

Webhook handlers must be idempotent and must reject unsigned, invalid, expired, or replayed events where provider capabilities allow.

## 11. Authorization Flow

Authorization determines whether an authenticated actor may perform a specific action within a specific tenant or platform context.

### 11.1 Authorization Flow Steps

A standard authorization flow should include:

1. Identify the actor.
2. Resolve tenant context where required.
3. Load actor roles and memberships.
4. Determine requested action.
5. Determine resource ownership.
6. Evaluate subscription and entitlement restrictions where applicable.
7. Permit or deny the action.
8. Log sensitive decisions where required.

### 11.2 Role-Based Access Control

ZayJar should use role-based access control with tenant-aware permission checks. Recommended role categories include:

- Platform owner.
- Platform administrator.
- System operator.
- Restaurant owner.
- Restaurant manager.
- Restaurant staff.
- Integration actor.
- Public customer.

Restaurant roles must be scoped to specific restaurant tenants. A role in one restaurant does not grant access to another restaurant.

### 11.3 Permission Checks

Permission checks should evaluate:

- Actor identity.
- Actor role.
- Tenant membership.
- Target resource tenant ownership.
- Requested action.
- Subscription state.
- Feature entitlement.
- Operational state.

Authorization must be explicit for sensitive operations such as tenant suspension, subscription changes, staff role updates, menu deletion, order status changes, file access, and platform administration.

### 11.4 Denied Authorization Responses

Denied authorization responses must be safe. The backend should avoid exposing whether a resource exists in another tenant unless the actor is allowed to know.

## 12. Restaurant Isolation

Restaurant isolation is the most important backend correctness requirement. The backend must prevent cross-restaurant data access and cross-restaurant operational effects.

### 12.1 Isolation Enforcement Points

Restaurant isolation must be enforced at:

- API route guards.
- Tenant context resolution.
- Domain services.
- Repository query filters.
- File access checks.
- Cache key namespacing.
- Queue payloads.
- Background job handlers.
- Reporting queries.
- Platform administration boundaries.

### 12.2 Cross-Tenant Risk Areas

The highest-risk areas for cross-tenant leakage include:

- Routes that accept restaurant identifiers.
- Bulk reporting queries.
- Platform administration utilities.
- Cache entries for menu or profile data.
- Uploaded file access.
- Background jobs that process orders or notifications.
- Webhook handlers that map external events to tenants.
- Search or filtering endpoints.

These areas require additional tests and review.

### 12.3 Isolation Testing

Backend tests must verify that:

- A restaurant user cannot read another restaurant's profile through admin APIs.
- A restaurant user cannot update another restaurant's menu item.
- A restaurant user cannot view another restaurant's orders.
- A customer storefront cannot display another restaurant's menu items.
- A suspended restaurant does not affect other restaurants.
- File access is denied across tenant boundaries.
- Background jobs process only the intended tenant's data.

### 12.4 Support Access

Support and platform administrator access must be explicit, privileged, and logged where appropriate. Support tools must make the active tenant context clear to reduce operational mistakes.

## 13. Validation Strategy

Validation protects backend correctness by ensuring that requests, commands, and integration payloads are structurally valid before business logic executes.

### 13.1 Validation Layers

Validation should occur at multiple layers:

- Request shape validation at the API boundary.
- Type and format validation for fields.
- Business rule validation in domain services.
- Data integrity validation through database constraints.
- Integration payload validation for webhooks and external events.

### 13.2 Input Validation Requirements

The backend must validate:

- Required fields.
- Data types.
- String lengths.
- Numeric ranges.
- Currency and price formats.
- Email and phone formats where applicable.
- Allowed enum values.
- File size and content type.
- Tenant identifiers and resource identifiers.

### 13.3 Business Validation Requirements

Business validation includes rules such as:

- Menu item price must be valid for the configured currency policy.
- Unavailable menu items cannot be ordered.
- Orders must contain valid items from the same restaurant.
- Suspended restaurants cannot accept new orders.
- A user cannot assign a role higher than allowed by their own permissions.
- Subscription plan limits must be enforced.

### 13.4 Validation Error Responses

Validation errors should be returned in a consistent structure that identifies safe field-level issues without exposing internal implementation details.

## 14. Error Handling

Error handling must be consistent, safe, observable, and useful for both clients and operators.

### 14.1 Error Categories

The backend should distinguish between:

- Validation errors.
- Authentication errors.
- Authorization errors.
- Tenant context errors.
- Not found errors.
- Conflict errors.
- Subscription restriction errors.
- Rate limit errors.
- External dependency errors.
- Unexpected server errors.

### 14.2 Error Response Rules

Error responses must:

- Use consistent response shapes.
- Include safe error codes.
- Avoid exposing secrets, stack traces, SQL details, or private tenant data.
- Provide enough information for client handling.
- Include correlation identifiers where appropriate.

### 14.3 Internal Error Logging

Internal logs may include richer diagnostic information but must still avoid sensitive data leakage. Logs should include request identifiers, tenant identifiers where applicable, actor identifiers where appropriate, operation names, and error categories.

### 14.4 External Dependency Failures

External dependency failures must be handled gracefully. Examples include notification provider failures, payment provider failures, object storage failures, cache failures, and queue failures.

The backend should avoid corrupting core transactional data when external side effects fail. Retryable work should be moved to queues when appropriate.

## 15. Background Jobs

Background jobs handle asynchronous work that should not block user-facing requests.

### 15.1 Background Job Use Cases

Recommended backend job use cases include:

- Notification delivery.
- Image processing.
- Report generation.
- Subscription reconciliation.
- Billing webhook processing.
- Order event fanout.
- Integration retries.
- Audit enrichment.
- Cleanup of stale uploads or expired tokens.

### 15.2 Job Payload Requirements

Job payloads must include:

- Job type.
- Tenant identifier where applicable.
- Resource identifiers.
- Actor identifier where applicable.
- Idempotency key where required.
- Attempt count or retry metadata.
- Created timestamp.

Job payloads should avoid large sensitive payloads. Workers should load current data from the database using tenant-scoped access patterns.

### 15.3 Worker Requirements

Workers must:

- Reconstruct tenant context before processing tenant-owned data.
- Revalidate resource state before applying changes.
- Be idempotent where repeat execution is possible.
- Record failures and retry outcomes.
- Respect subscription and tenant lifecycle states where applicable.
- Avoid blocking unrelated tenants when one tenant's job fails.

### 15.4 Retry and Failure Handling

Retries must be bounded. Jobs that exceed retry limits should be moved to a dead-letter queue or failed-job store. Failed jobs must include enough context for investigation without exposing sensitive data.

## 16. Logging

Logging provides operational visibility into backend behavior, errors, security events, and tenant-specific workflows.

### 16.1 Logging Principles

Backend logs must be structured, searchable, and safe. Logs should support debugging without exposing sensitive customer, restaurant, credential, or payment data.

### 16.2 Standard Log Fields

Recommended log fields include:

- Timestamp.
- Log level.
- Request identifier.
- Operation name.
- Actor identifier where available.
- Tenant identifier where applicable.
- Route or job type.
- Error code or category.
- Duration.
- Deployment environment.

### 16.3 Security-Sensitive Logging

Security-sensitive events should be logged for:

- Failed authentication attempts.
- Account recovery requests.
- Privileged role changes.
- Platform administrator tenant access.
- Subscription state changes.
- Authorization denials for sensitive actions.
- Webhook signature failures.

### 16.4 Data Redaction

Logs must redact or avoid:

- Passwords.
- Session tokens.
- API keys.
- Payment details.
- Full customer personal data unless explicitly approved.
- Raw webhook secrets.
- Private file URLs.

## 17. Configuration Management

Configuration management defines how the backend receives environment-specific settings, secrets, operational limits, and feature flags.

### 17.1 Configuration Sources

Configuration may come from:

- Environment variables.
- Managed secret stores.
- Deployment platform configuration.
- Feature flag systems.
- Static application defaults for safe non-secret settings.

Secrets must never be committed to source control.

### 17.2 Configuration Categories

Backend configuration includes:

- Database connection settings.
- Cache connection settings.
- Queue connection settings.
- Object storage settings.
- Authentication secrets.
- Session settings.
- External provider credentials.
- Notification provider settings.
- Rate limits.
- File upload limits.
- Feature flags.
- Logging levels.

### 17.3 Environment Separation

Each environment must use separate configuration and data. Production credentials must not be reused in local, test, or staging environments.

### 17.4 Configuration Validation

The backend should validate required configuration at startup. Missing or invalid critical configuration should fail fast before the application accepts traffic.

## 18. Security Considerations

Backend security protects tenants, customers, platform operations, credentials, and system integrity.

### 18.1 Backend Security Controls

Backend security controls must include:

- Strong authentication for privileged users.
- Server-side authorization for all protected operations.
- Tenant-aware data access.
- Input validation.
- Output safety.
- Secure session handling.
- Secret management.
- Rate limiting for sensitive endpoints.
- Audit logging for privileged actions.
- Protection against common web application vulnerabilities.

### 18.2 Sensitive Endpoint Protection

Sensitive endpoints include:

- Authentication and account recovery endpoints.
- Platform administration endpoints.
- Subscription state endpoints.
- Role and membership endpoints.
- File upload endpoints.
- Order creation endpoints.
- Webhook endpoints.

These endpoints require additional validation, logging, rate limiting, or signature verification as appropriate.

### 18.3 Secret Handling

Secrets must be accessed through secure runtime configuration. Secrets must not be logged, returned to clients, included in error messages, or stored in public file locations.

### 18.4 Dependency Security

Backend dependencies must be reviewed for maintenance status, known vulnerabilities, and security posture. Security-sensitive dependencies require extra care during upgrades.

### 18.5 Secure Defaults

Backend features should default to the safer behavior. Examples include denying access when tenant context is missing, requiring explicit roles for privileged actions, disabling unavailable subscription features, and rejecting invalid integration signatures.

## 19. Scalability

The backend must support growth in restaurants, users, menu items, orders, assets, background jobs, and integrations.

### 19.1 Stateless Application Scaling

Backend API servers should remain stateless where practical. Stateless servers can scale horizontally behind a load balancer. Session state should be stored in secure cookies, shared session storage, or managed identity systems rather than local memory.

### 19.2 Database-Aware Scaling

Backend services must use efficient tenant-scoped queries and connection pooling. Database scaling should begin with schema design, indexes, query optimization, and read replicas before considering partitioning or sharding.

### 19.3 Queue and Worker Scaling

Workers should scale independently from API servers. High-priority jobs should not be blocked by slow reporting, image processing, or integration retry workloads.

### 19.4 Modular Decomposition

Modules may become separate services when justified by measured needs such as independent scaling, separate deployment cadence, operational isolation, or specialized infrastructure.

Service extraction must preserve tenant isolation, authorization behavior, observability, and operational reliability.

## 20. Future Expansion

The backend architecture must support future capabilities without requiring a rewrite of the core platform.

### 20.1 Potential Future Modules

Potential future backend modules include:

- Payment processing.
- Delivery provider integration.
- Loyalty and rewards.
- Promotions and discounts.
- Inventory management.
- Kitchen display workflows.
- Multi-location restaurant groups.
- Advanced analytics.
- Marketing automation.
- Custom domains.
- Webhook and public developer API platform.

### 20.2 Expansion Rules

Future modules must:

- Preserve tenant isolation.
- Use explicit tenant context.
- Integrate with centralized authorization.
- Respect subscription entitlements.
- Provide observability.
- Avoid duplicating existing domain rules.
- Use asynchronous processing for retryable external side effects.

### 20.3 Service Extraction Criteria

A module may be extracted into a separate service when:

- It has independent scaling requirements.
- It has a separate operational failure profile.
- It requires specialized infrastructure.
- It has a clearly defined API boundary.
- It can preserve tenant and authorization context across service boundaries.
- The operational cost of extraction is justified by measurable benefit.

## 21. References

This document references and depends on the following ZayJar engineering documents:

| Document | Description |
| --- | --- |
| DOC-001: ZayJar Master Project Specification | Defines the official product, scope, requirements, SaaS principles, restaurant isolation, subscription model, and success criteria. |
| DOC-002: ZayJar System Architecture | Defines the overall system architecture, multi-tenant model, frontend, backend, API, database, deployment, scaling, and security architecture. |

Future documents may expand this backend architecture with detailed API contracts, database schema specifications, authentication and authorization specifications, background job specifications, and operational runbooks.

## Approval Statement

DOC-003 defines the official backend architecture direction for the ZayJar Restaurant SaaS Platform. Backend implementation, API development, service design, data access, authentication, authorization, and operational practices must align with this document unless a formally approved architecture revision supersedes it.
