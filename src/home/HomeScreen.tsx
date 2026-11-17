import { Text, View } from 'react-native';
import { DevMenu } from '../shared/dev/DevMenu';
import { useDevMenuGesture } from '../shared/dev/useDevMenuGesture';
import { useTheme } from '../shared/theme/ThemeProvider';
import { useDayKey } from '../shared/time/useDayKey';
import { PlaceholderScreen } from '../shared/ui/PlaceholderScreen';

// M0 shell. The top bar, dropdown and modes arrive in M5.
export function HomeScreen() {
  const { colors, text } = useTheme();
  const today = useDayKey();
  const devMenu = useDevMenuGesture();

  return (
    <View style={{ flex: 1 }} {...devMenu.touchHandlers}>
      <PlaceholderScreen title="Home" note="Words, Kana and Stroke live here.">
        <Text style={[text.caption, { color: colors.textSecondary }]}>Day {today}</Text>
        {__DEV__ ? (
          <Text style={[text.caption, { color: colors.textSecondary }]}>Hold 3 fingers to open the dev menu.</Text>
        ) : null}
      </PlaceholderScreen>
      {__DEV__ ? <DevMenu visible={devMenu.visible} onClose={devMenu.close} /> : null}
    </View>
  );
}
