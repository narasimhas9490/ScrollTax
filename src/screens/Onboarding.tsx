import React, { useEffect, useState } from 'react';
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Legal from '../components/Legal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S } from '../i18n/strings';
import { PRIVACY_POLICY, TERMS } from '../legal.generated';
import { ScrollTax } from '../native/ScrollTax';
import { colors } from '../theme';

export type Step = 'welcome' | 'accessibility' | 'overlay';
const ORDER: Step[] = ['welcome', 'accessibility', 'overlay'];

type Props = {
  initialStep: Step;
  onConsent: () => void;
  onClose: () => void;
};

/** First-run modal: one screen per permission, each explaining why before it opens settings. */
export default function Onboarding({ initialStep, onConsent, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(initialStep);
  const [doc, setDoc] = useState<'terms' | 'privacy' | null>(null);

  // When the user comes back from system settings, move on if the permission is now granted.
  useEffect(() => {
    if (step === 'welcome') return;
    const check = async () => {
      const overlayOk = await ScrollTax.isOverlayGranted();
      if (
        step === 'accessibility' &&
        (await ScrollTax.isAccessibilityEnabled())
      ) {
        if (overlayOk) onClose();
        else setStep('overlay');
      } else if (step === 'overlay' && overlayOk) {
        onClose();
      }
    };
    const sub = AppState.addEventListener(
      'change',
      s => s === 'active' && check(),
    );
    return () => sub.remove();
  }, [step, onClose]);

  const dots = (
    <View style={styles.dots}>
      {ORDER.map(s => (
        <View key={s} style={[styles.dot, s === step && styles.dotOn]} />
      ))}
    </View>
  );

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.root,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {doc ? (
          <>
            <Pressable onPress={() => setDoc(null)}>
              <Text style={styles.link}>‹ {S.back}</Text>
            </Pressable>
            <Legal text={doc === 'terms' ? TERMS : PRIVACY_POLICY} />
          </>
        ) : step === 'welcome' ? (
          <>
            {dots}
            <View style={styles.center}>
              <Text style={styles.icon}>🧠</Text>
              <Text style={styles.title}>{S.welcomeTitle}</Text>
              <Text style={styles.body}>{S.welcomeDesc}</Text>
            </View>
            <Pressable
              style={styles.btn}
              onPress={() => setStep('accessibility')}
            >
              <Text style={styles.btnText}>{S.continue}</Text>
            </Pressable>
          </>
        ) : step === 'accessibility' ? (
          <>
            {dots}
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.icon}>👁️</Text>
              <Text style={styles.title}>{S.accTitle}</Text>
              {(['d1', 'd2', 'd3', 'd4'] as const).map(k => (
                <Text key={k} style={styles.bullet}>
                  • {S[k]}
                </Text>
              ))}
              <Text style={styles.hint}>{S.accHint}</Text>
              <Text style={[styles.small, { marginTop: 16 }]}>
                {S.acceptLine}
              </Text>
              <View style={styles.links}>
                <Pressable onPress={() => setDoc('terms')}>
                  <Text style={styles.link}>{S.terms}</Text>
                </Pressable>
                <Pressable onPress={() => setDoc('privacy')}>
                  <Text style={styles.link}>{S.privacy}</Text>
                </Pressable>
              </View>
              <Text style={styles.small}>{S.notAffiliated}</Text>
            </ScrollView>
            <Pressable
              style={styles.btn}
              onPress={() => {
                onConsent();
                ScrollTax.openAccessibilitySettings();
              }}
            >
              <Text style={styles.btnText}>{S.agreeOpen}</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.ghostText}>{S.later}</Text>
            </Pressable>
          </>
        ) : (
          <>
            {dots}
            <View style={styles.center}>
              <Text style={styles.icon}>🪟</Text>
              <Text style={styles.title}>{S.overlayTitle}</Text>
              <Text style={styles.body}>{S.overlayDesc}</Text>
              <Text style={styles.hint}>{S.overlayHint}</Text>
            </View>
            <Pressable
              style={styles.btn}
              onPress={ScrollTax.openOverlaySettings}
            >
              <Text style={styles.btnText}>{S.openSettings}</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.ghostText}>{S.later}</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.bar },
  dotOn: { backgroundColor: colors.accent, width: 22 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { alignItems: 'center', paddingBottom: 16 },
  icon: { fontSize: 64, marginBottom: 8 },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 8,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bullet: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  hint: {
    color: colors.accent,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  small: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  links: { flexDirection: 'row', gap: 24, marginVertical: 4 },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: '#1A0A12', fontWeight: '700', fontSize: 16 },
  btnGhost: { paddingVertical: 14, alignItems: 'center' },
  ghostText: { color: colors.muted, fontSize: 14 },
});
