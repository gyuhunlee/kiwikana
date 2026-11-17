import { Tabs } from 'expo-router';
import { TabBar } from '../../src/shared/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="decks" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
