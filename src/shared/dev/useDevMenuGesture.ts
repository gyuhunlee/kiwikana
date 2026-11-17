import { useCallback, useEffect, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

const FINGERS = 3;
const HOLD_MS = 600;

/** 3-finger long press opens the dev menu (docs/testing.md section 6). Does nothing in release builds. */
export function useDevMenuGesture() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const onTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      if (!__DEV__) return;
      cancel();
      if (event.nativeEvent.touches.length === FINGERS) {
        timer.current = setTimeout(() => setVisible(true), HOLD_MS);
      }
    },
    [cancel],
  );

  return {
    visible,
    close: useCallback(() => setVisible(false), []),
    touchHandlers: { onTouchStart, onTouchEnd: cancel, onTouchCancel: cancel },
  };
}
