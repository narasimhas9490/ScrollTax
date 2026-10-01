import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { S } from '../i18n/strings';
import { DayRow, ReelRow, ScrollTax } from '../native/ScrollTax';
import {
  dayKey,
  fillDays,
  formatDuration,
  labelDay,
  lastDays,
  weekday,
} from '../stats';
import { colors, platformLabel } from '../theme';

const BAR_MAX = 120;
type Range = 7 | 30;

/** Home: pick 7 or 30 days, tap a day to see that day's reels. */
export default function Dashboard() {
  const [range, setRange] = useState<Range>(7);
  const [rows, setRows] = useState<DayRow[]>([]);
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const today = dayKey(new Date());

  const load = useCallback(async () => {
    const days = lastDays(range);
    setRows(fillDays(days, await ScrollTax.getDaily(days[0])));
    setReels(await ScrollTax.getReelsForDay(selected));
  }, [range, selected]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  const pickRange = (r: Range) => {
    setRange(r);
    if (!lastDays(r).includes(selected)) setSelected(today);
  };

  const day = rows.find(r => r.day === selected) ?? {
    day: selected,
    count: 0,
    ms: 0,
  };
  const max = Math.max(1, ...rows.map(r => r.count));
  const byPlatform = useMemo(() => {
    const m: Record<string, number> = {};
    reels.forEach(r => (m[r.platform] = (m[r.platform] ?? 0) + 1));
    return Object.entries(m);
  }, [reels]);

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.muted}>{labelDay(selected, today)}</Text>
        <Text style={styles.big}>{day.count}</Text>
        <Text style={styles.muted}>{S.reelsScrolled}</Text>
        <View style={styles.stats}>
          <View>
            <Text style={styles.statVal}>{formatDuration(day.ms)}</Text>
            <Text style={styles.muted}>{S.totalTime}</Text>
          </View>
          <View>
            <Text style={styles.statVal}>
              {day.count ? formatDuration(day.ms / day.count) : '0s'}
            </Text>
            <Text style={styles.muted}>{S.avgPerReel}</Text>
          </View>
        </View>
        {byPlatform.length > 0 && (
          <Text style={[styles.muted, { marginTop: 10 }]}>
            {byPlatform
              .map(([p, n]) => `${platformLabel[p] ?? p} ${n}`)
              .join('  ·  ')}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.segment}>
          {([7, 30] as Range[]).map(r => (
            <Pressable
              key={r}
              style={[styles.seg, range === r && styles.segOn]}
              onPress={() => pickRange(r)}
            >
              <Text style={[styles.segText, range === r && styles.segTextOn]}>
                {r === 7 ? S.range7 : S.range30}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chart}>
          {rows.map((r, i) => (
            <Pressable
              key={r.day}
              style={styles.barCol}
              onPress={() => setSelected(r.day)}
            >
              {range === 7 && (
                <Text style={styles.barNum}>{r.count || ''}</Text>
              )}
              <View
                style={[
                  styles.bar,
                  { height: Math.max(3, (r.count / max) * BAR_MAX) },
                  r.day === selected && { backgroundColor: colors.accent },
                ]}
              />
              <Text
                style={[
                  styles.barDay,
                  r.day === selected && { color: colors.text },
                ]}
                numberOfLines={1}
              >
                {range === 7
                  ? weekday(r.day)
                  : i % 5 === 0 || i === rows.length - 1
                  ? Number(r.day.slice(8))
                  : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>
          {S.reelsOn} {labelDay(selected, today)}
        </Text>
        {reels.length === 0 && <Text style={styles.muted}>{S.noReels}</Text>}
        {reels.slice(0, 50).map((r, i) => (
          <View key={`${r.startTs}-${i}`} style={styles.item}>
            <Text style={styles.itemText}>
              {platformLabel[r.platform] ?? r.platform}
            </Text>
            <Text style={styles.muted}>
              {new Date(r.startTs).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.itemDur}>{formatDuration(r.durationMs)}</Text>
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
  stats: { flexDirection: 'row', gap: 32, marginTop: 14 },
  statVal: { color: colors.text, fontSize: 18, fontWeight: '700' },
  section: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 3,
  },
  seg: { flex: 1, paddingVertical: 8, borderRadius: 18, alignItems: 'center' },
  segOn: { backgroundColor: colors.accent },
  segText: { color: colors.muted, fontWeight: '600' },
  segTextOn: { color: '#1A0A12' },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX + 44,
    marginTop: 12,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: { width: '70%', borderRadius: 4, backgroundColor: colors.bar },
  barNum: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  barDay: { color: colors.muted, fontSize: 11, marginTop: 6, height: 14 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  itemText: { color: colors.text, flex: 1, fontSize: 14 },
  itemDur: {
    color: colors.accent,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
});
