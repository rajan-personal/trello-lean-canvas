/**
 * Layout tiers. Keep these queries identical to the `@custom-variant`
 * definitions in `src/styles.css` and the raw `@media` rules in component CSS
 * (`unit/breakpoints.test.ts` enforces this).
 *
 * - phone: narrow screens, and any short screen (phone landscape).
 *   Compact header, stacked views, full-screen panels.
 * - drawer: everything below the docked width, plus short screens.
 *   The sidebar overlays content instead of taking layout space.
 * - docked: wide and tall enough for a persistent, collapsible sidebar.
 */
export const PHONE_MAX_WIDTH = 760
export const SHORT_MAX_HEIGHT = 500
export const DOCKED_MIN_WIDTH = 1200

export const phoneQuery = `(max-width: ${PHONE_MAX_WIDTH}px), (max-height: ${SHORT_MAX_HEIGHT}px)`
export const abovePhoneQuery = `(min-width: ${PHONE_MAX_WIDTH + 1}px) and (min-height: ${SHORT_MAX_HEIGHT + 1}px)`
export const drawerQuery = `(max-width: ${DOCKED_MIN_WIDTH - 1}px), (max-height: ${SHORT_MAX_HEIGHT}px)`
export const dockedQuery = `(min-width: ${DOCKED_MIN_WIDTH}px) and (min-height: ${SHORT_MAX_HEIGHT + 1}px)`
