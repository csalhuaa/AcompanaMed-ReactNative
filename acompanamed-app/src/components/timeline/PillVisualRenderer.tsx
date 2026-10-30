import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  if (visualPill.shape === 'scored') {
    return (
      <View
        style={[
          styles.roundContainer,
          isLarge ? styles.roundLarge : styles.roundSmall,
          { backgroundColor: visualPill.colorHex },
        ]}
        accessibilityRole="image"
        accessibilityLabel={`Comprimido ranurado para fraccionar en mitades, color ${visualPill.colorName}`}
      >
        {/* Ranura cruzada profunda de partición */}
        <View style={styles.scoreLine} />
        <View style={[styles.scoreLine, { transform: [{ rotate: '90deg' }] }]} />
      </View>
    );
  }

  if (visualPill.shape === 'diamond') {
    return (
      <View style={isLarge ? styles.diamondWrapLarge : styles.diamondWrapSmall}>
        <View
          style={[
            styles.diamondContainer,
            isLarge ? styles.diamondLarge : styles.diamondSmall,
            { backgroundColor: visualPill.colorHex },
          ]}
          accessibilityRole="image"
          accessibilityLabel={`Comprimido romboide o diamante facetado, color ${visualPill.colorName}`}
        >
          <View style={[styles.scoreLine, { width: 1.5 }]} />
        </View>
      </View>
    );
  }

  if (visualPill.shape === 'drop') {
    return (
      <View
        style={[
          styles.dropContainer,
          isLarge ? styles.dropLarge : styles.dropSmall,
          { backgroundColor: visualPill.colorHex },
        ]}
        accessibilityRole="image"
        accessibilityLabel={`Solución líquida oral en gotas, color ${visualPill.colorName}`}
      >
        <MaterialCommunityIcons
          name="water"
          size={isLarge ? 20 : 14}
          color="#FFFFFF"
        />
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
      accessibilityLabel={`Comprimido redondo estándar, color ${visualPill.colorName}`}
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
    width: 44,
    height: 22,
    borderRadius: 11,
  },
  capsuleHalf: {
    flex: 1,
    height: '100%',
  },
  capsuleWhiteHalf: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
  },
  ovalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  ovalSmall: {
    width: 32,
    height: 18,
    borderRadius: 9,
  },
  ovalLarge: {
    width: 44,
    height: 24,
    borderRadius: 12,
  },
  roundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  roundSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  roundLarge: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  scoreLine: {
    position: 'absolute',
    width: 1.5,
    height: '60%',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 1,
  },
  diamondWrapLarge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondWrapSmall: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondContainer: {
    transform: [{ rotate: '45deg' }],
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondSmall: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  diamondLarge: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  dropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dropSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  dropLarge: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
