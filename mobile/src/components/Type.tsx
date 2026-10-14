import { Children, type ReactNode } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { colors, fonts } from "@/lib/theme";

// The site's two voices: Inter for names and headings, JetBrains Mono for the
// prescription text, labels and numbers.

export function Heading({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.heading, style]} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

export function Mono({ style, ...props }: TextProps) {
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
  return (
    <Text {...props} style={[styles.label, style]}>
      {upperChildren(children)}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.sansBold, color: colors.textPrimary, fontSize: 18, letterSpacing: -0.3 },
  body: { fontFamily: fonts.sans, color: colors.textPrimary, fontSize: 15 },
  mono: { fontFamily: fonts.mono, color: colors.textSecondary, fontSize: 13 },
  label: {
    fontFamily: fonts.mono,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
  },
});
