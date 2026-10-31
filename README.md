# AcompañaMed

Asistente de medicación para pacientes y cuidadores. Permite registrar un plan diario, confirmar tomas, reponer existencias y completar una ficha de emergencia. La interfaz existente está en español.

## Ejecutar localmente

```powershell
cd acompanamed-app
npm ci
npm start
```

Abra el proyecto desde un dispositivo Android compatible con la versión de Expo del proyecto. Para generar e instalar la aplicación nativa con el SDK de Android configurado:

```powershell
npm run android
```

Para usar la versión web:

```powershell
npm run web
```

El proyecto usa Expo SDK 58, React Native 0.88, React 19 y TypeScript. Las versiones exactas están en `acompanamed-app/package.json` y su archivo de bloqueo.

## Primer uso

1. Seleccione Paciente o Cuidador y elija **Iniciar con Botiquín Vacío**. El caso de ejemplo se carga solamente al seleccionarlo.
2. Registre el medicamento siguiendo la receta: nombre, dosis, hora diaria en formato `HH:MM`, existencias y umbral de reposición. Se aceptan existencias y umbral de cero; los valores negativos, fraccionarios o incompletos se rechazan.
3. Complete su información y contacto de apoyo desde **Ajustes**. Los campos médicos vacíos se muestran como información no registrada.
4. En **Hoy**, confirme la toma o pospóngala. La confirmación descuenta una unidad; una dosis diaria ya confirmada no puede registrarse nuevamente ese día. Reponga el medicamento si no quedan unidades.
5. Use **Botiquín** en modo Cuidador para editar, reponer o retirar medicamentos. Retirar conserva el historial de tomas.

Los datos locales se guardan con AsyncStorage y se recuperan al abrir la app. Los modos simplifican la interfaz para evitar cambios accidentales; no constituyen autenticación ni control de acceso entre personas.

## Recordatorios

- En Android, al guardar un medicamento se solicita permiso y se programa un aviso diario a la hora elegida. Editar reemplaza el aviso y retirar lo cancela.
- **Posponer 15 minutos** programa un aviso puntual; confirmar la toma cancela ese aviso pospuesto.
- Al abrir la app, los avisos se reconcilian sin abrir solicitudes de permiso automáticamente.
- La versión web permite gestionar el plan y probar una notificación inmediata, pero no programa alarmas en segundo plano. La interfaz informa esta limitación al guardar o intentar posponer.
- El panel del cuidador calcula los atrasos desde el plan local de hoy. WhatsApp y las llamadas se abren mediante una acción del usuario; no hay envío automático de mensajes ni vigilancia remota en segundo plano.

La entrega de notificaciones con la aplicación cerrada depende de los permisos y ajustes del dispositivo Android. La programación se prueba con un adaptador simulado; la entrega real requiere verificarla en el teléfono.

## Enlace familiar opcional

La app inicia y trabaja localmente. No descarga ni sube la ficha médica al abrirla. En **Ajustes**, **Activar enlace de este botiquín** comparte el plan y la ficha mediante el servicio Firebase configurado; otro dispositivo puede introducir el mismo código. Para reanudar el enlace después de cerrar la app, vuelva a conectarlo explícitamente.

El enlace existente funciona por código compartido, sin autenticación de usuarios. Cualquier persona que tenga el código puede acceder al estado compartido. Un error de descarga no se interpreta como una familia inexistente y una subida fallida no se muestra como sincronización exitosa. Esta tarea verifica el comportamiento de red con simulaciones locales; no realiza transferencias al servidor.

## Verificar

```powershell
cd acompanamed-app
npm test
npm run typecheck
npx expo export --platform web
```

Las pruebas cubren dominio, persistencia, validación de formularios, horarios locales, escalamiento y programación/cancelación de avisos con adaptadores simulados. No reemplazan las pruebas de permisos, sonido y entrega en un dispositivo Android.

## Organización

- `acompanamed-app/App.tsx`: navegación e integración de los flujos.
- `acompanamed-app/src/domain`: reglas puras y pruebas.
- `acompanamed-app/src/infrastructure`: almacenamiento, voz, avisos y enlace familiar.
- `acompanamed-app/src/components`: pantallas, formularios y componentes accesibles.

Proyecto académico de la Universidad Nacional de San Agustín de Arequipa, Escuela Profesional de Ingeniería de Sistemas.
