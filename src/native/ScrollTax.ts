import { NativeModules } from 'react-native';

export type ReelRow = { platform: string; startTs: number; durationMs: number };
export type MonthRow = {
  month: string;
  count: number;
  ms: number;
  days: number;
};
export type DayRow = { day: string; count: number; ms: number };

const M = NativeModules.ScrollTaxModule;

const json = async <T>(p: Promise<string>): Promise<T> => JSON.parse(await p);

export const ScrollTax = {
  getDaily: (fromDay: string) => json<DayRow[]>(M.getDaily(fromDay)),
  getMonthly: () => json<MonthRow[]>(M.getMonthly()),
  getReelsForDay: (day: string) => json<ReelRow[]>(M.getReelsForDay(day)),
  isOverlayGranted: (): Promise<boolean> => M.isOverlayGranted(),
  isAccessibilityEnabled: (): Promise<boolean> => M.isAccessibilityEnabled(),
  openOverlaySettings: (): void => M.openOverlaySettings(),
  openAccessibilitySettings: (): void => M.openAccessibilitySettings(),
  getPref: (key: string): Promise<string | null> => M.getPref(key),
  setPref: (key: string, value: string): void => M.setPref(key, value),
  clearHistory: (): Promise<boolean> => M.clearHistory(),
};
