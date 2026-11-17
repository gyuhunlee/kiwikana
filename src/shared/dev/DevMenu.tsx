import { useSyncExternalStore, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scenarios } from '../testing/scenarios';
import { useTheme } from '../theme/ThemeProvider';
import { appClock, getClockOffsetMs, subscribeToClockOffset } from '../time/appClock';
import { dayKey, MS_PER_DAY, MS_PER_HOUR } from '../time/dayKey.logic';
import { formatLocal } from '../time/zone.logic';
import { useDevStore } from './dev.store';

// Dev builds only (docs/testing.md section 6). Inspectors arrive with the features they inspect.
export function DevMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, text, space } = useTheme();
  const insets = useSafeAreaInsets();
  const dev = useDevStore();
  const offsetMs = useSyncExternalStore(subscribeToClockOffset, getClockOffsetMs);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingTop: insets.top + space.s16,
          paddingBottom: insets.bottom + space.s32,
          paddingHorizontal: space.screen,
          gap: space.s24,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[text.title, { color: colors.text }]}>Dev menu</Text>
          <Row label="Close" onPress={onClose} />
        </View>

        {dev.status ? <Text style={[text.caption, { color: colors.textSecondary }]}>{dev.status}</Text> : null}

        <Section title="TIME">
          <Text style={[text.body, { color: colors.text }]}>
            App time {formatLocal(appClock.now(), appClock.timeZone())}
          </Text>
          <Text style={[text.caption, { color: colors.textSecondary }]}>
            Day key {dayKey(appClock)} · {offsetMs === 0 ? 'real time' : `offset ${Math.round(offsetMs / MS_PER_HOUR)} h`}
          </Text>
          <Row label="+1 hour" onPress={() => dev.shiftTime(MS_PER_HOUR)} />
          <Row label="+1 day" onPress={() => dev.shiftTime(MS_PER_DAY)} />
          <Row label="Jump to 3:59 AM" onPress={() => dev.jumpToLocalTime(3, 59)} />
          <Row label="Jump to 4:01 AM" onPress={() => dev.jumpToLocalTime(4, 1)} />
          <Row label="Reset to real time" onPress={dev.resetTime} />
        </Section>

        <Section title="SCENARIOS (WIPES USER STATE)">
          {Object.keys(scenarios).map((name) => (
            <Row key={name} label={name} onPress={() => dev.loadScenario(name)} />
          ))}
        </Section>

        <Section title="RESET">
          <Row label="Wipe user state" onPress={dev.resetUserState} />
        </Section>
      </ScrollView>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, text, space } = useTheme();
  return (
    <View style={{ gap: space.s8 }}>
      <Text style={[text.caption, { color: colors.textSecondary, letterSpacing: 1 }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, text, space, radius, size } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: size.tapTarget,
        justifyContent: 'center',
        paddingHorizontal: space.s16,
        borderRadius: radius.md,
        backgroundColor: colors.raised,
      }}
    >
      <Text style={[text.bodyBold, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}
