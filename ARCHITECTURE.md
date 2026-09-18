# Drake's Pricing Desk — Product Architecture

## Product goal
A private, evidence-first pricing intelligence workspace for real estate professionals. Each verified user gets an isolated workstation for properties, reports, market evidence, and accuracy feedback.

## Public site structure
- Home: concise value proposition, trust/accuracy framing, and clear entry points.
- Solutions: Listing Price Reports, Offer Price Reports, Market Direction, and Accuracy Review.
- Who it serves: Agents and brokers, lenders, institutional housing teams, and brokerage leadership.
- Methodology: data sources, comp selection, validation history, limitations, and update cadence.
- Resources: sample reports, documentation, release notes, and support.
- Security and privacy: explain private workspaces, access controls, and data handling without exposing private report data.
- Sign in / Request access: separate from public marketing content.

## Authenticated app structure
- Workstation home: recent properties, draft reports, alerts, and accuracy-review queue.
- Property workspace: subject property, comparable selection, adjustments, evidence, and notes.
- Report center: listing-price and offer-price reports with version history and export controls.
- Market intelligence: location snapshots, moving time increments, rates, inventory, reductions, new listings, and closed/sold activity.
- Accuracy lab: prediction versus outcome, confidence, error measures, reviewer notes, and approved ground truth. Internal benchmark/test-result charts remain private and are never placed on the public landing page.
- Team and access: verified users, roles, workstation membership, invitations, and audit history.
- Account and security: email verification, password reset, MFA, active sessions, and device/workstation controls.

## Data boundaries
- Every report, property, benchmark, and accuracy record belongs to a tenant/workspace and is protected by server-side authorization plus database row-level security.
- Public pages contain no private MLS records, user data, credentials, or internal benchmark results.
- Report generation and data-provider credentials stay server-side.
- Every sensitive read and write is auditable.

## Initial backend modules
1. Authentication and session management.
2. Workspaces, memberships, and roles.
3. Properties and source evidence.
4. Comparable selection and pricing calculations.
5. Reports, revisions, exports, and access logs.
6. Market snapshots and refresh jobs.
7. Accuracy outcomes and reviewer workflow.
8. Notifications, support, and audit events.

## Delivery order
1. Establish the application shell and environment configuration.
2. Add verified authentication and protected routes.
3. Add workspace isolation and role checks.
4. Add property/report data models and server-side access policies.
5. Add report review and accuracy feedback.
6. Connect approved data sources and deployment secrets.
7. Add observability, backups, and security testing.

## Design principles
- Original Drake's Pricing Desk product language and visual identity.
- Organize by user jobs and outcomes, not by copied competitor navigation.
- Make accuracy evidence and limitations visible.
- Keep public marketing, authenticated operations, and internal research clearly separated.
- Prefer reversible, reviewable changes and never publish private test data.
