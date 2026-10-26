import type { Dictionary } from "./types";

// English (ADR-032). Same keys as tr.ts; placeholders kept as {name}.
export const en: Dictionary = {
  meta: {
    siteDescription: "A cinematic cocktail archive: carefully formulated cocktail recipes.",
  },
  nav: {
    home: "Home",
    homeLabel: "{brand} — Home",
    cocktails: "Cocktails",
    feed: "Feed",
    account: "Account",
    login: "Sign in",
    notifications: "Notifications",
    notificationsNew: "Notifications, {n} new",
    accountNew: "Account, {n} new notifications",
    language: "Language",
  },
  themes: {
    title: "Appearance",
    rx: {
      name: "Rx",
      hint: "Default: dark, crimson",
    },
    "night-bar": {
      name: "Night Bar",
      hint: "Warm dark, cherry red",
    },
    negroni: {
      name: "Negroni",
      hint: "Dark, bitter orange",
    },
    "night-serif": {
      name: "Night Serif",
      hint: "Night Bar with the paper's type",
    },
    paper: {
      name: "Prescription Paper",
      hint: "Light, pharmacy paper",
    },
    "paper-rx": {
      name: "Paper Rx",
      hint: "Prescription Paper with Rx's type",
    },
  },
  status: {
    toCocktails: "Go to cocktails",
    home: "Home",
    notFoundTitle: "This prescription was not found",
    notFoundBody: "The page you are looking for never existed, was removed, or has moved.",
    errorTitle: "Something went wrong",
    errorBody: "There was a problem loading the page. Try again in a moment.",
    retry: "Try again",
    notFoundMeta: "Not found",
  },
};
