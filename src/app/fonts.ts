// Every theme's fonts (ADR-028), shared by the site's and the panel's root layouts. Only the default
// theme's two are preloaded; the others download when a theme that uses them is picked.
import {
  Atkinson_Hyperlegible_Next,
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Serif,
  JetBrains_Mono,
  Source_Sans_3,
} from "next/font/google";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-plex-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-jetbrains-mono",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-bricolage",
  display: "swap",
  preload: false,
});
const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-source-sans",
  display: "swap",
  preload: false,
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--ff-instrument-serif",
  display: "swap",
  preload: false,
});
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--ff-atkinson",
  display: "swap",
  preload: false,
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--ff-plex-mono",
  display: "swap",
  preload: false,
});

export const fontVariables = [plexSans, jetbrainsMono, bricolage, sourceSans, instrumentSerif, atkinson, plexMono]
  .map((font) => font.variable)
  .join(" ");
