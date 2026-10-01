import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import Legal from '../components/Legal';
import { S } from '../i18n/strings';
import { PRIVACY_POLICY, TERMS } from '../legal.generated';
import { ScrollTax } from '../native/ScrollTax';
import { colors } from '../theme';

type Props = { onBack: () => void };

export default function Settings({ onBack }: Props) {
  const [doc, setDoc] = useState<'terms' | 'privacy' | null>(null);

  const wipe = () =>
    Alert.alert(S.deleteData, S.deleteConfirm, [
      { text: S.cancel, style: 'cancel' },
      {
        text: S.deleteData,
        style: 'destructive',
        onPress: async () => {
          await ScrollTax.clearHistory();
          ToastAndroid.show(S.deleted, ToastAndroid.SHORT);
        },
      },
    ]);

  if (doc) {
    return (
      <View>
        <Pressable onPress={() => setDoc(null)}>
          <Text style={styles.link}>‹ {S.back}</Text>
        </Pressable>
        <Legal text={doc === 'terms' ? TERMS : PRIVACY_POLICY} />
      </View>
    );
  }

  return (
    <ScrollView>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>‹ {S.back}</Text>
      </Pressable>
      <Text style={styles.title}>{S.settings}</Text>

      <View style={styles.card}>
        <Pressable style={styles.row} onPress={() => setDoc('terms')}>
          <Text style={styles.rowText}>{S.terms}</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => setDoc('privacy')}>
          <Text style={styles.rowText}>{S.privacy}</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={wipe}>
          <Text style={[styles.rowText, { color: '#FF6B6B' }]}>
            {S.deleteData}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.note}>{S.notAffiliated}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  row: { paddingVertical: 16 },
  rowText: { color: colors.text, fontSize: 15 },
  note: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
});
