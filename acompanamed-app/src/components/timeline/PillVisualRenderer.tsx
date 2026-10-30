import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VisualPill } from '../../domain';

interface Props {
  visualPill: VisualPill;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showSizeBadge?: boolean;
}

export const PillVisualRenderer: React.FC<Props> = ({
  visualPill,
  size = 'large',
  showSizeBadge = false,
}) => {
  const isXLarge = size === 'xlarge';
  const isLarge = size === 'large' || isXLarge;
  const isSmall = size === 'small';

  // Componente interno para brillo especular de gelatina/película protectora
  const renderGlossHighlight = (type: 'capsule' | 'tablet' = 'tablet') => (
    <View
      style={[
        styles.glossHighlight,
        type === 'capsule' ? styles.glossCapsule : styles.glossTablet,
      ]}
      pointerEvents="none"
    />
  );

  // Componente de ranura con relieve 3D (línea oscura + reflejo blanco lateral)
  const render3DScoreLine = (horizontal = false, lengthPercent = '65%') => (
    <View
      style={[
        styles.scoreLineWrapper,
        horizontal && { transform: [{ rotate: '90deg' }] },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.scoreGrooveDark, { height: lengthPercent }]} />
      <View style={[styles.scoreGrooveLight, { height: lengthPercent }]} />
    </View>
  );

  // Badge de escala relativa (Micro / Mediana / Grande)
  const renderSizeBadge = () => {
    if (!showSizeBadge || !visualPill.sizeCategory) return null;
    const labels = { tiny: 'P', medium: 'M', large: 'G' };
    const label = labels[visualPill.sizeCategory] || 'M';
    return (
      <View style={styles.sizeCategoryBadge}>
        <Text style={styles.sizeCategoryText}>{label}</Text>
      </View>
    );
  };

  // 1. CÁPSULA 3D BICOLOR
  if (visualPill.shape === 'capsule') {
    const leftColor = visualPill.colorHex;
    const rightColor = visualPill.secondaryColorHex || '#FFFFFF';

    return (
      <View style={styles.outerContainer}>
        <View
          style={[
            styles.capsuleContainer,
            isXLarge
              ? styles.capsuleXLarge
              : isLarge
              ? styles.capsuleLarge
              : styles.capsuleSmall,
          ]}
          accessibilityRole="image"
          accessibilityLabel={`Cápsula biseccionada 3D, colores ${visualPill.colorName}`}
        >
          {/* Mitad Izquierda (Cuerpo) */}
          <View style={[styles.capsuleHalf, { backgroundColor: leftColor }]}>
            {renderGlossHighlight('capsule')}
          </View>

          {/* Anillo de Junta Central */}
          <View style={styles.capsuleJoinRing} />

          {/* Mitad Derecha (Tapa) */}
          <View style={[styles.capsuleHalf, { backgroundColor: rightColor }]}>
            {renderGlossHighlight('capsule')}
          </View>

          {/* Impronta alfanumérica de laboratorio si es tamaño grande */}
          {isLarge && visualPill.imprint && (
            <Text style={styles.imprintCapsuleText}>{visualPill.imprint}</Text>
          )}
        </View>
        {renderSizeBadge()}
      </View>
    );
  }

  // 2. COMPRIMIDO OVALADO / OBLONGO (TORPEDO)
  if (visualPill.shape === 'oval') {
    return (
      <View style={styles.outerContainer}>
        <View
          style={[
            styles.ovalContainer,
            isXLarge
              ? styles.ovalXLarge
              : isLarge
              ? styles.ovalLarge
              : styles.ovalSmall,
            { backgroundColor: visualPill.colorHex },
          ]}
          accessibilityRole="image"
          accessibilityLabel={`Comprimido ovalado alargado con ranura, color ${visualPill.colorName}`}
        >
          {renderGlossHighlight('tablet')}
          {render3DScoreLine(false, '75%')}
          {isLarge && visualPill.imprint && (
            <Text style={styles.imprintTabletText}>{visualPill.imprint}</Text>
          )}
        </View>
        {renderSizeBadge()}
      </View>
    );
  }

  // 3. COMPRIMIDO RANURADO EN CRUZ (PARTIBLE EN 2 O 4)
  if (visualPill.shape === 'scored') {
    return (
      <View style={styles.outerContainer}>
        <View
          style={[
            styles.roundContainer,
            isXLarge
              ? styles.roundXLarge
              : isLarge
              ? styles.roundLarge
              : styles.roundSmall,
            { backgroundColor: visualPill.colorHex },
          ]}
          accessibilityRole="image"
          accessibilityLabel={`Comprimido ranurado en cruz para partición de dosis, color ${visualPill.colorName}`}
        >
          {renderGlossHighlight('tablet')}
          {render3DScoreLine(false, '80%')}
          {render3DScoreLine(true, '80%')}
          {isLarge && visualPill.imprint && (
            <Text style={[styles.imprintTabletText, { bottom: 4 }]}>
              {visualPill.imprint}
            </Text>
          )}
        </View>
        {renderSizeBadge()}
      </View>
    );
  }

  // 4. ROMBOIDE O DIAMANTE FACETADO
  if (visualPill.shape === 'diamond') {
    return (
      <View style={styles.outerContainer}>
        <View
          style={
            isXLarge
              ? styles.diamondWrapXLarge
              : isLarge
              ? styles.diamondWrapLarge
              : styles.diamondWrapSmall
          }
        >
          <View
            style={[
              styles.diamondContainer,
              isXLarge
                ? styles.diamondXLarge
                : isLarge
                ? styles.diamondLarge
                : styles.diamondSmall,
              { backgroundColor: visualPill.colorHex },
            ]}
            accessibilityRole="image"
            accessibilityLabel={`Comprimido en rombo o diamante facetado, color ${visualPill.colorName}`}
          >
            {renderGlossHighlight('tablet')}
            {render3DScoreLine(false, '60%')}
          </View>
        </View>
        {renderSizeBadge()}
      </View>
    );
  }

  // 5. GOTAS / SOLUCIÓN ORAL U OFTÁLMICA
  if (visualPill.shape === 'drop') {
    return (
      <View style={styles.outerContainer}>
        <View
          style={[
            styles.dropContainer,
            isXLarge
              ? styles.dropXLarge
              : isLarge
              ? styles.dropLarge
              : styles.dropSmall,
            { backgroundColor: visualPill.colorHex },
          ]}
          accessibilityRole="image"
          accessibilityLabel={`Solución oral líquida en gotas, color ${visualPill.colorName}`}
        >
          <MaterialCommunityIcons
            name="water"
            size={isXLarge ? 34 : isLarge ? 22 : 14}
            color="#FFFFFF"
          />
          {renderGlossHighlight('capsule')}
        </View>
        {renderSizeBadge()}
      </View>
    );
  }

  // 6. DEFAULT: COMPRIMIDO REDONDO BICONVEXO
  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.roundContainer,
          isXLarge
            ? styles.roundXLarge
            : isLarge
            ? styles.roundLarge
            : styles.roundSmall,
          { backgroundColor: visualPill.colorHex },
        ]}
        accessibilityRole="image"
        accessibilityLabel={`Comprimido redondo biconvexo, color ${visualPill.colorName}`}
      >
        {renderGlossHighlight('tablet')}
        {render3DScoreLine(false, '65%')}
        {isLarge && visualPill.imprint && (
          <Text style={styles.imprintTabletText}>{visualPill.imprint}</Text>
        )}
      </View>
      {renderSizeBadge()}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Reflejo especular superior para volumen 3D
  glossHighlight: {
    position: 'absolute',
    top: 2,
    left: '12%',
    right: '12%',
    height: '38%',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 8,
  },
  glossTablet: {
    borderRadius: 12,
  },
  glossCapsule: {
    borderRadius: 6,
  },

  // Ranura 3D con relieve bicromático
  scoreLineWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreGrooveDark: {
    width: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  scoreGrooveLight: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },

  // Impronta alfanumérica de laboratorio
  imprintTabletText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(15, 23, 42, 0.55)',
    letterSpacing: 0.5,
  },
  imprintCapsuleText: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 3,
    borderRadius: 3,
  },

  // Badge de escala relativa
  sizeCategoryBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#0F172A',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  sizeCategoryText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  // 1. Cápsula
  capsuleContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleSmall: {
    width: 32,
    height: 16,
    borderRadius: 8,
  },
  capsuleLarge: {
    width: 50,
    height: 24,
    borderRadius: 12,
  },
  capsuleXLarge: {
    width: 105,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
  },
  capsuleHalf: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  capsuleJoinRing: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  // 2. Ovalado
  ovalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  ovalSmall: {
    width: 34,
    height: 18,
    borderRadius: 9,
  },
  ovalLarge: {
    width: 52,
    height: 26,
    borderRadius: 13,
  },
  ovalXLarge: {
    width: 110,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
  },

  // 3. Redondo y Ranurado
  roundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  roundSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  roundLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  roundXLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
  },

  // 4. Diamante
  diamondWrapSmall: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondWrapLarge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondWrapXLarge: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondContainer: {
    transform: [{ rotate: '45deg' }],
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  diamondSmall: {
    width: 17,
    height: 17,
    borderRadius: 3,
  },
  diamondLarge: {
    width: 26,
    height: 26,
    borderRadius: 5,
  },
  diamondXLarge: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 2.5,
  },

  // 5. Gotas
  dropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dropSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dropLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  dropXLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
  },
});
