# Provenance policy

Mineiro treats endpoint provenance as part of detector quality.

## States

- `verified`: independently validated and origin documented.
- `external-attributed`: adapted from an external source under compatible terms with attribution preserved.
- `legacy-audit-required`: existed in the historical Mineiro catalog but does not yet have complete per-entry provenance.

## Current catalog
v1.2 preserves the historical large catalog rather than silently deleting endpoints. Legacy entries receive:

```text
source = mineiro-legacy
provenanceStatus = legacy-audit-required
licenseStatus = project-legacy-unverified
```

This is a warning label, not a license grant.

## Promotion to verified
An entry may be promoted after:

1. confirming the public profile URL directly;
2. testing an existing and a non-existing username;
3. documenting redirect and soft-404 behavior;
4. recording verification date;
5. recording source/license if derived;
6. assigning a reviewed detector score.

## Pull requests
Catalog PRs should include provenance metadata. Do not paste large external datasets without reviewing their license.
