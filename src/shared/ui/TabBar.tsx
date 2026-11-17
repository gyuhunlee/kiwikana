import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

const LABELS: Record<string, string> = {
  index: 'Home',
  decks: 'Decks',
  profile: 'Profile',
};

interface TabBarProps {
  state: { index: number; routes: readonly { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

// DB-63: label + small kiwi dot on the active tab. Outline icons come with the Home screen in M5.
export function TabBar({ state, navigation }: TabBarProps) {
  const { colors, text, space, size, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderTopWidth: size.line,
        borderTopColor: colors.line,
        paddingBottom: insets.bottom,
      }}
    >
      {state.routes.map((route, index) => {
        const active = index === state.index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => navigation.navigate(route.name)}
            style={{
              flex: 1,
              minHeight: size.tapTarget,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: space.s8,
              gap: space.s4,
            }}
          >
            <Text style={[text.caption, { color: active ? colors.text : colors.textSecondary }]}>
              {LABELS[route.name] ?? route.name}
            </Text>
            <View
              style={{
                width: size.tabDot,
                height: size.tabDot,
                borderRadius: radius.full,
                backgroundColor: active ? colors.kiwi : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
