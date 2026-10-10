# JSX class coverage inventory

Pre-edit audit of every `className` used by JSX files under `src/`, compared with class selectors in `src/index.css`.

Legend: **Styled** means a matching selector exists. **State/composition** means the class is intentionally only a modifier or an element gets its visual style from another class on the same element. **Missing** means no direct selector existed before the stylesheet changes.

| Component/page | JSX classes | Pre-edit coverage |
|---|---|---|
| Shared layout and controls | `page-container`, `page-header`, `eyebrow`, `button`, `button-primary`, `button-secondary` | Styled |
| `StickyHeader.jsx` | `sticky-header`, `header-inner`, `brand-link`, `brand-logo`, `header-menu-toggle`, `header-nav`, `header-nav-links`, `header-link`, `header-nav-actions`, `header-user-greeting`, `header-signin`, `header-get-started`, `header-signout` | Styled |
| Header state modifiers | `is-active`, `is-open` | State/composition; styled in active/open selectors |
| `ApiStatusIndicator.jsx` | `api-status-pill`, `api-status-dot`, `api-status-online`, `api-status-degraded`, `api-status-offline`, `api-status-loading` | Styled |
| `ApiStatusIndicator.jsx` | `api-status-text` | Missing direct selector; inherited text was visible |
| `Home.jsx` | `home-page-shell`, `home-hero-section`, `home-hero-copy`, `home-hero-description`, `home-hero-actions`, `home-trust-list`, `home-visual-panel`, `home-preview-window`, `home-preview-header`, `home-dot`, `home-dot-indigo`, `home-dot-violet`, `home-dot-cyan`, `home-preview-body`, `home-preview-sidebar`, `home-badge-pill`, `home-mini-card`, `home-mini-card-highlight`, `home-preview-main`, `home-plan-summary`, `home-label`, `home-preview-status`, `home-plan-items`, `home-plan-item`, `home-plan-status`, `is-complete`, `is-current`, `home-benefits-section`, `home-section-heading`, `home-benefit-heading`, `home-benefit-grid`, `home-benefit-card`, `home-cta-section`, `home-cta-content`, `home-cta-eyebrow`, `home-cta-button` | Styled; state classes are styled modifiers |
| `About.jsx` | `about-page`, `about-hero`, `about-hero-description`, `about-values`, `about-values-title`, `about-values-grid`, `value-card`, `value-number`, `about-cta`, `about-cta-copy` | Styled |
| `HowItWorks.jsx` | `how-page-shell`, `how-page-header`, `how-page-description`, `how-flow-section`, `how-flow-title`, `how-steps-grid`, `home-step-card`, `how-step-card`, `home-step-icon`, `how-process-cta`, `how-process-cta-copy`, `how-process-cta-note` | Styled |
| `Auth.jsx` | `auth-page`, `auth-card`, `auth-switch-card`, `auth-panel`, `signup-panel`, `signin-panel`, `signup-active`, `signin-active`, `auth-card-heading`, `auth-intro`, `auth-form`, `auth-switch-form`, `auth-field`, `auth-input-wrap`, `has-error`, `auth-field-error`, `password-visibility`, `auth-submit`, `auth-footnote`, `auth-mode-link`, `auth-forgot-link`, `form-message`, `auth-message`, `auth-message-error`, `auth-message-success`, `auth-message-info`, `auth-illustration` | Styled; dynamic mode/error/status classes are state modifiers |
| `NotFound.jsx` | `not-found-card` | Styled |
| `NotFound.jsx` | `not-found-page`, `not-found-actions` | Missing direct selectors |
| `Dashboard.jsx` | `dashboard-page`, `dashboard-hero`, `dashboard-hero-copy`, `dashboard-demo-notice`, `dashboard-focus-panel`, `dashboard-focus-heading`, `dashboard-status`, `dashboard-status-soft`, `dashboard-progress`, `dashboard-progress-heading`, `dashboard-progress-bar`, `dashboard-next-action`, `dashboard-next-label`, `dashboard-two-column`, `dashboard-panel`, `dashboard-panel-heading`, `dashboard-panel-description`, `dashboard-task-list`, `dashboard-task-item`, `dashboard-task-content`, `dashboard-task-title`, `dashboard-task-detail`, `dashboard-task-label`, `dashboard-task-state`, `dashboard-step-number`, `dashboard-weekly-list`, `dashboard-weekly-task`, `dashboard-weekly-copy`, `dashboard-empty-state`, `dashboard-account-links`, `dashboard-text-link` | Styled |
| `Learning.jsx` | `learning-page`, `learning-header`, `learning-demo-notice`, `learning-empty-state`, `course-grid`, `course-card`, `course-topline`, `course-tag`, `course-meta`, `course-progress`, `course-progress-heading`, `course-status`, `course-status-current`, `course-progress-value`, `course-progress-bar`, `course-step-count`, `course-next-step`, `course-next-label`, `course-actions`, `course-button` | Styled; `course-status-current` is a state modifier |
| `Profile.jsx` | `profile-page`, `profile-header`, `profile-demo-notice`, `profile-grid`, `profile-card`, `profile-summary-card`, `profile-avatar`, `profile-meta-list`, `profile-preview-bio`, `profile-form-card`, `profile-form-heading`, `profile-form-note`, `profile-form-grid`, `profile-field`, `profile-field-error`, `profile-bio-field`, `profile-character-count`, `profile-form-actions`, `profile-reset-button`, `page-status-message` | Styled through `.profile-card` composition; `profile-form-card` has no separate rule |
| `Settings.jsx` | `settings-page`, `settings-header`, `settings-demo-notice`, `settings-storage-warning`, `settings-panel`, `settings-form-heading`, `settings-storage-label`, `toggle-row`, `toggle-row-copy`, `settings-status` | Styled |
| `Settings.jsx` | `settings-form` | Missing direct selector; its children supply the layout |

## Stylesheet findings before edits

- `.hero-description` was the only non-dynamic CSS-only page class found. No JSX references it; it is a dead legacy Home rule.
- Other CSS-only classes are used by runtime-composed class strings (for example active navigation, auth modes/statuses, course status, and API health states), so they are not dead rules.
- The repeated selector scan found responsive overrides at distinct breakpoints, plus repeated design declarations and two identical reduced-motion sections. Retain intentional breakpoint/theme variants; consolidate redundant base declarations where they can be merged safely.
- Several classes provide grouping/semantic hooks rather than independent presentation. Their visual styles come from companion classes; the inventory calls this out rather than treating those rules as missing.

## Post-edit resolution

- Added direct, responsive presentation for `.page-header`, `.not-found-page`, `.not-found-card`, `.not-found-actions`, and `.api-status-text`.
- Added explicit `min-width: 0` layout coverage to `.settings-form` and `.profile-form-card`; their existing children/base card classes continue to provide the visual presentation.
- Added visible keyboard focus, typography inheritance for button/input/textarea/select controls, a 320px page gutter, shared palette/spacing/radius/shadow tokens, and a single reduced-motion block.
- Removed the unused `.hero-description` selector after confirming it had no JSX references. Consolidated the repeated `.home-plan-item small` declarations and adjacent duplicate header hover/active blocks.
- Reparsed 189 JSX class spellings against 198 stylesheet class selectors. There are no uncovered classes; the only partial token is the runtime prefix `auth-message-`, covered by its error/success/info variants.
- Reparsed the stylesheet after editing: no duplicate selector blocks remain within the same media/theme context; responsive and theme-specific overrides remain scoped to their intended contexts.
