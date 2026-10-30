import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { VisualPill } from '../../domain';

interface Props {
  visualPill: VisualPill;
  size?: 'small' | 'large';
}

export const PillVisualRenderer: React.FC<Props> = ({ visualPill, size = 'large' }) => {
  const isLarge = size === 'large';

  if (visualPill.shape === 'capsule') {
    return (
      <View
        style={[
          styles.capsuleContainer,
          isLarge ? styles.capsuleLarge : styles.capsuleSmall,
        ]}
        accessibilityRole="image"
        accessibilityLabel={`Cápsula biseccionada, color ${visualPill.colorName}`}
      >
        <View style={[styles.capsuleHalf, { backgroundColor: visualPill.colorHex }]} />
        <View style={[styles.capsuleHalf, styles.capsuleWhiteHalf]} />
      </View>
    );
  }

  if (visualPill.shape === 'oval') {
    return (
      <View
        style={[
          styles.ovalContainer,
          isLarge ? styles.ovalLarge : styles.ovalSmall,
          { backgroundColor: visualPill.colorHex },
        ]}
        accessibilityRole="image"
        accessibilityLabel={`Comprimido ovalado con ranura central, color ${visualPill.colorName}`}
      >
        <View style={styles.scoreLine} />
      </View>
    );
  }

  // Default: round tablet
  return (
    <View
      style={[
        styles.roundContainer,
        isLarge ? styles.roundLarge : styles.roundSmall,
        { backgroundColor: visualPill.colorHex },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Comprimido redondo con ranura de corte, color ${visualPill.colorName}`}
    >
      <View style={styles.scoreLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  capsuleContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  capsuleSmall: {
    width: 32,
    height: 16,
    borderRadius: 8,
  },
  capsuleLarge: {
    width: 64,
    height: 30,
    borderRadius: 15,
  },
  capsuleHalf: {
    flex: 1,
  },
  capsuleWhiteHalf: {
    backgroundColor: '#FFFFFF',
  },
  ovalContainer: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalSmall: {
    width: 32,
    height: 18,
    borderRadius: 9,
  },
  ovalLarge: {
    width: 60,
    height: 34,
    borderRadius: 17,
  },
  roundContainer: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  roundLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  scoreLine: {
    width: '75%',
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
});
