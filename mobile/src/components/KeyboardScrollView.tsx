import { useIsFocused } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, ScrollView, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps } from "react-native";

/** Room left between the focused field and the keyboard: enough for the buttons under it. */
const GAP = 72;

/**
 * A ScrollView that keeps the focused field above the keyboard. The app draws
 * edge to edge, so Android no longer shrinks the window for the keyboard (and
 * KeyboardAvoidingView would need each screen's header height): instead the
 * content gets the keyboard's height as room at the bottom and scrolls the
 * field into view.
 */
export default function KeyboardScrollView({ children, onScroll, ...props }: ScrollViewProps) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  const [inset, setInset] = useState(0);
  // Screens left mounted underneath (other tabs, the stack) ignore the keyboard.
  const focused = useIsFocused();

  useEffect(() => {
    if (!focused) {
      setInset(0);
      return;
    }
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) => {
      const { height, screenY } = event.endCoordinates;
      setInset(height);
      // After the room is laid out, scroll by however much the keyboard covers the field.
      requestAnimationFrame(() => {
        const input = TextInput.State.currentlyFocusedInput();
        input?.measureInWindow((_x, y, _width, fieldHeight) => {
          const covered = y + fieldHeight + GAP - screenY;
          if (covered > 0) ref.current?.scrollTo({ y: offset.current + covered, animated: true });
        });
      });
    });
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [focused]);

  function track(event: NativeSyntheticEvent<NativeScrollEvent>) {
    offset.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  }

  return (
    <ScrollView ref={ref} keyboardShouldPersistTaps="handled" scrollEventThrottle={16} {...props} onScroll={track}>
      {children}
      {inset > 0 && <View style={{ height: inset }} />}
    </ScrollView>
  );
}
