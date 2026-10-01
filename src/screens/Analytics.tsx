import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { S } from '../i18n/strings';
import { MonthRow, ScrollTax } from '../native/ScrollTax';
import { formatDuration, monthLabel } from '../stats';
import { colors } from '../theme';

/** Every month with data, newest first, aggregated. */
export default function Analytics() {
  const [months, setMonths] = useState<MonthRow[] | null>(null);

  useEffect(() => {
    ScrollTax.getMonthly().then(m => setMonths([...m].reverse()));
  }, []);

  if (!months) return null;
  const max = Math.max(1, ...months.map(m => m.count));
  const count = months.reduce((n, m) => n + m.count, 0);
  const ms = months.reduce((n, m) => n + m.ms, 0);

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.muted}>{S.allTime}</Text>
        <Text style={styles.big}>{count}</Text>
        <Text style={styles.muted}>{S.reelsScrolled}</Text>
        <Text style={[styles.statVal, { marginTop: 14 }]}>
          {formatDuration(ms)}
        </Text>
        <Text style={styles.muted}>{S.totalTime}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>{S.monthly}</Text>
        {months.length === 0 && <Text style={styles.muted}>{S.noReels}</Text>}
        {months.map(m => (
          <View key={m.month} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.month}>{monthLabel(m.month)}</Text>
              <Text style={styles.count}>{m.count}</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(2, (m.count / max) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.muted}>
              {formatDuration(m.ms)} · {Math.round(m.count / m.days)}{' '}
              {S.perActiveDay}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  muted: { color: colors.muted, fontSize: 12 },
  big: { color: colors.text, fontSize: 64, fontWeight: '800', lineHeight: 72 },
  statVal: { color: colors.text, fontSize: 18, fontWeight: '700' },
  section: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: { paddingVertical: 10 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between' },
  month: { color: colors.text, fontSize: 14, fontWeight: '600' },
  count: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  track: {
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: 4,
    marginVertical: 6,
    overflow: 'hidden',
  },
  fill: { height: 8, backgroundColor: colors.accent, borderRadius: 4 },
});
