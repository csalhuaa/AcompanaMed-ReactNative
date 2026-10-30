# AcompañaMed 🏥💊

> **Asistente Gerontológico de Adherencia Farmacológica y Telemetría para Cuidadores Familiares**  
> *Universidad Nacional de San Agustín de Arequipa (UNSA) — Escuela Profesional de Ingeniería de Sistemas*  
> *Curso: Plataformas Emergentes (E) 2024-B — Docente: M. Sc. Ing. R. Fabrizio Calienes Rodriguez*

[![Firebase Hosting](https://img.shields.io/badge/Live_Demo-Firebase_Hosting-0284C7?style=for-the-badge&logo=firebase)](https://acompanamed-unsa-2026.web.app)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-52-000000?style=for-the-badge&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![TDD Tests](https://img.shields.io/badge/TDD_Tests-35%2F35_Passing-059669?style=for-the-badge)](https://github.com/csalhuaa/AcompanaMed-ReactNative)

---

## 🌐 Despliegue en Producción en Vivo

La aplicación se encuentra desplegada y accesible públicamente en la nube de Google:

🔗 **[https://acompanamed-unsa-2026.web.app](https://acompanamed-unsa-2026.web.app)**

---

## 🎯 Propósito del Proyecto y Proyección Social

En el Perú, más del 13% de la población supera los 60 años, enfrentando altas tasas de enfermedades crónicas no transmisibles (hipertensión, diabetes, dislipidemias) que conllevan cuadros de **polifarmacia geriátrica** (3 a 7 fármacos diarios).

Las aplicaciones comerciales estándar cometen fallas críticas de accesibilidad para este grupo etario:
- **Botones subdimensionados y horizontales:** Provocan tomas erróneas en pacientes con temblor senil o artrosis.
- **Sobrecarga de emojis y slop visual:** Iconografía infantil que desorienta y no respeta la semántica de lectores de pantalla (TalkBack / VoiceOver).
- **El antipatrón del "móvil inflado" en Web:** Elementos estirados horizontalmente en monitores de PC que rompen la ergonomía médica.
- **Falta de roles protegidos:** El paciente puede alterar o borrar recetas críticas por confusión.

**AcompañaMed** resuelve estos desafíos mediante un diseño minimalista de alto contraste **WCAG 2.2 AAA (>15:1)**, botonera vertical apilada al 100% de ancho (54dp / 48dp), renderizado anatómico de comprimidos, persistencia Offline-First (SQLite nativo) y control de acceso por roles (RBAC).

---

## 🏛️ Arquitectura de Software (Clean Architecture)

El proyecto desacopla las responsabilidades en capas estrictas:

```text
acompanamed-app/
├── App.tsx                     # Orquestador principal de estado y navegación
├── src/
│   ├── domain/                 # Entidades y reglas de negocio puras (100% TDD)
│   │   ├── types.ts            # Contratos de tipos TypeScript
│   │   ├── DuplicateGuard.ts   # Bloqueo de tomas consecutivas (< 2 hrs)
│   │   ├── StockManager.ts     # Control atómico de existencias y días de autonomía
│   │   ├── AdherenceCalculator.ts # Métricas de adherencia terapéutica (%)
│   │   ├── EscalationEngine.ts # Ventana de gracia de 30 min y alertas
│   │   ├── ScheduleTimelineEngine.ts # Generador del río cronológico del día
│   │   └── ClinicalReportEngine.ts   # Resumen estructurado para el geriatra
│   ├── infrastructure/         # Adaptadores nativos (Storage, TTS, Haptics, Notifications)
│   │   ├── StorageService.ts   # Persistencia Offline-First (AsyncStorage / SQLite)
│   │   ├── SpeechService.ts    # Síntesis de voz pausada y accesible
│   │   └── HapticService.ts    # Retroalimentación vibratoria diferenciada
│   └── components/             # Librería de componentes UI modulares
│       ├── timeline/           # Tarjeta de dosis y renderizador de pastillas
│       ├── navigation/         # Barra de navegación accesible
│       ├── caregiver/          # Panel de telemetría y canal WhatsApp
│       ├── stock/              # Botiquín con barras de autonomía y reposición
│       ├── ice/                # Ficha médica hospitalaria y botón SAMU 106
│       └── modals/             # Centered Modals: Restock, ConfirmDialog, AddMedicine
```

---

## 🛡️ Control de Acceso Basado en Roles (RBAC)

Para evitar modificaciones accidentales del adulto mayor:
1. **Modo Don Manuel (Paciente, 82 años):** Vista simplificada con pastilla actual, botones gigantes de toma, posponer y llamada de auxilio. Si intenta ingresar al Botiquín, el sistema muestra un **candado de seguridad** que restringe la edición a la cuidadora.
2. **Modo Cuidadora (María Alhua, 46 años):** Control total de recetas, reposición con packs de farmacia (`+10`, `+20`, `+30`, `+60`), retiro de fármacos y exportación del informe clínico.

---

## 🖥️ Adaptación Multiplataforma para Escritorio

Para superar el antipatrón de elementos estirados en la Web, la aplicación detecta el viewport mediante `useWindowDimensions()`:
- **Móvil (<768px):** Disposición ergonómica vertical con barra de navegación accesible al pulgar.
- **Desktop Shell Centrado (480px):** Confinamiento anatómico centrado sobre canvas neutro con sutil elevación.
- **Desktop Split View (>=1024px):** Estación de trabajo clínica de dos columnas paralelas (Plan del Paciente a la izquierda, Panel del Cuidador y Botiquín a la derecha).

---

## 🧪 Verificación con TDD (Test-Driven Development)

La suite automatizada valida 35 casos de prueba unitarios en Node Test Runner:

```bash
cd acompanamed-app
pnpm test
```

```text
ℹ tests 35
ℹ suites 16
ℹ pass 35
ℹ fail 0
ℹ duration_ms 282 ms
```

---

## 🚀 Guía de Instalación y Ejecución Local

### Prerrequisitos
- Node.js >= 18
- pnpm >= 9

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/csalhuaa/AcompanaMed-ReactNative.git
cd AcompanaMed-ReactNative/acompanamed-app

# 2. Instalar dependencias
pnpm install

# 3. Ejecutar pruebas automatizadas
pnpm test

# 4. Iniciar en modo Web
pnpm web

# 5. Iniciar para Android / iOS (Expo Go)
pnpm start
```

---

## 📄 Licencia y Créditos Académicos
Desarrollado para el **Laboratorio 5 de Plataformas Emergentes (UNSA 2024-B)** bajo la dirección del **M. Sc. Ing. R. Fabrizio Calienes Rodriguez**.
