# DOC-001: ZayJar Master Project Specification

## Document Control

| Field | Value |
| --- | --- |
| Document ID | DOC-001 |
| Document Title | ZayJar Master Project Specification |
| Product | ZayJar Restaurant SaaS Platform |
| Version | 2.0 |
| Status | Official |
| Classification | Internal Engineering and Product Specification |
| Owner | ZayJar Engineering |
| Intended Audience | Engineering, Product, Architecture, QA, Security, Operations, Support, and Executive Stakeholders |
| Created Date | 2026-07-19 |
| Effective Date | 2026-07-19 |
| Repository Location | `docs/DOC-001-Master-Project-Specification.md` |

## Table of Contents

1. [Version Information](#1-version-information)
2. [Revision History](#2-revision-history)
3. [Purpose](#3-purpose)
4. [Vision](#4-vision)
5. [Scope](#5-scope)
6. [Business Goals](#6-business-goals)
7. [Actors and Roles](#7-actors-and-roles)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [High-Level Architecture](#10-high-level-architecture)
11. [Multi-Tenant SaaS Principles](#11-multi-tenant-saas-principles)
12. [Restaurant Isolation](#12-restaurant-isolation)
13. [Subscription Model](#13-subscription-model)
14. [Success Criteria](#14-success-criteria)
15. [Governance and Change Control](#15-governance-and-change-control)
16. [Appendix: Requirement Priority Definitions](#16-appendix-requirement-priority-definitions)

## 1. Version Information

This document is the official Version 2.0 master engineering specification for the ZayJar Restaurant SaaS Platform. It defines the product intent, business objectives, platform scope, principal actors, expected capabilities, quality attributes, architecture direction, multi-tenant SaaS requirements, restaurant isolation rules, subscription model, and measurable success criteria.

Version 2.0 supersedes all earlier informal notes, drafts, prototype assumptions, and undocumented implementation decisions. Any future engineering, product, QA, infrastructure, security, or operations work for ZayJar must align with this specification unless a formally approved change request overrides a section of this document.

### 1.1 Document Authority

This specification is authoritative for the baseline platform definition. It is not a low-level implementation guide, API contract, database schema, test plan, or release checklist. Those documents may be created separately and must reference this specification where relevant.

Where ambiguity exists between this document and a lower-level implementation artifact, this document governs the intended product and engineering direction. Lower-level artifacts may refine details, but they must not contradict the principles, scope boundaries, tenant isolation rules, or success criteria defined here.

### 1.2 Version 2.0 Objectives

Version 2.0 establishes a stable engineering foundation for a production-grade restaurant SaaS platform. It is intended to move ZayJar from a simple application concept into a structured, maintainable, multi-tenant product with clear responsibilities, isolation rules, extensibility points, and operational expectations.

The objectives of Version 2.0 are:

- Define the official platform scope and boundaries.
- Establish the expected tenant model for restaurants.
- Define the principal functional and non-functional requirements.
- Identify the key actors who interact with the platform.
- Provide a high-level architecture suitable for future detailed design.
- Define subscription and monetization principles.
- Set measurable success criteria for product and engineering readiness.

## 2. Revision History

| Version | Date | Author | Status | Description |
| --- | --- | --- | --- | --- |
| 2.0 | 2026-07-19 | ZayJar Engineering | Official | Initial official master specification for the ZayJar Restaurant SaaS Platform. Establishes enterprise documentation baseline, product scope, SaaS principles, actor model, architecture direction, requirements, subscription model, and success criteria. |

## 3. Purpose

The purpose of ZayJar is to provide restaurants with a managed SaaS platform for creating, operating, and scaling digital restaurant experiences. The platform enables restaurants to maintain an online presence, manage products or menu items, receive and process orders, support customer interactions, and operate within a subscription-based software model.

This document exists to align stakeholders around a shared definition of what the platform is, what it must do, how it must behave, and which engineering principles must guide its implementation. It provides a common reference for planning, design, development, testing, deployment, operations, and future governance.

The purpose of this specification is also to reduce ambiguity. Restaurant SaaS products involve several overlapping concerns: customer storefronts, restaurant administration, order processing, catalog management, tenant isolation, billing, availability, security, branding, and operational workflows. Without a master specification, implementation can drift into inconsistent assumptions. DOC-001 prevents that drift by defining a clear baseline.

### 3.1 Engineering Purpose

From an engineering perspective, this document establishes the platform as a multi-tenant SaaS system. It requires isolation between restaurants, explicit subscription controls, scalable architecture, secure data handling, and maintainable service boundaries. Engineering decisions must support long-term product evolution rather than only short-term feature delivery.

### 3.2 Product Purpose

From a product perspective, this document defines ZayJar as a restaurant enablement platform. The product must be simple enough for small and medium restaurants to adopt, yet structured enough to support growth, subscription management, administrative oversight, and future expansion into advanced capabilities.

### 3.3 Operational Purpose

From an operations perspective, this document defines expectations for reliability, observability, supportability, backup, incident response, and recoverability. A SaaS platform is not complete when features work locally; it is complete when it can be operated safely and consistently for multiple independent restaurants.

## 4. Vision

ZayJar's vision is to become a trusted digital operating layer for restaurants that need modern online capabilities without building custom software. The platform should allow a restaurant to establish its branded digital presence, publish its offering, manage orders, and serve customers through a clean, reliable, and scalable SaaS experience.

The long-term vision is for ZayJar to support restaurants across different sizes, cuisines, operating models, and markets while preserving a simple core experience. Restaurants should be able to join the platform, configure their public identity, manage their catalog, receive orders, and track performance with minimal technical effort.

ZayJar should feel professional, dependable, and operationally practical. It should not be a one-off website generator or a fragile prototype. It should be engineered as a platform: multi-tenant by design, secure by default, extensible over time, and clear in its subscription value.

### 4.1 Product Vision Principles

The platform vision is guided by the following principles:

- Restaurants should control their own public identity, catalog, and operational settings.
- Customers should experience fast, clear, and trustworthy ordering flows.
- Platform administrators should be able to manage restaurants, subscriptions, and operational health from a centralized control plane.
- Tenant boundaries must be explicit, enforced, and testable.
- Subscription status must govern access to paid platform capabilities.
- The system must support incremental growth without requiring a complete rewrite.

### 4.2 Strategic Direction

The strategic direction is to build a SaaS foundation first, then extend it with advanced restaurant operations. Core tenant, catalog, order, subscription, and administration capabilities must be stable before advanced features are layered on top.

Potential future capabilities may include loyalty programs, analytics, delivery integrations, payment integrations, kitchen display systems, inventory forecasting, marketing automation, multilingual storefronts, and regional compliance modules. These are future expansion areas and must not compromise the core architecture.

## 5. Scope

The scope of ZayJar Version 2.0 includes the foundational SaaS capabilities required to operate restaurant tenants on a shared platform while maintaining strict data and access boundaries.

### 5.1 In Scope

The following capabilities are in scope for the master platform specification:

- Restaurant tenant creation and management.
- Restaurant profile configuration, including name, tagline, brand details, operating status, and public-facing metadata.
- Restaurant-specific catalog or menu management.
- Product or menu item creation, editing, activation, deactivation, pricing, and availability tracking.
- Customer-facing restaurant storefronts.
- Customer order creation and order status lifecycle management.
- Administrative views for restaurant operators.
- Platform-level administration for managing restaurants and subscriptions.
- Subscription plan definition and subscription status enforcement.
- Multi-tenant data segregation.
- Authentication and role-based access control.
- Basic platform observability and operational readiness.
- Documentation-ready architecture foundations.

### 5.2 Out of Scope for This Master Specification

The following items are not defined in implementation detail by this document:

- Final database schema.
- Final API endpoint definitions.
- Final UI component designs.
- Payment processor-specific integration details.
- Delivery provider-specific integration details.
- Mobile native application implementation.
- Country-specific tax or fiscal compliance implementation.
- Detailed analytics data models.
- Detailed infrastructure-as-code modules.
- Low-level security control implementation procedures.

These areas may be covered by future documents, appendices, or implementation specifications. They must remain aligned with this master specification.

### 5.3 Product Boundary

ZayJar is a SaaS platform for restaurant digital operations. It is not defined as a marketplace by default. A marketplace model may be added in the future, but Version 2.0 treats each restaurant as an isolated tenant with its own operational identity and customer-facing experience.

ZayJar is not defined as a food delivery logistics company. It may integrate with delivery services or support restaurant-managed delivery workflows, but direct logistics fleet management is outside the baseline scope unless explicitly introduced in a future specification.

## 6. Business Goals

ZayJar must support a sustainable SaaS business model while solving practical restaurant problems. The platform should create measurable value for restaurants and provide a reliable foundation for recurring revenue.

### 6.1 Primary Business Goals

The primary business goals are:

- Enable restaurants to launch and manage a professional digital storefront quickly.
- Reduce the technical burden for restaurants that need online ordering and menu management.
- Create recurring subscription revenue through tiered SaaS plans.
- Support multiple independent restaurant tenants on a shared platform.
- Provide a platform administration layer for tenant onboarding, subscription management, and support.
- Build a product foundation that can expand into higher-value modules over time.

### 6.2 Restaurant Value Goals

For restaurant tenants, ZayJar must deliver the following business value:

- Increase digital visibility.
- Improve order capture through clear customer-facing workflows.
- Simplify menu and product updates.
- Reduce dependency on custom website development.
- Provide operational control to restaurant staff.
- Support consistent brand presentation.
- Provide subscription-based access that is predictable and manageable.

### 6.3 Platform Business Goals

For the platform owner, ZayJar must support the following business objectives:

- Recurring subscription revenue.
- Tenant growth without linear increases in engineering effort.
- Operational visibility across the tenant base.
- Plan-based feature differentiation.
- Supportable and maintainable architecture.
- Clear upgrade paths for restaurants.
- Future extensibility into analytics, marketing, integrations, and premium services.

### 6.4 Business Constraints

The platform must be designed with the following constraints in mind:

- Restaurants may have limited technical expertise.
- Restaurants may require rapid onboarding.
- Data from one restaurant must never be exposed to another restaurant.
- Subscription state must be accurate and enforceable.
- The product must be maintainable by a small or growing engineering team.
- The architecture must avoid unnecessary complexity while preserving scalability.

## 7. Actors and Roles

ZayJar supports multiple categories of actors. Each actor must be assigned only the permissions required for their responsibilities.

### 7.1 Platform Owner

The Platform Owner represents the business entity operating ZayJar. This actor is responsible for product strategy, subscription policy, tenant onboarding strategy, pricing decisions, compliance expectations, and overall platform governance.

Primary responsibilities:

- Define subscription plans.
- Approve platform-level operational policies.
- Monitor growth and revenue metrics.
- Prioritize product roadmap decisions.
- Ensure platform direction aligns with business goals.

### 7.2 Platform Administrator

A Platform Administrator manages the SaaS control plane. This actor can create, view, update, suspend, reactivate, and support restaurant tenants according to internal policies.

Primary responsibilities:

- Manage restaurant tenant records.
- Manage subscription status and plan assignment.
- Support restaurant onboarding.
- Investigate platform-level support issues.
- Monitor operational health.
- Apply administrative actions where authorized.

Access expectations:

- Platform administrators must not casually access tenant operational data unless required for support, auditing, or administration.
- Administrative access must be auditable.
- Sensitive operations must be protected by appropriate authentication and authorization controls.

### 7.3 Restaurant Owner

A Restaurant Owner is the primary business representative for a restaurant tenant. This actor owns the restaurant's subscription relationship, brand configuration, operational settings, and administrative users.

Primary responsibilities:

- Configure restaurant profile and branding.
- Manage subscription and billing relationship where enabled.
- Invite and manage restaurant staff users.
- Configure high-level operating preferences.
- Review restaurant performance and order activity.

### 7.4 Restaurant Manager

A Restaurant Manager operates the day-to-day administrative workflows for a restaurant. This actor may manage menu items, update availability, review orders, and coordinate restaurant staff operations.

Primary responsibilities:

- Maintain menu or catalog content.
- Adjust prices and availability.
- View and manage incoming orders.
- Update order statuses.
- Coordinate operational readiness.

### 7.5 Restaurant Staff

Restaurant Staff members support operational workflows with restricted permissions. Depending on implementation, they may view orders, update order preparation status, or manage limited availability details.

Primary responsibilities:

- View assigned operational queues.
- Update order state where permitted.
- Support fulfillment workflows.

### 7.6 Customer

A Customer is an end user who visits a restaurant's storefront to browse offerings and place orders.

Primary responsibilities:

- Browse restaurant information.
- Browse available products or menu items.
- Create an order.
- Provide order details.
- Receive order status or confirmation information where supported.

Access expectations:

- Customers must only interact with public storefront functionality and their own order context.
- Customers must not gain access to restaurant administrative functions or other customers' private data.

### 7.7 System Operator

A System Operator is responsible for technical operations, deployment, monitoring, incident response, and maintenance.

Primary responsibilities:

- Monitor uptime and service health.
- Manage deployment processes.
- Investigate technical incidents.
- Maintain backups and recovery processes.
- Review logs and infrastructure metrics.

### 7.8 External Systems

External systems may include payment providers, email providers, SMS gateways, analytics services, delivery services, authentication providers, and accounting systems.

Primary responsibilities:

- Exchange data through controlled integrations.
- Authenticate requests where applicable.
- Follow integration-specific security and reliability requirements.

## 8. Functional Requirements

Functional requirements define what the platform must do. Requirement identifiers in this section are authoritative labels for future planning, QA, and traceability.

### 8.1 Tenant and Restaurant Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-TEN-001 | The platform must support creation of restaurant tenants. | Must |
| FR-TEN-002 | Each restaurant tenant must have a unique internal identifier. | Must |
| FR-TEN-003 | Each restaurant tenant must have configurable public profile information. | Must |
| FR-TEN-004 | The platform must support activation, suspension, and deactivation of restaurant tenants. | Must |
| FR-TEN-005 | The platform must associate each restaurant tenant with a subscription state. | Must |
| FR-TEN-006 | The platform must prevent tenant users from accessing restaurants they are not authorized to manage. | Must |
| FR-TEN-007 | The platform should support tenant metadata for support, onboarding, and operational tracking. | Should |

Tenant management must be implemented as a platform-level capability. A restaurant is not merely a visual grouping; it is the primary tenant boundary for access control, data ownership, subscription enforcement, and operational separation.

### 8.2 Restaurant Profile and Branding

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-PRF-001 | A restaurant must be able to maintain its public name. | Must |
| FR-PRF-002 | A restaurant should be able to maintain a tagline or short description. | Should |
| FR-PRF-003 | A restaurant should be able to configure brand assets such as logo, colors, and images when supported. | Should |
| FR-PRF-004 | A restaurant must have an operating status that controls public availability where applicable. | Must |
| FR-PRF-005 | A restaurant should be able to maintain contact, location, and service information. | Should |

Restaurant profile data must be tenant-owned. Public profile fields may be visible to customers, while administrative fields must remain restricted to authorized users.

### 8.3 Catalog and Menu Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-CAT-001 | Authorized restaurant users must be able to create menu items or products. | Must |
| FR-CAT-002 | Authorized restaurant users must be able to edit menu item names, descriptions, prices, and availability. | Must |
| FR-CAT-003 | Authorized restaurant users must be able to deactivate items without deleting historical order references. | Must |
| FR-CAT-004 | The platform must associate every menu item with exactly one restaurant tenant. | Must |
| FR-CAT-005 | The platform should support item images when supported by the product experience. | Should |
| FR-CAT-006 | The platform should support categories or grouping for menu presentation. | Should |
| FR-CAT-007 | The platform should support stock, availability, or sold-out indicators where operationally required. | Should |

Catalog records must never be globally shared between restaurants unless a future approved specification introduces a controlled shared template system. Even in that case, tenant-specific copies or overrides must preserve restaurant-level control.

### 8.4 Customer Storefront

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-STF-001 | The platform must provide a customer-facing view for each active restaurant tenant. | Must |
| FR-STF-002 | The storefront must display restaurant profile information and available menu items. | Must |
| FR-STF-003 | The storefront must hide unavailable, inactive, or subscription-restricted restaurant content. | Must |
| FR-STF-004 | The storefront should support responsive layouts for desktop and mobile customers. | Should |
| FR-STF-005 | The storefront should clearly communicate order availability and restaurant operating status. | Should |

The storefront experience must be simple, fast, and trustworthy. Customers should understand which restaurant they are interacting with at all times. The platform must avoid any ambiguity that could cause a customer to place an order with the wrong restaurant tenant.

### 8.5 Order Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-ORD-001 | Customers must be able to create orders for an active restaurant where ordering is available. | Must |
| FR-ORD-002 | Each order must be associated with exactly one restaurant tenant. | Must |
| FR-ORD-003 | Each order must preserve the relevant item, price, quantity, and customer-provided details at the time of order. | Must |
| FR-ORD-004 | Authorized restaurant users must be able to view orders for their restaurant only. | Must |
| FR-ORD-005 | Authorized restaurant users must be able to update order status according to the supported lifecycle. | Must |
| FR-ORD-006 | The platform should provide order confirmation to customers where supported. | Should |
| FR-ORD-007 | The platform should retain order history for operational and reporting needs according to retention policy. | Should |

Order data is operationally sensitive. Access to order data must be restricted by tenant and role. Historical orders must remain consistent even if menu items are later renamed, repriced, or deactivated.

### 8.6 User and Access Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-AUTH-001 | The platform must authenticate administrative users. | Must |
| FR-AUTH-002 | The platform must support role-based authorization. | Must |
| FR-AUTH-003 | The platform must associate restaurant users with one or more authorized restaurant tenants as appropriate. | Must |
| FR-AUTH-004 | Platform administrator access must be distinct from restaurant operator access. | Must |
| FR-AUTH-005 | The platform should support user invitation or controlled onboarding workflows. | Should |
| FR-AUTH-006 | The platform should support password reset or equivalent account recovery flows. | Should |

Authorization must be enforced server-side. Client-side hiding of controls is not sufficient to meet access requirements.

### 8.7 Platform Administration

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-ADM-001 | Platform administrators must be able to view tenant records. | Must |
| FR-ADM-002 | Platform administrators must be able to create and update tenant records. | Must |
| FR-ADM-003 | Platform administrators must be able to assign or update subscription status. | Must |
| FR-ADM-004 | Platform administrators should be able to view basic operational status across tenants. | Should |
| FR-ADM-005 | Sensitive administrative actions should be logged for auditability. | Should |

Platform administration is part of the SaaS control plane. It must be treated as a privileged capability and designed with appropriate safeguards.

### 8.8 Subscription and Entitlement Management

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-SUB-001 | The platform must support subscription plans. | Must |
| FR-SUB-002 | The platform must associate each restaurant tenant with a subscription plan or subscription state. | Must |
| FR-SUB-003 | The platform must enforce access restrictions for suspended, expired, or inactive subscriptions. | Must |
| FR-SUB-004 | The platform should support plan-based feature availability. | Should |
| FR-SUB-005 | The platform should support upgrade and downgrade paths. | Should |
| FR-SUB-006 | The platform should preserve administrative visibility for suspended restaurants while restricting customer-facing or paid capabilities as defined by policy. | Should |

Subscription enforcement must be centralized and consistent. Individual screens or endpoints must not each invent separate subscription rules.

### 8.9 Notifications and Communications

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-NOT-001 | The platform should support transactional notifications for important events where configured. | Should |
| FR-NOT-002 | Notifications should be tenant-aware and must not leak information across restaurants. | Should |
| FR-NOT-003 | Notification failures should be observable and retryable where business critical. | Could |

Notification capabilities may include email, SMS, in-app messages, or external webhooks. The exact channels may be defined in future implementation specifications.

### 8.10 Reporting and Analytics

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-RPT-001 | Restaurant users should be able to view basic order and catalog activity for their own restaurant. | Should |
| FR-RPT-002 | Platform administrators should be able to view tenant growth and subscription metrics. | Should |
| FR-RPT-003 | Reports must respect tenant isolation and role authorization. | Must |
| FR-RPT-004 | Analytics should be designed so that aggregate platform metrics do not expose another restaurant's private operational data. | Should |

Analytics are valuable but must not weaken isolation. Future reporting systems must use tenant-aware data access patterns and carefully controlled aggregation.

### 8.11 Audit and Compliance Support

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-AUD-001 | The platform should record significant administrative actions. | Should |
| FR-AUD-002 | The platform should record subscription state changes. | Should |
| FR-AUD-003 | The platform should retain logs needed for support and incident investigation according to policy. | Should |
| FR-AUD-004 | Audit records must not be editable by ordinary restaurant users. | Must |

Audit support is required for operational trust. The depth of audit logging may evolve, but the architecture must allow sensitive actions to be traced.

## 9. Non-Functional Requirements

Non-functional requirements define how the platform must behave. These requirements are critical to making ZayJar a dependable SaaS system.

### 9.1 Security

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-SEC-001 | All privileged administrative access must require authentication. | Must |
| NFR-SEC-002 | Authorization must be enforced on the server side for every tenant-scoped operation. | Must |
| NFR-SEC-003 | Tenant identifiers must not be accepted blindly from clients without authorization checks. | Must |
| NFR-SEC-004 | Sensitive credentials and secrets must not be committed to source control. | Must |
| NFR-SEC-005 | Production traffic should use encrypted transport. | Must |
| NFR-SEC-006 | Security-relevant events should be logged and monitored. | Should |
| NFR-SEC-007 | The platform should follow secure coding practices for input validation, output encoding, and dependency management. | Should |

Security must be treated as an architecture requirement, not a post-release cleanup activity. The most important security requirement is tenant isolation: a user from one restaurant must not be able to access another restaurant's data through any direct or indirect route.

### 9.2 Privacy and Data Protection

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-PRV-001 | Customer and order data must be protected from unauthorized access. | Must |
| NFR-PRV-002 | Restaurant operational data must be scoped to the owning tenant. | Must |
| NFR-PRV-003 | Data retention policies should be defined for orders, logs, and audit records. | Should |
| NFR-PRV-004 | The platform should minimize collection of unnecessary personal data. | Should |

Data protection obligations may vary by jurisdiction. The platform must be designed so that future regional compliance controls can be added without undermining the core tenant model.

### 9.3 Availability and Reliability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-AVL-001 | Core customer-facing storefront functionality should be highly available. | Should |
| NFR-AVL-002 | Administrative functions should degrade gracefully where dependent services are unavailable. | Should |
| NFR-AVL-003 | The platform must avoid single points of failure where practical for production deployments. | Should |
| NFR-AVL-004 | Critical failures should be observable through logs, metrics, or alerts. | Should |

The platform must be designed for reliable operation across multiple tenants. An issue affecting one restaurant's configuration or data should not compromise the availability of unrelated restaurants.

### 9.4 Performance

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-PER-001 | Customer-facing pages should load quickly under normal operating conditions. | Should |
| NFR-PER-002 | API operations should use efficient tenant-scoped queries. | Should |
| NFR-PER-003 | The system should support growth in restaurants, products, and orders without requiring immediate redesign. | Should |
| NFR-PER-004 | Expensive reports or batch operations should not degrade core ordering workflows. | Should |

Performance must be evaluated in tenant-aware scenarios. Queries that work for one restaurant may fail when the platform contains many restaurants, many menu items, and many historical orders.

### 9.5 Scalability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-SCL-001 | The architecture must support multiple restaurant tenants on shared infrastructure. | Must |
| NFR-SCL-002 | Tenant growth should not require code duplication per restaurant. | Must |
| NFR-SCL-003 | The system should allow horizontal scaling of stateless application components where applicable. | Should |
| NFR-SCL-004 | Data access patterns should support indexing by tenant and operational status. | Should |

Scalability does not require premature complexity. It requires that the baseline architecture avoid hard-coded tenant assumptions, per-restaurant deployments by default, and global data access patterns that cannot scale.

### 9.6 Maintainability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-MNT-001 | Code should be organized around clear product and domain responsibilities. | Should |
| NFR-MNT-002 | Shared logic for tenant isolation, authorization, and subscription enforcement should be centralized where practical. | Should |
| NFR-MNT-003 | The platform should include automated tests for critical tenant and order workflows. | Should |
| NFR-MNT-004 | Documentation must be maintained as architecture and product scope evolve. | Must |

Maintainability is necessary for long-term SaaS success. The platform must be understandable by future engineers and support teams.

### 9.7 Observability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-OBS-001 | The platform should expose logs for application errors and operational events. | Should |
| NFR-OBS-002 | The platform should expose metrics for request health, latency, error rate, and service availability. | Should |
| NFR-OBS-003 | Tenant identifiers in logs must be handled carefully to support debugging without exposing sensitive data unnecessarily. | Should |
| NFR-OBS-004 | Critical subscription, order, and administration events should be traceable. | Should |

Observability must help operators understand whether the platform is healthy and whether individual tenant issues are isolated or systemic.

### 9.8 Backup and Recovery

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-BKR-001 | Production data should be backed up according to a defined schedule. | Should |
| NFR-BKR-002 | Restore procedures should be documented and periodically tested. | Should |
| NFR-BKR-003 | Recovery processes must preserve tenant boundaries and data integrity. | Must |
| NFR-BKR-004 | Critical configuration and subscription data should be recoverable after operational incidents. | Should |

Backup is not complete unless restore is possible and tested. Recovery planning must consider tenant-scoped restoration as well as full-platform restoration.

### 9.9 Accessibility and Usability

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-UX-001 | Customer-facing workflows should be clear and usable on common device sizes. | Should |
| NFR-UX-002 | Administrative workflows should prioritize speed, clarity, and operational confidence. | Should |
| NFR-UX-003 | Interfaces should provide clear feedback for create, update, delete, and order status actions. | Should |
| NFR-UX-004 | The platform should follow practical accessibility guidelines for form labels, contrast, keyboard operation, and error messaging. | Should |

Restaurants operate under time pressure. Administrative workflows must be efficient, predictable, and resistant to accidental destructive actions.

## 10. High-Level Architecture

ZayJar must be designed as a layered SaaS platform with clear separation between customer-facing experiences, restaurant administration, platform administration, domain services, persistence, and external integrations.

### 10.1 Architectural Overview

At a high level, the platform contains the following logical layers:

1. Customer storefront layer.
2. Restaurant administration layer.
3. Platform administration layer.
4. Application API layer.
5. Domain service layer.
6. Persistence layer.
7. Integration layer.
8. Observability and operations layer.

These layers may be implemented as a modular monolith, a service-oriented system, or a progressive architecture that begins as a modular monolith and evolves toward separate services when operational needs justify the change. The initial architecture should favor clarity, transactional safety, and maintainability over unnecessary distribution.

### 10.2 Customer Storefront Layer

The customer storefront layer presents restaurant-specific public experiences. It displays tenant profile data, menu items, item availability, order actions, and customer-facing status information.

Responsibilities:

- Render restaurant identity and public details.
- Display active and available catalog items.
- Support customer order creation.
- Communicate restaurant operating state.
- Prevent leakage of administrative data.

The storefront must always operate in the context of a specific restaurant tenant.

### 10.3 Restaurant Administration Layer

The restaurant administration layer supports restaurant owner, manager, and staff workflows.

Responsibilities:

- Manage restaurant profile and settings.
- Manage catalog or menu items.
- View and process restaurant orders.
- Manage staff access where supported.
- View tenant-specific reporting where supported.

This layer must enforce authentication, authorization, and tenant scoping for every action.

### 10.4 Platform Administration Layer

The platform administration layer supports SaaS control-plane operations.

Responsibilities:

- Manage restaurant tenant records.
- Manage subscription plans and states.
- Support onboarding and suspension workflows.
- Monitor operational status.
- Support privileged troubleshooting.

This layer must be more restricted than restaurant administration. It must support auditability for sensitive actions.

### 10.5 Application API Layer

The API layer exposes controlled operations to frontend clients and integrations. It must validate input, authenticate callers, authorize actions, enforce tenant boundaries, and call domain services.

Responsibilities:

- Request validation.
- Authentication and authorization enforcement.
- Tenant context resolution.
- Subscription entitlement checks.
- Domain service orchestration.
- Error response normalization.

The API layer must not expose unrestricted data access patterns. Every tenant-scoped endpoint must derive or verify tenant context before performing data operations.

### 10.6 Domain Service Layer

The domain service layer contains business rules for restaurants, catalogs, orders, subscriptions, users, and administrative workflows.

Core domains:

- Tenant domain.
- Restaurant profile domain.
- Catalog domain.
- Order domain.
- Subscription domain.
- User and access domain.
- Notification domain.
- Reporting domain.

Domain logic should be organized so that critical rules are not duplicated across controllers, routes, UI components, or ad hoc scripts.

### 10.7 Persistence Layer

The persistence layer stores tenant, user, catalog, order, subscription, configuration, audit, and operational data.

Persistence requirements:

- Every tenant-owned record must include a reliable tenant association where applicable.
- Queries for tenant-owned records must include tenant scoping.
- Historical records must preserve business context needed for audit and reporting.
- Schema design must support indexes for tenant, status, and time-based access patterns.
- Backup and migration procedures must be planned as part of production readiness.

### 10.8 Integration Layer

The integration layer manages communication with external systems such as payment providers, email services, SMS gateways, delivery providers, analytics tools, and authentication providers.

Integration requirements:

- External calls must be authenticated where required.
- Secrets must be stored securely.
- Failures must be handled gracefully.
- Retry behavior must be controlled to avoid duplicate business actions.
- Integration events must be traceable for support.

### 10.9 Observability and Operations Layer

The observability and operations layer supports logs, metrics, alerts, tracing, backups, deployments, and incident response.

Responsibilities:

- Provide visibility into platform health.
- Identify tenant-specific failures.
- Identify system-wide failures.
- Support incident diagnosis.
- Support audit and compliance needs.
- Support deployment and rollback confidence.

### 10.10 Recommended Initial Architecture Pattern

The recommended initial architecture is a modular monolith with strict internal boundaries. This approach supports fast development while avoiding the complexity of premature microservices. Modules should be designed around domain responsibilities, and shared cross-cutting concerns should be implemented deliberately.

Recommended modules:

- Identity and access.
- Tenant management.
- Restaurant profile.
- Catalog.
- Orders.
- Subscriptions.
- Administration.
- Notifications.
- Reporting.
- Observability support.

The architecture may evolve to separate deployable services when one or more domains require independent scaling, separate release cadence, stricter operational isolation, or dedicated infrastructure.

## 11. Multi-Tenant SaaS Principles

ZayJar is a multi-tenant SaaS platform. Multi-tenancy is a fundamental architecture requirement, not an optional feature.

### 11.1 Tenant Definition

A tenant is a restaurant business operating on the ZayJar platform. A tenant owns its restaurant profile, catalog, orders, customer interactions, configuration, users, subscription state, and operational data.

The platform owner operates the shared SaaS environment but does not merge tenant data into a single unrestricted operational context.

### 11.2 Tenant Context

Every tenant-scoped operation must execute within an explicit tenant context. Tenant context may be derived from authenticated user permissions, route or subdomain resolution, request parameters validated against authorization rules, or platform administrator selection.

Tenant context must not rely on untrusted client input alone. If a client sends a restaurant identifier, the server must verify that the caller is authorized to act within that restaurant's tenant boundary.

### 11.3 Shared Infrastructure, Isolated Data

ZayJar may use shared application servers, shared databases, shared queues, shared object storage, and shared monitoring infrastructure. Shared infrastructure is acceptable only if logical tenant isolation is enforced throughout the application and data model.

Shared infrastructure must not imply shared tenant access. The platform must be able to prove through tests, code review, and operational safeguards that one tenant cannot access another tenant's data.

### 11.4 Tenant-Aware Data Model

Tenant-owned tables or collections must include a tenant identifier unless there is a documented reason for global scope. Global data must be reviewed carefully and should be limited to platform-owned records such as plan definitions, system configuration, or controlled reference data.

Tenant-aware data access must include:

- Tenant identifiers on tenant-owned records.
- Tenant-scoped query filters.
- Tenant-aware authorization checks.
- Tenant-safe indexes.
- Tenant-safe reporting aggregation.

### 11.5 Tenant-Aware Authorization

Authorization must combine role, identity, and tenant context. A user with manager permissions in one restaurant has no implicit permissions in another restaurant.

Authorization decisions must answer three questions:

1. Who is the actor?
2. Which tenant is the action for?
3. Is the actor allowed to perform this action for this tenant?

All three questions must be answered before a tenant-scoped action is executed.

### 11.6 Tenant Lifecycle

A restaurant tenant may move through lifecycle states such as:

- Prospect.
- Trial.
- Active.
- Suspended.
- Cancelled.
- Archived.

The exact lifecycle names may evolve, but the platform must support controlled transitions. Lifecycle state must affect access to paid capabilities, customer-facing visibility, administrative behavior, and support workflows according to subscription and policy rules.

### 11.7 Tenant Configuration

Tenant configuration includes restaurant profile fields, operating status, catalog settings, ordering settings, branding, staff access, and subscription-related entitlements.

Configuration changes must be validated and scoped. Changes made by one restaurant must not affect another restaurant.

## 12. Restaurant Isolation

Restaurant isolation is the highest-priority platform principle. ZayJar must ensure that restaurants are separated in data access, administrative permissions, customer experience, subscription state, and operational behavior.

### 12.1 Isolation Goals

Restaurant isolation must ensure:

- A restaurant can only manage its own profile, catalog, orders, and staff.
- A restaurant cannot see another restaurant's order data.
- A restaurant cannot change another restaurant's availability, prices, or subscription status.
- Customers are always interacting with one intended restaurant at a time.
- Reports and analytics do not leak private data between restaurants.
- Subscription changes for one restaurant do not affect another restaurant.

### 12.2 Data Isolation Rules

The following rules are mandatory:

- Every restaurant-owned product or menu item must be linked to one restaurant tenant.
- Every order must be linked to one restaurant tenant.
- Every restaurant user permission must be linked to a tenant or platform-level role.
- Tenant-scoped queries must filter by tenant identifier.
- Tenant identifiers must be immutable for historical business records unless a controlled migration process is approved.
- Soft-deleted or inactive records must remain tenant-scoped.

### 12.3 Access Isolation Rules

The following access rules are mandatory:

- Restaurant users must not access platform administration capabilities unless explicitly assigned platform roles.
- Restaurant users must not access other restaurant tenants by changing client-side identifiers.
- Platform administrators must use privileged administrative paths for cross-tenant operations.
- Customer-facing endpoints must not expose administrative information.
- Subscription enforcement must be tenant-specific.

### 12.4 Operational Isolation Rules

Operational issues should be contained where possible. A configuration issue, data issue, or catalog issue in one restaurant should not impact unrelated restaurants.

Operational isolation expectations:

- Tenant-specific failures should be diagnosable independently.
- Tenant-specific suspension should not suspend the platform globally.
- Tenant-specific catalog errors should not break the storefronts of other restaurants.
- Support tools should identify the affected tenant context.

### 12.5 Testing Requirements for Isolation

Engineering must include tests for tenant isolation in critical workflows. Minimum isolation test categories include:

- Restaurant user cannot read another restaurant profile through administrative APIs.
- Restaurant user cannot create, update, or delete products for another restaurant.
- Restaurant user cannot view another restaurant's orders.
- Customer storefront for one restaurant does not display another restaurant's catalog items.
- Subscription suspension affects only the intended restaurant.
- Platform administrator access is controlled and auditable.

## 13. Subscription Model

ZayJar is a subscription-based SaaS platform. Subscription state governs access to platform capabilities and supports recurring revenue.

### 13.1 Subscription Principles

The subscription model must follow these principles:

- Every restaurant tenant must have a subscription state.
- Subscription state must be enforceable by the application.
- Subscription rules must be centralized and consistent.
- Subscription plans should support feature differentiation.
- Suspended or expired subscriptions must restrict customer-facing or paid capabilities according to policy.
- Platform administrators must be able to manage subscription status.

### 13.2 Subscription Entities

The subscription model should include the following conceptual entities:

- Plan: Defines the commercial package and available entitlements.
- Subscription: Represents a restaurant's relationship to a plan.
- Subscription state: Represents whether the subscription is active, trialing, past due, suspended, cancelled, or otherwise restricted.
- Entitlement: Represents access to a specific capability or limit.
- Billing account: Represents payment or billing relationship where implemented.

The exact implementation may vary, but these concepts must be represented clearly enough to support enforcement and reporting.

### 13.3 Suggested Plan Structure

The following plan structure is recommended as an initial business model. Final plan names and pricing are business decisions and may be revised.

| Plan | Intended Restaurant Type | Example Capabilities |
| --- | --- | --- |
| Starter | Small restaurants beginning digital operations | Basic restaurant profile, basic menu management, basic order intake, standard storefront |
| Growth | Restaurants with higher order volume or richer operations | Enhanced catalog features, expanded staff access, reporting, branding options |
| Premium | Restaurants needing advanced capabilities and support | Advanced reporting, integrations, priority support, higher limits, premium customization options |
| Enterprise | Groups or high-value customers requiring custom terms | Custom limits, negotiated support, advanced administration, integration support |

### 13.4 Subscription States

The platform should support a defined set of subscription states. Recommended states include:

- Trialing: Restaurant is evaluating the platform for a limited period.
- Active: Restaurant has access to plan capabilities.
- Past Due: Payment or renewal issue exists, but access may continue temporarily according to policy.
- Suspended: Access to paid or public capabilities is restricted.
- Cancelled: Subscription relationship has ended.
- Archived: Tenant is retained for historical or administrative purposes only.

State transitions must be deliberate. The platform must not rely on informal flags scattered across unrelated modules.

### 13.5 Entitlement Enforcement

Entitlements define what a restaurant can access. Entitlements may include:

- Maximum number of menu items.
- Access to branding options.
- Access to reporting features.
- Access to staff accounts.
- Access to integrations.
- Access to customer notifications.
- Access to custom domains or advanced storefront capabilities.

Entitlement enforcement must be performed server-side. User interfaces may hide unavailable features, but the API must also enforce the same restrictions.

### 13.6 Suspension Behavior

When a restaurant is suspended, the platform must apply policy-defined restrictions. Recommended baseline behavior:

- Restaurant administrators may be allowed to view limited account or subscription information.
- Customer-facing ordering may be disabled.
- Public storefront visibility may be disabled or replaced with an unavailable state.
- Platform administrators retain access for support and reactivation.
- Historical data remains preserved according to retention policy.

Suspension must affect only the intended restaurant tenant.

### 13.7 Billing Integration

Billing provider integration is not defined in implementation detail in this document. The platform should be designed so that a billing provider can be integrated without rewriting subscription enforcement.

Billing integration should eventually support:

- Plan selection.
- Payment status updates.
- Subscription renewal events.
- Payment failure handling.
- Invoice or receipt references.
- Webhook processing.

Webhook processing must be idempotent, authenticated where possible, and auditable.

## 14. Success Criteria

Success criteria define the measurable conditions under which the platform foundation can be considered aligned with this specification.

### 14.1 Product Success Criteria

The product is successful when:

- A restaurant can be onboarded as a tenant.
- A restaurant can maintain its public profile.
- A restaurant can create and manage menu items or products.
- A customer can view an active restaurant storefront.
- A customer can place an order where ordering is enabled.
- Restaurant staff can view and manage their own restaurant's orders.
- Platform administrators can manage restaurants and subscription status.
- Suspended or inactive subscription states restrict access according to policy.

### 14.2 Engineering Success Criteria

The engineering foundation is successful when:

- Tenant-owned data is consistently associated with a restaurant tenant.
- Tenant-scoped APIs enforce authorization and tenant boundaries.
- Critical workflows have automated tests or documented verification procedures.
- The architecture separates customer, restaurant, platform, domain, persistence, and integration responsibilities.
- Subscription enforcement is centralized enough to prevent inconsistent behavior.
- The platform can be deployed and operated in a repeatable manner.
- Sensitive configuration and secrets are not committed to source control.
- The codebase is maintainable by future engineers without relying on undocumented tribal knowledge.

### 14.3 Security Success Criteria

Security expectations are met when:

- Users cannot access restaurants they are not authorized to manage.
- Customers cannot access administrative functionality.
- Restaurant users cannot manipulate tenant identifiers to access other restaurants.
- Platform administrator actions are protected by privileged access controls.
- Sensitive data is transmitted and stored according to platform policy.
- Tenant isolation tests pass for critical read and write operations.

### 14.4 Operational Success Criteria

Operational readiness is successful when:

- The platform exposes logs sufficient for debugging application errors.
- Critical failures can be detected and investigated.
- Backup and recovery procedures are defined for production data.
- Deployment procedures are repeatable.
- Tenant-specific issues can be distinguished from platform-wide issues.
- Subscription and order events can be traced during support investigations.

### 14.5 Business Success Criteria

Business success is supported when:

- The platform can support recurring subscriptions.
- Restaurants can understand and receive clear value from their plan.
- Platform administrators can manage the tenant lifecycle.
- Plan-based feature differentiation can be introduced without architectural redesign.
- The system supports growth in tenants without requiring per-restaurant custom engineering.

## 15. Governance and Change Control

This document is the baseline master specification. Changes to this document should be intentional, reviewed, and traceable.

### 15.1 Change Control Rules

Changes to DOC-001 should follow these rules:

- Changes must preserve the official document ID and version history.
- Material changes must update the revision history.
- Changes that alter scope, architecture principles, tenant isolation, or subscription behavior must be reviewed by appropriate product and engineering stakeholders.
- Lower-level documents must be updated when a master specification change affects them.
- Implementation decisions that conflict with this document must trigger either a design correction or a formal specification update.

### 15.2 Related Future Documents

Future documents may include:

- API specification.
- Database schema specification.
- Authentication and authorization specification.
- Subscription and billing specification.
- Tenant isolation test plan.
- Deployment and operations guide.
- Security architecture specification.
- UI and UX specification.
- Incident response playbook.
- Data retention and privacy policy.

Future documents should be stored under the `docs/` directory or a documented subdirectory structure.

## 16. Appendix: Requirement Priority Definitions

| Priority | Meaning |
| --- | --- |
| Must | Required for the baseline platform or required to preserve core SaaS correctness. A Must requirement cannot be omitted without changing the product definition. |
| Should | Important for a professional and scalable platform. A Should requirement may be phased, but the architecture must allow it. |
| Could | Valuable but not required for the baseline. A Could requirement may be implemented when business priority and engineering capacity allow. |

## Approval Statement

DOC-001 Version 2.0 is the official master specification for the ZayJar Restaurant SaaS Platform. All future engineering documentation, implementation planning, and platform evolution should align with this document unless a formally approved revision supersedes it.
