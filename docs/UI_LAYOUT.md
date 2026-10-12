# Shared route layout

`src/app/site-layout.css` owns page width, horizontal gutters and header geometry. All rendered page shells use a 1280px maximum column; the full-height chat uses that column for its content and dock inside a viewport-sized scroll region. Chat messages and refinement forms keep smaller reading widths inside the shell. Embedded reports inherit their surrounding chat width.

`HeaderNavigation` renders one header across routes. Page styles cannot resize its logo, account slot or navigation. A fixed account slot covers authentication loading, and the root reserves scrollbar space across long pages, short pages and chat navigation. Mobile navigation closes after selection and restores focus on Escape.

| Route family | Shared shell |
| --- | --- |
| `/` | Landing and footer |
| `/home`, its loading/error states | HomeDashboard |
| `/library` | Library page, including signed-out, empty and error content |
| `/sample`, `/reports/[id]`, `/share/[token]` | ReportView; all report tabs |
| `/new`, `/research/[id]` | AgentConversation or legacy RunProgress |
| `/new/refine/[id]`, `/setup` | Page column with a focused form or panel |
| `/sign-in`, `/sign-up`, `/sso-callback`, their loading states | AuthShell |
| Not-found outcomes | Page column containing an empty-state card |
| Development home/agent/research galleries | The same production components and header |

API handlers, metadata/image routes and redirect-only development routes do not render page layouts. Existing authentication, ownership and preview gates are unchanged.

## Verification, 2026-10-12

- Manually inspected public and account-entry surfaces at 320px, 390px, 768px and 1440px using the local browser.
- Compared client-side navigation between landing, sample and sign-in: desktop logo x-position stayed 112.5px at a 1440px viewport, with a 1280px header and page column. Narrow-page logo x-position stayed 16px at 320px.
- Checked all five report tabs at 320px; no page-level horizontal overflow.
- Used isolated home fixtures for long content, loading and connection errors, and the agent fixture for questions, progress and completion. The mobile question panel stayed within the viewport; completed report delivery collapsed the composer.
- Private report, share, refinement and operator route composition was inspected in source through the same components. Live private data, operator setup and OAuth completion were not exercised.
- TypeScript and the production build passed. Automated test suites remained skipped at the user's request.
