import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

/** Empty tab shell for M0: `bg` screen with one white card. Each tab replaces it in its own milestone. */
export function PlaceholderScreen({ title, note, children }: { title: string; note: string; children?: ReactNode }) {
  const { colors, text, space, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top + space.s16,
        paddingHorizontal: space.screen,
        paddingBottom: space.s16,
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.s20, gap: space.s8 }}>
        <Text style={[text.title, { color: colors.text }]}>{title}</Text>
        <Text style={[text.body, { color: colors.textSecondary }]}>{note}</Text>
        {children}
      </View>
    </View>
  );
}
