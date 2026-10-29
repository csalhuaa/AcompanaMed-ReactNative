---
name: AcompañaMed Design System
description: Sistema visual táctil para adherencia geriátrica y acompañamiento farmacológico familiar inspirado en la ergonomía física del reloj despertador de velador.
colors:
  bg-deep: "#070B14"
  chassis-panel: "#0E1726"
  surface-control: "#182234"
  surface-active: "#132338"
  border-subtle: "#1E293B"
  border-active: "#334155"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-muted: "#64748B"
  action-take-primary: "#059669"
  action-take-beveled: "#047857"
  action-snooze-border: "#F59E0B"
  action-snooze-text: "#FBBF24"
  action-voice-accent: "#38BDF8"
  status-alert-emergency: "#EF4444"
  status-alert-emergency-bg: "#261217"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  primary-take-button:
    backgroundColor: "{colors.action-take-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    height: "64px"
  snooze-button:
    backgroundColor: "{colors.surface-control}"
    textColor: "{colors.action-snooze-text}"
    rounded: "{rounded.md}"
    height: "54px"
---

## Overview
AcompañaMed adopta la metáfora física y noble del **Reloj Despertador Táctil de Velador**. Diseñado específicamente para adultos mayores polimedicados y sus cuidadores, erradica los falsos toques mediante botones prominentes de relieve tridimensional, alto contraste cromático WCAG AAA, constancia de forma y color por medicamento, y ausencia total de adornos vacíos o distracciones visuales.

## Colors
- **Fondo Profundo Antirreflejo (`#070B14`)**: Confort visual día y noche sin fatiga ni deslumbramientos para pacientes con cataratas o presbicia.
- **Chasis de Panel (`#0E1726`)**: Superficies sólidas que contienen las bandejas farmacológicas y paneles de telemetría.
- **Acción Esmeralda Primaria (`#059669` base, `#047857` relieve)**: Reserva cromática exclusiva para la confirmación de la toma realizada.
- **Acción Ámbar de Pospuesto (`#F59E0B` borde, `#FBBF24` texto)**: Tratamiento de botón de alarma Snooze que elimina el estigma y la falsa confirmación.
- **Cian Clínico de Información (`#38BDF8`)**: Síntesis de voz, horarios y metadatos médicos.
- **Rojo de Auxilio ICE (`#EF4444`)**: Ficha médica de emergencias y alergias críticas.

## Typography
- **Nombre de Pastilla Activa**: 22-26sp, FontWeight 800, color `#F8FAFC`, medida generosa para lectura inmediata.
- **Dosis y Metadatos**: 16-18sp, FontWeight 700, color `#38BDF8`.
- **Instrucción de Ingestión**: 15-16sp, FontWeight 600, color `#E2E8F0`, interlineado 22sp.
- **Botón de Toma**: 18-20sp, FontWeight 900, blanco nítido `#FFFFFF` con espaciado 0.5px.
- **Reportes Clínicos**: Tipografía monoespaciada con caracteres tabulares para fácil lectura médica.

## Layout
- **Ergonomía Vertical con Ancla Inferior**: Acciones principales situadas en la mitad inferior de la pantalla para alcance ergonómico con el pulgar.
- **Selector de Franja Diaria**: Tres bloques mecánicos ('Mañana' 06:00-12:00, 'Tarde' 12:00-18:00, 'Noche' 18:00-05:00) con iconografía vectorial pura.
- **Bandeja de Medicamentos**: Chips horizontales deslizables con punto cromático exacto y estado de toma.

## Elevation & Depth
- **Relieve Táctil Físico**: En lugar de sombras difusas o desenfoques decorativos, los botones principales emplean biseles inferiores de 3 a 4px de grosor (`borderBottomWidth: 4`, `borderBottomColor: #047857`) que simulan el recorrido y la presencia física de un pulsador real.

## Shapes
- **Visual Pill Chamber**:
  - Cápsula: Silueta redondeada alargada con corte de contraste.
  - Comprimido redondo: Círculo perfecto con ranura central de partición.
  - Comprimido ovalado: Óvalo con borde suave beveled.
- **Botones y Contenedores**: Radios de 12 a 20px, proporcionando bordes orgánicos amigables y evitando filos agresivos.

## Components
- **PrimaryTakeButton**: Botón de confirmación esmeralda con icono de checkmark en 30dp.
- **SnoozeButton**: Barra táctil ámbar con icono de reloj rápido.
- **VoiceSpeakerButton**: Altavoz integrado con activación de síntesis TTS a velocidad 0.85.
- **EmergencyAccessPill**: Acceso inmediato a la Ficha ICE con alerta roja.
- **CaregiverAdherenceGauge**: Indicador numérico gigante con calificación cualitativa.

## Do's and Don'ts
- **DO**: Mantener textos por encima de 15sp para cualquier instrucción de toma.
- **DO**: Proporcionar retroalimentación auditiva y háptica inmediata tras cada pulsación.
- **DO**: Respetar el color distintivo y la forma de cada medicamento en todas las pantallas.
- **DON'T**: Usar emojis en lugar de iconografía vectorial profesional.
- **DON'T**: Usar textos en gradientes, sombras flotantes difusas o fondos blancos brillantes.
- **DON'T**: Requerir gestos complejos de deslizamiento (swipe o pinch) para acciones críticas.
