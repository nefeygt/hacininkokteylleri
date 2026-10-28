import { Children, type ReactNode } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { INTL_LOCALES, type Locale } from "@shared/i18n/locales";
import { useLocale } from "@/lib/i18n";
import { type Theme } from "@/lib/theme";
import { useStyles } from "@/lib/theme-context";

// The site's voices: the theme's display face for names and headings, its reading face for text, its mono face
// for labels and amounts (ADR-028).

export function Heading({ style, ...props }: TextProps) {
  const styles = useStyles(makeStyles);
  return <Text {...props} style={[styles.heading, style]} />;
}

export function Body({ style, ...props }: TextProps) {
  const styles = useStyles(makeStyles);
  return <Text {...props} style={[styles.body, style]} />;
}

export function Mono({ style, ...props }: TextProps) {
  const styles = useStyles(makeStyles);
  return <Text {...props} style={[styles.mono, style]} />;
}

/** Uppercase in the language: Turkish needs "i" → "İ" first ("ARŞİV"); English keeps "I" ("DRINK"). */
export function upperCase(text: string, locale: Locale): string {
  return locale === "tr" ? text.replace(/i/g, "İ").toLocaleUpperCase(INTL_LOCALES.tr) : text.toLocaleUpperCase(INTL_LOCALES[locale]);
}

function upperChildren(children: ReactNode, locale: Locale): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" ? upperCase(child, locale) : typeof child === "number" ? String(child) : child
  );
}

/** The small uppercase mono label ("MALZEMELER", "ARŞİV" / "INGREDIENTS"), uppercased the way its language does. */
export function Label({ style, children, ...props }: TextProps) {
  const styles = useStyles(makeStyles);
  const { locale } = useLocale();
  return (
    <Text {...props} style={[styles.label, style]}>
      {upperChildren(children, locale)}
    </Text>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  heading: { fontFamily: t.fonts.displayBold, color: t.colors.textPrimary, fontSize: 18, letterSpacing: -0.3 },
  body: { fontFamily: t.fonts.sans, color: t.colors.textPrimary, fontSize: 15 },
  mono: { fontFamily: t.fonts.mono, color: t.colors.textSecondary, fontSize: 13 },
  label: {
    fontFamily: t.fonts.mono,
    color: t.colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
  },
});
