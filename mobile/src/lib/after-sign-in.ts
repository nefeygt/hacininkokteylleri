import { router, type Href } from "expo-router";

// What happens after a member signs in from somewhere other than the Hesap
// tab: they come back to that screen (a recipe), and a heart that sent them to
// sign in is saved for them. Signing in from the Hesap tab itself lands on the
// archive. Restoring a stored session at launch is not a sign-in and moves nobody.

// Kept apart: the Hesap tab leaves (and clears the way back) before the
// favourites provider, its parent, hears about the new member.
let returnTo: Href | null = null;
let favorite: string | null = null;

/**
 * Opens the Hesap tab to sign in. Once signed in (and onboarded) the member
 * comes back to `from`; `cocktailId` is a cocktail to save for them then.
 */
export function askToSignIn(from?: Href, cocktailId?: string) {
  returnTo = from ?? null;
  favorite = from ? (cocktailId ?? null) : null;
  // Back to the one tab navigator first: navigating from the recipe would
  // push a second one, and both Hesap tabs would then react to the sign-in.
  if (router.canDismiss()) router.dismissAll();
  router.navigate("/account");
}

/** The member left the Hesap tab without signing in: nothing waits for them any more. */
export function forgetSignInRequest() {
  returnTo = null;
  favorite = null;
}

/** The cocktail the member hearted before signing in, once; the favourites provider saves it. */
export function takePendingFavorite(): string | null {
  const cocktailId = favorite;
  favorite = null;
  return cocktailId;
}

/** Leaves the Hesap tab (or onboarding) for the screen the member came from, or the archive. */
export function leaveAfterSignIn() {
  const from = returnTo;
  returnTo = null;
  if (router.canDismiss()) router.dismissAll();
  // The archive tab first, so going back from the recipe lands there; the
  // recipe is pushed again, as it was popped on the way to the Hesap tab.
  router.navigate("/");
  // A tab (the feed) is switched to, never pushed: a pushed tab path opens a second tab navigator.
  if (from === "/feed") router.navigate(from);
  else if (from) router.push(from);
}
