// Module-level flag: persists across component unmount/remount within the session,
// resets on full page reload. Used to skip entry animations when returning via
// a view transition (the morph already handles the visual continuity).
export let navigatingViaViewTransition = false;

export function setNavigatingViaViewTransition(value: boolean) {
  navigatingViaViewTransition = value;
}
