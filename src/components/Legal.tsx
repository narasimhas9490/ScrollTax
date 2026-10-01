import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

/** Renders the tiny markdown subset used in legal/*.md (#, ##, -, **bold**). */
export default function Legal({ text }: { text: string }) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {text.split('\n').map((raw, i) => {
        const line = raw.replace(/\*\*/g, '');
        if (!line.trim()) return null;
        if (line.startsWith('## '))
          return (
            <Text key={i} style={styles.h2}>
              {line.slice(3)}
            </Text>
          );
        if (line.startsWith('# '))
          return (
            <Text key={i} style={styles.h1}>
              {line.slice(2)}
            </Text>
          );
        if (line.startsWith('- '))
          return (
            <Text key={i} style={styles.p}>
              {'•  ' + line.slice(2)}
            </Text>
          );
        return (
          <Text key={i} style={styles.p}>
            {line}
          </Text>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 6 },
  h2: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  p: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 4 },
});
