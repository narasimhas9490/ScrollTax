import React from 'react';
import { View } from 'react-native';

// Tiny icons drawn with Views, so the app needs no icon font or SVG library.

export function HomeIcon({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 1,
          width: 0,
          height: 0,
          borderLeftWidth: 11,
          borderRightWidth: 11,
          borderBottomWidth: 9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: 16,
          height: 11,
          backgroundColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}

export function BarsIcon({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      {[9, 18, 13].map((h, i) => (
        <View
          key={i}
          style={{
            width: 5,
            height: h,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}
