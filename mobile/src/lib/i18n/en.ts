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
  },
  feed: {
    recipesLoadFailed: "Couldn't load the recipes. Try again",
    completeProfileFirst: "To see the logs of the people you follow, complete your profile first.",
    signInToSee: "Sign in to see the drink logs of the people you follow here.",
  },
  archive: {
    loadFailed: "Couldn't load the cocktails.",
    searchPlaceholder: "Search cocktails, ingredients",
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
};
