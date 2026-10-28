import { Children, type ReactNode } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
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

/** "i" → "İ" first: toUpperCase() alone gives "ARŞIV", and so does CSS/textTransform without a Turkish locale. */
export function upperTr(text: string): string {
  return text.replace(/i/g, "İ").toUpperCase();
}

function upperChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" ? upperTr(child) : typeof child === "number" ? String(child) : child
  );
}

/** The small uppercase mono label ("MALZEMELER", "ARŞİV"), uppercased the Turkish way. */
export function Label({ style, children, ...props }: TextProps) {
  const styles = useStyles(makeStyles);
  return (
    <Text {...props} style={[styles.label, style]}>
      {upperChildren(children)}
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
