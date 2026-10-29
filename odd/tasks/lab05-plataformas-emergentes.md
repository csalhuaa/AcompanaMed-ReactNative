# Laboratorio 05 — Plataformas Emergentes (UNSA 2024B)

Implementación y documentación del Laboratorio 5 de Plataformas Emergentes: Desarrollo avanzado de aplicación multiplataforma (continuidad o evolución del proyecto de proyección social) y elaboración del informe técnico oficial.

## Allowed edit surfaces
odd/tasks/lab05-plataformas-emergentes.md
docs/acompanamed-blueprint.md
.gitignore
acompanamed-app/package.json
acompanamed-app/tsconfig.json
acompanamed-app/app.json
acompanamed-app/.npmrc
acompanamed-app/index.ts
acompanamed-app/assets/
acompanamed-app/src/

## Specs
- S1: Analizar y explicar en detalle de qué trata la guía `LAB 05_PLATAFORMAS EMERGENTES 2024B.pdf`, abarcando objetivos, alcance, estructura requerida del informe y rúbrica de calificación.
- S2: Definir la hoja de ruta técnica para el desarrollo del software multiplataforma y la generación del entregable formal.
- S3: Definir la propuesta de proyección social: Asistente de adherencia farmacoterapéutica para adultos mayores con red de apoyo / cuidador (Caregiver Sync & Escalated Alerts).
- S4: Formular el árbol de problemas, diseño UX geriátrico de alta accesibilidad y recomendación del stack tecnológico (React Native vs alternativas) para el plazo de 2 semanas.
- S5: Definir propuestas de naming original, digno, empático y libre de marcas existentes.
- S6: Modelar a profundidad los actores del ecosistema, sus capacidades/restricciones, el árbol de problemas formal y el flujo operativo detallado de interacción y escalamiento.
- S7: Fundamentar la realidad gerontológica sobre los niveles de autonomía del adulto mayor (independiente, semidependiente y dependiente) para garantizar un diseño ético y humanizado.
- S8: Redactar el documento maestro de especificación y arquitectura técnica del proyecto AcompañaMed para guiar el desarrollo de software y la elaboración del informe oficial.
- S9: Inicializar el repositorio Git y el proyecto base React Native con TypeScript, Expo y arquitectura modular limpia.
- S10: Desarrollar con enfoque Test-First (TDD) los módulos nucleares de dominio: cálculo de adherencia, control de duplicidad, deducción de stock y ciclo de escalamiento.
- S11: Iteración Módulo 1 — Catálogo Multimedicina & Agenda Diaria Cronológica (CRUD de fármacos por el Cuidador y carrusel/agenda secuencial para el Adulto Mayor).
- S12: Iteración Módulo 2 — Persistencia Local Offline-First (`StorageService` en AsyncStorage) con sincronización atómica.
- S13: Iteración Módulo 3 — Ficha de Emergencia Médica (Alergias, Condiciones, Contacto de Apoyo) y Reporte Detallado de Adherencia.
- S14: Iteración Módulo 4 — Asistente de Voz y Notificaciones Programadas en el Dispositivo.

## Tasks
- [x] T1: Analizar la guía del Laboratorio 5 y recuperar memoria de los proyectos anteriores (AutoCare / Lab 3 y Lab 4) en Engram. [S1] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T2: Explicar al usuario la estructura, requisitos, entregables y criterios de evaluación del Lab 5, contextualizado con el trabajo previo. [S1] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T3: Formular la propuesta integral de proyección social (árbol de problemas, perfiles Paciente/Cuidador, mitigación de falsas tomas y módulos de valor). [S3] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T4: Evaluar y recomendar el stack multiplataforma ideal considerando el ecosistema actual y el plazo de 2 semanas. [S4] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T5: Diseñar opciones de naming con significado social, calidez y solidez académica. [S5] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T6: Modelar exhaustivamente actores, árbol de problemas, casos operativos y el flujo de vida de una dosis. [S6] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T7: Documentar el espectro de autonomía real en la administración de fármacos y cómo la solución se adapta respetando la dignidad y capacidad de cada adulto mayor. [S7] -> `odd/tasks/lab05-plataformas-emergentes.md`
- [x] T8: Redactar y publicar el Documento Maestro de Diseño y Especificación Técnica en artefacto y en `docs/acompanamed-blueprint.md`. [S8] -> `docs/acompanamed-blueprint.md`
- [x] T9: Configurar el proyecto `acompanamed-app` (Expo 58, React Native 0.88, TypeScript, pnpm, testing harness). [S9] -> `acompanamed-app/package.json`
- [x] T10: Implementar mediante TDD los modelos y servicios de dominio: `Medicine`, `DoseLog`, `DuplicateGuard`, `StockManager` y `AdherenceMetrics`. [S10] -> `acompanamed-app/src/domain/`
- [x] T11: Implementar Módulo 1 (Catálogo Multimedicina con soporte para 3-6 fármacos simultáneos, selector de forma/color y agenda secuencial de tomas diarias). [S11] -> `acompanamed-app/`
- [ ] T12: Implementar Módulo 2 (Capa de almacenamiento persistente `StorageService` con AsyncStorage y pruebas unitarias de serialización). [S12] -> `acompanamed-app/src/infrastructure/`
- [ ] T13: Implementar Módulo 3 (Ficha Médica de Emergencia y Reporte Clínico exportable). [S13] -> `acompanamed-app/`

## Verification
- `pnpm test`: 19 tests passed in 383ms across 9 suites (DuplicateGuard, StockManager, AdherenceCalculator, EscalationEngine, ScheduleTimelineEngine).
- `pnpm typecheck`: TypeScript compilation clean (exit code 0).
- `expo export --platform web`: 299 modules bundled successfully in dist (exit code 0).

## Log
- L1: Petición original del usuario: "/odd quiero trabajar en este @[LAB 05_PLATAFORMAS EMERGENTES 2024B.pdf] primero explicame de que trata este".
- L2: Propuesta del usuario: recordatorio de pastillas y dosis para adultos mayores con aviso a terceros (cuidador), dudas sobre simplicidad, validación de toma real y selección de framework.
- L3: Petición del usuario de descartar CarePill/VitalDosis, profundizar en naming original y modelar a detalle el funcionamiento real, actores y flujo sistémico.
- L4: Consulta del usuario sobre la realidad de si los adultos mayores toman sus pastillas solos y si el diseño respeta la realidad gerontológica.
- L5: Aprobación del usuario del nombre AcompañaMed y de la justificación; redacción del documento maestro de especificación y arquitectura.
- L6: Inicialización del repositorio Git (commit raíz: 2928d53); usuario autoriza proceder con implementación ordenada y commits por unidades de trabajo.
- L7: Configuración de acompanamed-app (Expo/RN/TS), desarrollo TDD del motor de dominio (11 tests pass), e interfaz accesible con Modo Dual (Senior/Cuidador).
- L8: Usuario solicita iterar módulo a módulo para robustecer la aplicación de forma integral.
- L9: Implementación completa de Módulo 1 (ScheduleTimelineEngine, agenda por franjas mañana/tarde/noche, catálogo multimedicina con modal de registro, 19 tests pass).
