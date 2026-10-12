# Deferred UI features

## Report sharing

Hidden at the user's request on October 12, 2026. `src/components/report-view.tsx` no longer renders Share report, the generated share-link field, or Revoke all links. The client sharing handler and its loading/error state were removed with those controls.

The server implementation remains available:

- `src/app/api/runs/[id]/share/route.ts`: owner-checked, same-origin POST creates a share token; DELETE revokes all shares for an owned run.
- `src/server/store.ts`: `createShare`, `revokeShares`, and `sharedReport` retain immutable report snapshots and hashed tokens.
- `src/app/share/[token]/page.tsx`: existing public share URLs remain readable until revoked.

This is a UI removal, not a server feature flag or revocation of existing links.

### Restore later

Add the controls back to `ReportView` only for a private report with a `runId` and `shared === false`. Restore client state for the generated URL, pending operation, and errors. POST `/api/runs/${runId}/share`, read the returned `token`, and display `${location.origin}/share/${token}` in a selectable read-only field. Explain that anyone with the link can read the saved report. DELETE the same endpoint for Revoke all links and clear the displayed URL after confirmation from the server.

The previous UI implementation is available in Git commit `c1642c4`, in `src/components/report-view.tsx`. Reintroduce only its sharing handler, state, header action, and link/revocation panel; keep subsequent report layout changes.

On restoration, verify owner isolation, creation/revocation failure handling, immutable snapshots, and that sample/public reports offer no sharing controls. Keep database access and credentials on the server.
