# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack
React Native 0.88, Expo SDK 58, TypeScript, AsyncStorage, Expo Speech, Expo Haptics, Expo Notifications

## Users
1. **Adulto Mayor (Usuario Primario - Paciente)**:
   - Situación: Paciente geriátrico (65-85+ años) con régimen de polifarmacia crónica (hipertensión, diabetes, dislipidemia), presbicia, reducción de agudeza visual y contrastes, o motricidad fina disminuida.
   - Trabajo: Identificar qué pastilla le toca tomar en el momento exacto, verificarla visualmente (forma, color) antes de ingerirla, registrar la toma sin fricción ni temor al error, o posponerla si no está listo sin sentirse castigado.
2. **Cuidador Familiar / Profesional (Usuario Secundario - Administrador)**:
   - Situación: Hijo(a), enfermero(a) o familiar a cargo de la supervisión médica que puede o no convivir con el paciente.
   - Trabajo: Configurar el pastillero y horarios diarios, monitorear el cumplimiento real de las tomas, recibir alertas si una dosis supera los 30 min sin confirmación, reponer stock antes de que se agote, y presentar reportes claros de adherencia en la consulta médica.

## Product Purpose
AcompañaMed es una aplicación móvil asistiva de salud gerontológica y acompañamiento farmacológico que transforma el recordatorio tradicional de medicamentos en un sistema dual empático. Su propósito es erradicar las falsas confirmaciones, mitigar la sobredosis accidental por duplicidad de tomas y reducir la ansiedad del adulto mayor y su familia, dignificando el envejecimiento activo y asegurando la adherencia clínica real.

## Positioning
A diferencia de las apps de recordatorios estándar (alarmas genéricas que se apagan mecánicamente o listas de texto plano médicas e intimidantes), AcompañaMed implementa:
1. **Identificación Visual de Pastillas (Visual Pill ID)**: Representación visual inequívoca por forma geométrica y color distintivo del comprimido.
2. **Escudo Antidobles Tomas (DuplicateGuard)**: Bloqueo de reconfirmación accidental en ventana de seguridad de 2 horas.
3. **Escalamiento Progresivo con Período de Gracia (30 min)**: Protocolo que diferencia un simple retraso de una omisión crítica antes de alertar al cuidador.
4. **Modo Dual Orgánico**: Cambio transparente entre una interfaz táctil ultra-limpia y asistida por voz para el adulto mayor y un panel clínico de supervisión y reposición para el cuidador.

## Operating Context
- Uso en el hogar: mesa de noche, cocina o comedor durante las comidas y al levantarse/acostarse.
- Iluminación variable (mañana brillante o noche con luz tenue).
- Uso individual por el adulto mayor con una sola mano o apoyado en mesa, o uso conjunto durante la visita del familiar.
- Sin garantía de conexión continua a internet (requiere funcionamiento 100% offline-first).

## Capabilities and Constraints
- **Capacidades confirmadas**:
  - Motor de dominio validado con TDD (DuplicateGuard, StockManager, AdherenceCalculator, EscalationEngine, ScheduleTimelineEngine, ClinicalReportEngine).
  - Almacenamiento local persistente con AsyncStorage (`StorageService`).
  - Asistente de voz Text-to-Speech nativo con cadencia pausada (rate: 0.85) para presbiacusia.
  - Retroalimentación háptica accesible para confirmación física del toque.
  - Ficha médica de emergencia (ICE) con botón de llamada directa.
  - Generación de informe clínico formateado para el médico geriatra.
- **Restricciones técnicas**:
  - Stack: React Native 0.88 / Expo 58 / TypeScript.
  - Plataforma: Android móvil prioritario.
  - Modo: Operate (completar tareas de toma y supervisión con claridad, sin adornos vacíos ni distracción).
  - Rendimiento: 60 FPS, interacciones táctiles directas de gran área (mínimo 48-60dp en modo senior).

## Brand Commitments
- Nombre: **AcompañaMed**.
- Voz y tono: Cálido, respetuoso, empático, claro, digno, sin condescendencia ni infantilización del adulto mayor.
- Cero jerga médica incomprensible en el Modo Senior; precisión técnica y ejecutiva en el Modo Cuidador.

## Evidence on Hand
- Especificación y arquitectura técnica: `docs/acompanamed-blueprint.md`.
- Suites de pruebas unitarias de dominio: `acompanamed-app/src/**/*.test.ts` (35 tests pasando).
- Guía de laboratorio oficial: `LAB 05_PLATAFORMAS EMERGENTES 2024B.pdf`.

## Product Principles
1. **Dignidad y Simplicidad Radical**: El adulto mayor nunca debe sentirse confuso, torpe o sobreestimulado. Una sola acción clara y destacada a la vez.
2. **Cero Falsas Confirmaciones**: La app no debe castigar el retraso; posponer una toma es un acto válido y seguro.
3. **Seguridad Farmacológica Activa**: Proteger físicamente al paciente contra duplicaciones y desabastecimiento.
4. **Puente Intergeneracional**: Fortalecer el vínculo de confianza entre paciente y cuidador sin generar sensación de vigilancia invasiva.

## Accessibility & Inclusion
- Estándar objetivo: WCAG 2.2 Nivel AAA en contraste cromático para baja visión y presbicia.
- Áreas de toque aumentadas (mínimo 56x56 dp en botones de toma).
- Fuentes grandes, nítidas y de alta legibilidad sin serietas ambiguas.
- Soporte multimodal: visual (formas y colores), auditivo (síntesis de voz hablada) y táctil (patrones de vibración háptica).
