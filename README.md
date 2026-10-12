# psjailbreakinfo

A source-backed PS4 and PS5 firmware compatibility checker.

Website: https://the23aces.github.io/psjailbreakinfo/

## GitHub Pages

This is a static website with no build step. In Settings → Pages, choose **Deploy from a branch**, then **main** and **/(root)**. The `.nojekyll` file keeps the static files unchanged.

## Updating the data

Edit `data.mjs` after checking the linked original project documentation. Keep exact firmware lists: never infer support from a simple numeric cutoff. Kernel access, homebrew-enabler support, and PS5 hypervisor support are separate claims.

The current snapshot was reviewed on 12 October 2026. Updates are manual. Update the visible dates when re-reviewing the data.

## Checks

Run `node --test tests/compatibility.test.mjs`. Tests cover firmware parsing, version exceptions, cross-console differences, search filters, and source references.

## Features

- PS4 and PS5 firmware checker
- Searchable compatibility groups with exact versions
- Method, payload, and setup requirements linked to original sources
- Shareable result URLs
- Light and dark themes
- Responsive layout and keyboard navigation

Independent project, not affiliated with Sony Interactive Entertainment. The website provides information and does not contain or execute console exploits. Compatibility is based on project documentation, not hands-on hardware tests.

The October 12 review includes the expanded GoldHEN firmware list and the PS5 Poops/Kstuff Lite route for 11.40. `unsupported` is an explicitly reviewed, released firmware with no public jailbreak documented as of the review date (PS4 14.00; PS5 14.00 and 14.10). Unlisted inputs remain `unknown`; future versions are never classified by a numeric cutoff.
