---
name: AcompañaMed Minimalist Clinical Design System
description: Sistema visual médico minimalista de alta legibilidad y contraste estricto WCAG AAA, inspirado en los principios suizos de diseño clínico y Apple Health.
colors:
  canvas-bg: "#F8FAFC"
  card-surface: "#FFFFFF"
  card-border: "#E2E8F0"
  card-border-active: "#94A3B8"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  text-muted: "#64748B"
  accent-clinical-blue: "#0284C7"
  accent-clinical-light: "#F0F9FF"
  action-take-primary: "#0F172A"
  action-take-success: "#065F46"
  action-take-success-bg: "#ECFDF5"
  action-snooze-border: "#CBD5E1"
  action-snooze-text: "#334155"
  alert-emergency-text: "#991B1B"
  alert-emergency-bg: "#FEF2F2"
  alert-emergency-border: "#FECACA"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
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
    rounded: "{rounded.md}"
    height: "54px"
  snooze-button:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.action-snooze-text}"
    rounded: "{rounded.md}"
    height: "48px"
---

## Overview
AcompañaMed abandona cualquier estética oscura o elementos excesivamente redondeados para adoptar un **diseño médico minimalista, clínico y sobrio**, con contrastes rigurosos **WCAG AAA (>7:1)**. Inspirado en los sistemas de diseño de Apple Health, NHS Digital y tipografía clínica suiza, prioriza la claridad cognitiva, la precisión tipográfica y la serenidad del paciente y su familia.

## Colors
- **Lienzo Clínico Sedoso (`#F8FAFC`)**: Fondo claro, limpio y relajante que evita el deslumbramiento de un blanco puro (`#FFFFFF`) y el dramatismo excesivo de los modos oscuros.
- **Superficie de Tarjetas (`#FFFFFF`)**: Paneles nítidos con bordes estructurales de 1px en `#E2E8F0`, sin sombras difusas ni decorados innecesarios.
- **Texto Principal Alta Legibilidad (`#0F172A`)**: Carbón clínico con un ratio de contraste superior a 12:1 contra fondo blanco, superando con creces la norma WCAG AAA.
- **Texto Secundario y Metadatos (`#475569`)**: Gris pizarra con un ratio de contraste superior a 7:1 en fondo blanco (cumple WCAG AAA).
- **Acción Principal de Toma (`#0F172A` o `#065F46`)**: Botón autoritativo, sobrio y claro.
- **Acción Secundaria de Pospuesto (`#FFFFFF` con borde `#CBD5E1` y texto `#334155`)**: Tratamiento limpio y neutro que normaliza el posponer la dosis sin culpa.
- **Alerta Médica e ICE (`#991B1B` sobre `#FEF2F2` con borde `#FECACA`)**: Alerta de alta fidelidad médica para alergias e interacciones.

## Typography
- **Jerarquía Tipográfica Robusta**: Sans-serif neutral y legible.
- **Título de Pastilla**: 24sp, FontWeight 800, color `#0F172A`.
- **Dosis y Metadatos**: 16sp, FontWeight 700, color `#0284C7`.
- **Instrucción de Ingestión**: 15sp, FontWeight 500, color `#334155`, interlineado 22sp.
- **Acciones y Botones**: 16sp, FontWeight 700, texto en mayúsculas/minúsculas naturales sin agresividad.

## Layout
- **Estructura Arquitectónica Escandinava**: Retícula limpia de espaciados de 8px y 16px.
- **Selectores de Franja Horaria**: Barra segmentada limpia con divisores verticales sutiles, indicador de selección nítido en azul clínico.
- **Bandeja de Medicamentos**: Filas y tarjetas con proporciones áureas y bordes moderados (10px).

## Elevation & Depth
- **Bordes Estructurales sobre Sombras**: Cero sombras difusas o halos de color. La profundidad se define exclusivamente mediante bordes finos de 1px a 1.5px (`#E2E8F0` a `#CBD5E1`) y fondos sutilmente contrastados (`#FFFFFF` sobre `#F8FAFC`).

## Shapes
- **Radios Moderados (6px a 12px)**: Se eliminan las formas de burbuja o bordes excesivamente redondeados para proyectar madurez, rigor clínico y serenidad.
- **Identificación Geométrica de Pastillas (Visual Pill ID)**: Círculo, cápsula biseccionada u óvalo delineados con precisión geométrica.

## Components
- **PrimaryTakeButton**: Botón sólido rectangular con esquinas suavemente biseladas (10px) en `#0F172A`.
- **SnoozeButton**: Botón contorneado de 48dp en `#FFFFFF` con borde de 1.5px en `#CBD5E1`.
- **VoiceSpeakerButton**: Píldora clínica accesible con fondo `#F0F9FF` y texto `#0369A1`.
- **MedicalEmergencyBadge**: Ficha ICE estructurada en formato carné hospitalario.
- **AdherenceClinicalMatrix**: Cuadrícula de adherencia y telemetría de stock con líneas divisorias exactas.

## Do's and Don'ts
- **DO**: Asegurar contraste mínimo de 7:1 en todo texto informativo.
- **DO**: Usar mayúsculas y minúsculas naturales (Sentence case) en lugar de bloques de texto todo en mayúsculas.
- **DO**: Mantener bordes moderados (10px) que transmitan sobriedad y profesionalismo médico.
- **DON'T**: Usar fondos negros o modos oscuros saturados que resten sensación de higiene médica.
- **DON'T**: Usar sombras difusas flotantes, gradientes o efectos 'glassmorphism'.
- **DON'T**: Usar emojis infantiles; emplear exclusivamente iconografía médica vectorial precisa.
