# Surface Brief: AcompañaMed Main App

- **Scope**: Primary mobile screen (`acompanamed-app/App.tsx`)
- **Mode**: operate
- **Audience**: Adulto mayor (paciente geriátrico polimedicado) y su cuidador familiar.
- **Job**: Confirmar o posponer la toma farmacológica sin error ni ansiedad, y supervisar la adherencia clínica y el stock en el hogar.
- **Constraints**: 100% offline-first, WCAG AAA en contraste, botones táctiles gigantes (mínimo 56dp), TTS a 0.85 rate, feedback háptico.

## Direction contract

THESIS: AcompañaMed rehúsa la interfaz genérica médica de tarjetas blancas flotantes con sombras difusas e iconos diminutos; se apropia de la ergonomía noble del reloj despertador táctil de velador, donde cada acción física tiene relieve, claridad absoluta y respuesta inmediata.

OWN-WORLD: Paleta de fondo profundo antirreflejo (#0F172A), superficie de control táctil (#1E293B), botón primario de confirmación en verde esmeralda táctil (#10B981) con borde de relieve (#059669), botón de posponer en ámbar cálido (#F59E0B), y chips de medicamento con color inmutable y formas geométricas puras.

STORY: El adulto mayor ve de un vistazo qué pastilla le toca AHORA MISMO en números y formas grandes. Si está listo, presiona el gran botón verde y siente una vibración de alivio y escucha la voz. Si no está listo, presiona 'Posponer 15 min' sin culpa. El cuidador cambia de pestaña y ve el estado del pastillero sin invadir la autonomía del paciente.

FIRST VIEWPORT: Barra superior compacta con cambio de modo (Senior/Cuidador), selector de franja del día (Mañana, Tarde, Noche) con indicadores claros; al centro, la Gran Pastilla Activa con su forma geométrica, color real y dosis en 28sp; debajo, dos botones físicos táctiles de ancho completo (Verde "TOMADA" y Ámbar "POSPONER 15 MIN"); al pie, botón de voz y acceso a Ficha ICE.

FORM: Reloj Despertador Táctil de Velador, posición 3 de la lista fundamentada, seed:51e50a766b30a3ba.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
