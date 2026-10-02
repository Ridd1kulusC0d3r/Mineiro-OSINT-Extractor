# Releasing and repository setup

Everything below is automated by CI except the few steps that need repository-owner permissions on GitHub or PyPI.

## 1. Repository "About" (description, topics, website)

These are repository settings, not files, so they are applied by the owner.

**Description** (under 350 characters):

> OSINT workbench for public username presence: evidence-first detection (985 detectors), differential soft-404 baseline, auditable reports and STIX 2.1 export. Run it with `pip install mineiro-osint`, Colab or from source.

**Topics:**

```text
osint osint-tools username-enumeration threat-intelligence cybersecurity
digital-forensics dfir investigation reconnaissance stix evidence
typescript react nodejs python pip
```

With the GitHub CLI (`gh auth login` first):

```bash
gh repo edit Ridd1kulusC0d3r/Mineiro-OSINT-Extractor \
  --description "OSINT workbench for public username presence: evidence-first detection (985 detectors), differential soft-404 baseline, auditable reports and STIX 2.1 export. Run it with pip install mineiro-osint, Colab or from source." \
  --add-topic osint --add-topic osint-tools --add-topic username-enumeration \
  --add-topic threat-intelligence --add-topic cybersecurity --add-topic digital-forensics \
  --add-topic dfir --add-topic investigation --add-topic reconnaissance --add-topic stix \
  --add-topic evidence --add-topic typescript --add-topic react --add-topic nodejs \
  --add-topic python --add-topic pip
```

Or in the web UI: repository home → the ⚙ next to **About** → paste the description and topics.

**Social preview:** *Settings → General → Social preview → Upload* `assets/social-preview.png` (1280×640).

## 2. Cut a release

1. Merge the release branch into `main`.
2. Make sure the version is consistent and the CHANGELOG has a section for it:
   ```bash
   npm run version:check
   ```
3. Tag and push. The tag **must** be `v` + the version in `package.json`:
   ```bash
   git tag v1.7.0
   git push origin v1.7.0
   ```
4. The **Release** workflow then: checks version consistency, runs lint/tests/detector validation, builds the app and the wheel, smoke-installs the wheel in a clean venv, and creates the GitHub Release with the CHANGELOG notes, the `.whl` and `SHA256SUMS.txt`.

To bump the version, change it in `package.json`, `package-lock.json`, `python/pyproject.toml`, `python/src/mineiro_osint/__init__.py`, `server.ts`, `server/routes/verify.ts` and the README badges, add a `## [x.y.z]` section to `CHANGELOG.md`, and run `npm run version:check` (it lists anything out of sync).

## 3. Publish to PyPI (optional)

`pip install mineiro-osint` works from the release wheel immediately. To make it work from PyPI:

1. Create the project on PyPI (the name `mineiro-osint` was unclaimed when this was written; check again).
2. On PyPI, add a **trusted publisher**: owner `Ridd1kulusC0d3r`, repository `Mineiro-OSINT-Extractor`, workflow `release.yml`, environment `pypi`.
3. In GitHub, create the environment `pypi` and the repository variable `PUBLISH_PYPI=true`.
4. The next tag push publishes automatically, with no stored token.

## 4. Local checks before tagging

```bash
npm run check          # full gate
npm run build:python && pip wheel ./python --no-deps -w /tmp/wheel
python -m venv /tmp/v && /tmp/v/bin/pip install /tmp/wheel/*.whl && /tmp/v/bin/mineiro --check
```
