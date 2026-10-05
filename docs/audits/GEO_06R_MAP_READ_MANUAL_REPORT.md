# GEO-06R — Manual Locations + Map Read Report

## Status

**IMPLEMENTED / ROLLBACK-ONLY REPLAY PENDING**

## Delivered

1. Manual CompanyLocation create/update RPC.
2. Automatic-source fork protection.
3. Manual PostGIS pin support.
4. Human verification preservation.
5. Stale-coordinate clearing when a manual address changes.
6. Soft archive.
7. CompanyLocation audit trail.
8. Company 360 location-list read contract.
9. Commercial viewport read model.
10. Derived account lifecycle.
11. Derived map sales-stage groups.
12. Last CRM activity and overdue-action projection.
13. Commercial filters without a duplicate CRM database.
14. Backend/service-role-only security boundary.
15. Static and rollback-only replay assertions.

## Important product decision

A registered address is not rewritten into a garage just because the seller corrects the operational point.

Editing provider-derived data creates a new manual Location.

This preserves both:

- what the external source said;
- what the seller/customer/visit confirmed.

## Marker-state consequence

The future frontend can derive visual state from the read model instead of storing marker colors.

Examples:

- fill: stage group;
- ring: next-action priority;
- warning/badge: approximate or review-needed Location;
- icon: physical Location purpose.

No `marker_color` database column is introduced.

## Current limitation kept explicit

The audited Supabase backend does not yet provide a trustworthy canonical seller/owner field that can safely drive map ownership filtering.

GEO-06R therefore does not invent one.

Ownership filtering becomes a later additive projection once ownership is canonical.

## Production impact

None.

No pending migration applied.
No Railway deployment.
No production RLS changed.
No customer Location written.
No map library introduced.

## Acceptance replay

The dedicated disposable replay must prove:

- automatic registry Location remains untouched after manual correction;
- manual fork is created;
- manual point is PostGIS-backed;
- audit INSERT/UPDATE exists;
- negotiation stage derives correctly;
- overdue next action derives correctly;
- CUSTOMER lifecycle updates without storing map status;
- Company 360 location list preserves multiple Locations;
- manual address change clears stale geo;
- archive hides inactive Location from active list.
