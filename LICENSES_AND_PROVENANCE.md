# Licensing and provenance

This document separates the license of the Mineiro codebase from the license of external code or datasets.

## Mineiro original code

Original code authored specifically for this repository is distributed under the repository's MIT license.

The MIT license permits use, copying, modification, publication and redistribution, but requires the copyright and permission notice to remain in copies or substantial portions.

## Why a dataset needs separate treatment

A username-enumeration catalog is not just executable code. It may contain a curated selection of services, URL templates, detection rules, error markers and metadata. If a catalog is copied or adapted from another project, the source dataset's license may apply even when the Mineiro probing engine itself is independently written.

The root MIT license does not automatically replace those obligations.

## Reference projects reviewed

These projects were reviewed only to understand licensing boundaries. Their code is not intentionally vendored into Mineiro 1.2.

| Project | License observed | Practical consequence |
|---|---|---|
| Sherlock | MIT | Copied/modified code must retain the MIT notice. |
| Maigret | MIT | Copied/modified code must retain the MIT notice. |
| WhatsMyName | CC BY-SA 4.0 | Adapted dataset/content requires attribution and ShareAlike under compatible terms. |
| socialscan | MPL 2.0 | Modified covered source files remain subject to MPL file-level obligations. |
| Blackbird | No root license file observed during review | Do not copy code unless explicit permission/license is established. |

This table is a technical licensing review, not legal advice.

## Legacy Mineiro catalog

The project already contained a large historical catalog. Instead of deleting it, v1.2 retains those entries but marks them:

```text
source: mineiro-legacy
provenanceStatus: legacy-audit-required
licenseStatus: project-legacy-unverified
```

These labels are deliberately conservative. They do not assert that the entries came from any named third-party project, and they do not claim that the Mineiro MIT license overrides any rights that may apply to copied material.

Before representing an entry as independently verified, record:

- public profile URL pattern;
- date independently checked;
- expected presence behavior;
- expected absence behavior;
- source of the rule;
- applicable license if derived from another dataset;
- detector reliability score.

## Future catalog packs

New imported packs should declare metadata similar to:

```json
{
  "pack": "example-community-pack",
  "source": "https://example.invalid/project",
  "license": "MIT",
  "attribution": "Original Project Authors",
  "verifiedAt": "2026-09-26"
}
```

Do not remove attribution when the source license requires it.
