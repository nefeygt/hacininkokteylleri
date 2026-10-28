// The app's own English words; follows docs/glossary.md (ADR-033).
import type { AppDictionary } from "./tr";

export const en: AppDictionary = {
  nativeAuth: {
    googleNoToken: "Google didn't send an ID. Try again.",
    noPlayServices: "Google Play services aren't available on this device.",
    googleUnavailable: "Google sign-in doesn't work in this version.",
    appleNoToken: "Apple didn't send an ID. Try again.",
    appleFailed: "Couldn't finish signing in with Apple. Try again.",
  },
  recipes: {
    ingredientMissing: "An ingredient from the catalogue wasn't found. Close the recipe and open it again.",
    photoTooBig: "The photo is too big. Try another one.",
  },
  tabs: {
    account: "Account",
    logEntry: "Log entry",
  },
  account: {
    lastStep: "One last step",
    lastStepBody: "Pick a username and confirm you're over 18.",
    completeProfile: "Complete your profile",
    logsDefaultLabel: "New entries start public",
  },
  feed: {
    recipesLoadFailed: "Couldn't load the recipes. Try again",
    completeProfileFirst: "To see the logs of the people you follow, complete your profile first.",
    signInToSee: "Sign in to see the drink logs of the people you follow here.",
  },
  archive: {
    loadFailed: "Couldn't load the cocktails.",
    searchPlaceholder: "Search recipes",
  },
  load: {
    log: "Couldn't load the entry. Try again",
    logs: "Couldn't load the entries. Try again",
    recipe: "Couldn't load the recipe. Try again",
    recipes: "Couldn't load the recipes. Try again",
    profile: "Couldn't load the profile. Try again",
    reviews: "Couldn't load the reviews. Try again",
    comments: "Couldn't load the comments. Try again",
  },
  notFound: {
    log: "This entry wasn't found.",
    logPublic: "This entry wasn't found, or it isn't public any more.",
    recipe: "This recipe wasn't found.",
    profile: "This profile wasn't found.",
  },
  gate: {
    logsSignIn: "Sign in to use the drink log.",
    logsFinish: "Complete your profile first to use the drink log.",
    recipesSignIn: "Sign in to write recipes.",
    recipesFinish: "Complete your profile first to write recipes.",
  },
  myRecipes: {
    newSubtitle: "Write your own recipe. Once it's published it shows on your profile and in the feed.",
    editLabel: "Edit the recipe {name}",
  },
  recipe: {
    savedToFavorites: "Added to your favorites.",
  },
  log: {
    editLabel: "Edit the entry for {name}",
  },
  stars: {
    none: "No rating",
  },
  glossary: {
    showDefinition: "Show the definition",
  },
  signIn: {
    signUpSent: "We sent the confirmation e-mail.\n1. Open your e-mail. If it isn't there, check the spam folder.\n2. Tap the link. The site opens; you don't need to do anything else there.\n3. Come back here and sign in with the same e-mail and password.\nIf an account with this address already exists, no e-mail comes: sign in or reset your password.",
    resetSent: "If an account with this address exists, we sent the password reset link.\n1. Open your e-mail. If it isn't there, check the spam folder.\n2. Tap the link and set your new password on the site.\n3. Come back here and sign in with the new password.",
  },
  date: {
    previousDay: "Previous day",
    nextDay: "Next day",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    openCalendar: "Date: {date}. Open the calendar",
    closeCalendar: "Close the calendar",
    today: "Today",
    yesterday: "Yesterday",
  },
  profile: {
    of: "{name}'s profile",
  },
  showcase: {
    pickRecipe: "Pick a recipe",
  },
  logForm: {
    unitNone: "none selected",
    stepsLocked: "Preparation, unchanged: {steps}",
    halfStarTip: "For a half star, tap the left half of a star.",
    unitShort: "unit",
  },
  recipeForm: {
    colorCode: "Color code",
    stepLabel: "Step {n}",
    removeStep: "Delete the step",
  },
};
