import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BarsIcon, HomeIcon } from './src/components/Icons';
import { S } from './src/i18n/strings';
import { ScrollTax } from './src/native/ScrollTax';
import Analytics from './src/screens/Analytics';
import Dashboard from './src/screens/Dashboard';
import Onboarding, { Step } from './src/screens/Onboarding';
import Settings from './src/screens/Settings';
import { colors } from './src/theme';

type Screen = 'home' | 'analytics' | 'settings';
const TAB_HEIGHT = 64; // floating pill height + gap

function Main() {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [onboard, setOnboard] = useState<Step | null>(null);
  const [consented, setConsented] = useState(false);
  const [accOk, setAccOk] = useState(true);
  const [overlayOk, setOverlayOk] = useState(true);
  const [screen, setScreen] = useState<Screen>('home');

  const checkPerms = useCallback(async () => {
    const [o, a] = await Promise.all([
      ScrollTax.isOverlayGranted(),
      ScrollTax.isAccessibilityEnabled(),
    ]);
    setOverlayOk(o);
    setAccOk(a);
  }, []);

  useEffect(() => {
    (async () => {
      setConsented(!!(await ScrollTax.getPref('consent')));
      if (!(await ScrollTax.getPref('onboarded'))) setOnboard('welcome');
      await checkPerms();
      setReady(true);
    })();
    const sub = AppState.addEventListener(
      'change',
      s => s === 'active' && checkPerms(),
    );
    return () => sub.remove();
  }, [checkPerms]);

  const closeOnboarding = useCallback(() => {
    ScrollTax.setPref('onboarded', '1');
    setOnboard(null);
    checkPerms();
  }, [checkPerms]);

  const root = [styles.root, { paddingTop: insets.top }];
  if (!ready) return <View style={root} />;

  const needsFix = !accOk || !overlayOk || !consented;
  const showTabs = screen !== 'settings';
  const bottomPad = (showTabs ? TAB_HEIGHT : 0) + insets.bottom + 24;

  return (
    <View style={root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}
      >
        {screen === 'settings' ? (
          <Settings onBack={() => setScreen('home')} />
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.logo}>🧠 ScrollTax</Text>
              <Pressable onPress={() => setScreen('settings')} hitSlop={12}>
                <Text style={styles.gear}>⚙</Text>
              </Pressable>
            </View>
            {needsFix && (
              <Pressable
                style={styles.banner}
                onPress={() =>
                  setOnboard(!consented || !accOk ? 'accessibility' : 'overlay')
                }
              >
                <Text style={styles.bannerText}>{S.fixPerms}</Text>
              </Pressable>
            )}
            {screen === 'analytics' ? <Analytics /> : <Dashboard />}
          </>
        )}
      </ScrollView>

      {showTabs && (
        <View
          pointerEvents="box-none"
          style={[styles.tabsWrap, { bottom: insets.bottom + 12 }]}
        >
          <View style={styles.tabs}>
            <Tab
              label={S.tabHome}
              icon={HomeIcon}
              on={screen === 'home'}
              onPress={() => setScreen('home')}
            />
            <Tab
              label={S.tabMonthly}
              icon={BarsIcon}
              on={screen === 'analytics'}
              onPress={() => setScreen('analytics')}
            />
          </View>
        </View>
      )}

      {onboard && (
        <Onboarding
          initialStep={onboard}
          onConsent={() => {
            ScrollTax.setPref('consent', new Date().toISOString());
            setConsented(true);
          }}
          onClose={closeOnboarding}
        />
      )}
    </View>
  );
}

function Tab({
  label,
  icon: Icon,
  on,
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{ color: string }>;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tab, on && styles.tabOn]} onPress={onPress}>
      <Icon color={on ? '#1A0A12' : colors.muted} />
      {on && <Text style={styles.tabLabel}>{label}</Text>}
    </Pressable>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: { color: colors.text, fontSize: 24, fontWeight: '800' },
  gear: { color: colors.muted, fontSize: 24 },
  banner: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerText: { color: '#1A0A12', fontWeight: '700' },
  tabsWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#26262E',
    borderRadius: 36,
    padding: 6,
    gap: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 30,
  },
  tabOn: { backgroundColor: colors.accent },
  tabLabel: { color: '#1A0A12', fontSize: 14, fontWeight: '700' },
});
