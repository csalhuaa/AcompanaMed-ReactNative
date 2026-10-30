import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_report():
    doc = Document()

    # Configuración de márgenes
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Estilos de encabezado y texto base
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Calibri'
    font_normal.size = Pt(11)
    font_normal.color.rgb = RGBColor(15, 23, 42)

    # ==========================================
    # CARÁTULA ACADÉMICA UNSA
    # ==========================================
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_uni = p_uni.add_run("UNIVERSIDAD NACIONAL DE SAN AGUSTÍN DE AREQUIPA\nFACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS\nESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS")
    run_uni.bold = True
    run_uni.font.size = Pt(13)
    run_uni.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(24)

    p_cur = doc.add_paragraph()
    p_cur.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_cur = p_cur.add_run("CURSO: PLATAFORMAS EMERGENTES\nLABORATORIO 05")
    run_cur.bold = True
    run_cur.font.size = Pt(15)
    run_cur.font.color.rgb = RGBColor(2, 132, 199)

    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_tit = p_tit.add_run("ACOMPAÑAMED: ASISTENTE GERONTOLÓGICO DE ADHERENCIA FARMACOLÓGICA Y TELEMETRÍA PARA CUIDADORES")
    run_tit.bold = True
    run_tit.font.size = Pt(18)
    run_tit.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Implementación en React Native / Expo con Clean Architecture, TDD Riguroso, Componentes Modulares y Accesibilidad WCAG 2.2 AAA")
    run_sub.font.size = Pt(12)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(40)

    # Tabla de Datos Informativos
    tbl_meta = doc.add_table(rows=4, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False

    meta_data = [
        ("Docente:", "Ing. Fabrizio Calienes"),
        ("Semestre Académico:", "2024-B"),
        ("Tecnologías Principales:", "React Native, Expo SDK 52, TypeScript, Jest TDD, Playwright"),
        ("Fecha de Entrega:", "Octubre de 2026"),
    ]

    for row_idx, (k, v) in enumerate(meta_data):
        row = tbl_meta.rows[row_idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        cell_k.width = Inches(2.2)
        cell_v.width = Inches(4.3)
        
        pk = cell_k.paragraphs[0]
        rk = pk.add_run(k)
        rk.bold = True
        rk.font.color.rgb = RGBColor(15, 23, 42)
        
        pv = cell_v.paragraphs[0]
        rv = pv.add_run(v)
        rv.font.color.rgb = RGBColor(51, 65, 85)
        
        set_cell_margins(cell_k, top=60, bottom=60, left=100, right=100)
        set_cell_margins(cell_v, top=60, bottom=60, left=100, right=100)

    doc.add_page_break()

    # Función auxiliar para títulos
    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(15)
        r.font.color.rgb = RGBColor(15, 23, 42)
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(2, 132, 199)
        return h

    # ==========================================
    # 1. RESUMEN EJECUTIVO Y PROBLEMA
    # ==========================================
    add_heading_1("1. Resumen Ejecutivo y Planteamiento del Problema Gerontológico")
    
    p = doc.add_paragraph()
    p.add_run("El envejecimiento poblacional en el Perú y Latinoamérica ha incrementado la prevalencia de enfermedades crónicas no transmisibles (hipertensión arterial, diabetes mellitus tipo 2, dislipidemias), lo que genera cuadros de ")
    p.add_run("polifarmacia geriátrica").bold = True
    p.add_run(" donde un paciente anciano debe ingerir entre 3 a 7 fármacos diarios en diferentes horarios. Sin embargo, las aplicaciones de recordatorio médico estándar del mercado están diseñadas para usuarios jóvenes, cometiendo fallas críticas de accesibilidad:\n")

    bullet_points = [
        ("Tipografía pequeña y bajo contraste: ", "Texto gris claro sobre fondos blancos que resulta ilegible para personas con presbicia, cataratas o degeneración macular."),
        ("Targets táctiles subdimensionados: ", "Botones pequeños (<40dp) y adyacentes horizontalmente que provocan tomas accidentales erróneas o frustración en adultos mayores con temblor senil o artrosis."),
        ("Sobrecarga cognitiva (Slop Visual): ", "Uso excesivo de emojis informales, degradados estridentes, animaciones de gamificación no clínicas y modales intrusivos que desorientan al paciente."),
        ("Aislamiento del cuidador familiar: ", "Falta de sincronización en tiempo real y ventanas de gracia que alerten oportunamente a los hijos o cuidadores cuando el paciente omite un fármaco vital."),
    ]
    for b_title, b_desc in bullet_points:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        bp.add_run(b_desc)

    p_sol = doc.add_paragraph()
    p_sol.add_run("AcompañaMed").bold = True
    p_sol.add_run(" resuelve este desafío mediante un diseño clínico minimalista suizo, con contraste estricto WCAG AAA (>15:1), botonera vertical apilada de 54dp/48dp (cero desborde y máxima motricidad), identificación anatómica de comprimidos y sincronización telemétrica con el cuidador primario.")

    # ==========================================
    # 2. ARQUITECTURA MODULAR Y CLEAN ARCHITECTURE
    # ==========================================
    add_heading_1("2. Arquitectura de Software Modular (Clean Architecture)")
    
    p_arch = doc.add_paragraph()
    p_arch.add_run("Para garantizar la mantenibilidad, escalabilidad y testabilidad académica del proyecto, se desacopló el código de un monolito inicial hacia una arquitectura por capas estrictas en TypeScript:\n")

    layers = [
        ("Capa de Dominio (Domain Layer): ", "Reglas de negocio puras, independientes del framework. Incluye DuplicateGuard (evita sobredosis por duplicidad accidental en menos de 2 horas), StockManager (decremento atómico y alerta de existencias), AdherenceCalculator (métrica objetiva de cumplimiento terapéutico), EscalationEngine (lógica de ventana de gracia de 30 minutos y notificación telemétrica), ScheduleTimelineEngine (construcción del hilo cronológico) y ClinicalReportEngine (generación de informes estructurados para el geriatra)."),
        ("Capa de Infraestructura (Infrastructure Layer): ", "Implementaciones de servicios que interactúan con el hardware y el sistema operativo: StorageService (persistencia offline-first con AsyncStorage), SpeechService (síntesis de voz pausada y respetuosa TTS), HapticService (retroalimentación vibratoria háptica diferenciada para éxito y alerta) y NotificationService (programación de recordatorios locales en Expo)."),
        ("Capa de Presentación Modular (Component Library): ", "Desacoplamiento total de App.tsx en componentes atómicos y reutilizables en src/components/, permitiendo que App.tsx actúe exclusivamente como un coordinador de estado de alto nivel (~360 líneas)."),
    ]
    for l_title, l_desc in layers:
        lp = doc.add_paragraph(style='List Bullet')
        lp.add_run(l_title).bold = True
        lp.add_run(l_desc)

    add_heading_2("Estructura de Carpetas Modular Implementada")
    code_block = doc.add_paragraph()
    code_run = code_block.add_run(
        "acompanamed-app/\n"
        "├── App.tsx                     # Orquestador principal de estado y navegación (~365 líneas)\n"
        "├── src/\n"
        "│   ├── domain/                 # Entidades y motores de negocio (100% cubiertos por TDD)\n"
        "│   │   ├── types.ts            # Interfaces y contratos de tipos TypeScript\n"
        "│   │   ├── DuplicateGuard.ts   # Prevención de sobredosis e ingestión duplicada\n"
        "│   │   ├── StockManager.ts     # Control de inventario y días de autonomía\n"
        "│   │   ├── AdherenceCalculator.ts # Métricas de adherencia porcentual\n"
        "│   │   ├── EscalationEngine.ts # Monitor de ventana de gracia y telemetría\n"
        "│   │   ├── ScheduleTimelineEngine.ts # Generador del río cronológico diario\n"
        "│   │   └── ClinicalReportEngine.ts   # Formateador de informe formal de consulta\n"
        "│   ├── infrastructure/         # Adaptadores nativos (Storage, TTS, Haptics, Notifications)\n"
        "│   └── components/             # Componentes UI modulares especializados\n"
        "│       ├── timeline/\n"
        "│       │   ├── PillVisualRenderer.tsx  # Renderizador anatómico vectorial de pastillas\n"
        "│       │   ├── DoseTimelineCard.tsx    # Tarjeta con botonera vertical apilada\n"
        "│       │   └── TodayTimelineStream.tsx # Hilo cronológico del plan de hoy\n"
        "│       ├── navigation/\n"
        "│       │   └── BottomNavBar.tsx        # Barra de 4 pestañas accesibles\n"
        "│       ├── caregiver/\n"
        "│       │   └── CaregiverDashboard.tsx  # Panel de telemetría y desglose por fármaco\n"
        "│       ├── stock/\n"
        "│       │   └── MedicineInventoryPanel.tsx # Botiquín con reposición +30 y alertas\n"
        "│       ├── ice/\n"
        "│       │   └── EmergencyProfileCard.tsx   # Ficha médica hospitalaria y botón SAMU\n"
        "│       └── modals/\n"
        "│           ├── AddMedicineModal.tsx    # Formulario accesible de nuevo fármaco\n"
        "│           └── ClinicalReportModal.tsx # Visor monoespaciado exportable\n"
    )
    code_run.font.name = 'Consolas'
    code_run.font.size = Pt(9)
    code_run.font.color.rgb = RGBColor(30, 41, 59)

    # ==========================================
    # 3. DECISIONES DE DISEÑO Y RESOLUCIÓN DE HALLAZGOS
    # ==========================================
    add_heading_1("3. Decisiones de Diseño, Accesibilidad y Erradicación de Slop")

    add_heading_2("A. Solución al Desborde: Botonera Clínica Vertical Apilada")
    p_btn = doc.add_paragraph()
    p_btn.add_run("En la evaluación de la interfaz original, se identificó que colocar los botones 'Confirmar toma' y 'Posponer 15m' lado a lado (flexDirection: 'row') en dispositivos con ancho de pantalla móvil estándar (360–390dp) provocaba que los textos casi desbordaran los contenedores y reducía el área de toque efectiva a menos de 145dp. Esto viola el principio de ")
    p_btn.add_run("Fitts's Law").italic = True
    p_btn.add_run(" y expone a pacientes con temblor senil a presionar el botón equivocado.\n\n")
    p_btn.add_run("Solución Implementada: ").bold = True
    p_btn.add_run("Se rediseñó la botonera disponiendo las acciones en ")
    p_btn.add_run("columna vertical al 100% de ancho (flexDirection: 'column')").bold = True
    p_btn.add_run(":\n")

    b_btns = [
        ("Botón Primario ('Confirmar toma'): ", "54dp de altura mínima, ancho completo (100%), color dominante Slate Oscuro (#0F172A), texto blanco de 15pt en negrita, acompañado de icono vectorial check de 22px. Proporciona una confirmación inequívoca."),
        ("Botón Secundario ('Posponer 15 minutos'): ", "48dp de altura mínima, ancho completo (100%), fondo blanco con borde contrastado de 1.5px (#CBD5E1), texto legible (#334155) sin abreviaturas apresuradas y con icono clock-fast de 18px."),
    ]
    for bt, bd in b_btns:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(bt).bold = True
        bp.add_run(bd)

    add_heading_2("B. Erradicación de Emojis vs. Uso Profesional de @expo/vector-icons")
    p_ico = doc.add_paragraph()
    p_ico.add_run("El uso de emojis unicode decorativos (ej. ✓, ⏱, 💊, 🛡️) presenta serias deficiencias en entornos médicos de producción:\n")
    p_ico_bullets = [
        ("Fragmentación visual entre fabricantes: ", "Los emojis se renderizan según la fuente del sistema operativo del fabricante (Google Noto en Pixel, Samsung Color Emoji en OneUI, Apple Color Emoji en iOS, Xiaomi Emoji en MIUI), luciendo inconsistentes e informales."),
        ("Falta de semántica clínica accesible: ", "Los lectores de pantalla (TalkBack / VoiceOver) frecuentemente vocalizan los emojis con descripciones redundantes o literales ('Marca de verificación gruesa blanca', 'Reloj de arena con arena fluyendo') en lugar del propósito de la acción médica."),
        ("Rendimiento y escalabilidad: ", "Los emojis no permiten cambiar su color programáticamente según el estado clínico (alerta, pendiente, completado) ni controlar con precisión micrométrica su grosor de trazo."),
    ]
    for it, idesc in p_ico_bullets:
        ip = doc.add_paragraph(style='List Bullet')
        ip.add_run(it).bold = True
        ip.add_run(idesc)

    p_sol_ico = doc.add_paragraph()
    p_sol_ico.add_run("Solución Implementada: ").bold = True
    p_sol_ico.add_run("Se integró la librería profesional ")
    p_sol_ico.add_run("@expo/vector-icons (MaterialCommunityIcons)").bold = True
    p_sol_ico.add_run(", garantizando iconos vectoriales SVG limpios, escalables a cualquier densidad de píxeles, con colorización reactiva según el contraste WCAG AAA y etiquetas de accesibilidad explícitas (accessibilityLabel y accessibilityRole).")

    add_heading_2("C. Multiplataforma en React Native: Del Antipatrón 'Móvil Inflado' a la Arquitectura Adaptativa")
    p_multi = doc.add_paragraph()
    p_multi.add_run("Un dilema común en el desarrollo con React Native for Web es el denominado ")
    p_multi.add_run("antipatrón del móvil inflado (Blown-up Mobile Anti-pattern)").italic = True
    p_multi.add_run(". React Native nació originalmente para sistemas operativos móviles (Android e iOS). Al exportar a la Web, el motor Flexbox de React Native interpreta un ancho de '100%' contra el viewport completo del monitor del computador (1920px o más), provocando que botones clínicos y tarjetas se estiren horizontalmente de forma desproporcionada e inaccesible.\n\n")
    p_multi.add_run("Para resolver esto y elevar la aplicación al estándar de la industria (similar a Twitter/X Web, Slack o WhatsApp Web), se implementó un sistema de diseño adaptativo con ")
    p_multi.add_run("useWindowDimensions()").bold = True
    p_multi.add_run(" que ofrece dos experiencias según el dispositivo:\n")

    multi_bullets = [
        ("Móvil Nativo (<768px): ", "Disposición pura a 1 columna vertical con barra inferior de navegación (Bottom Navigation) accesible al alcance del pulgar."),
        ("Modo 1 Desktop — Shell Ergonómico Centrado: ", "En monitores de escritorio, la aplicación confina su chasis a 480px centrados en un canvas neutro (#EEF2F6) con sutil elevación y bordes de delimitación. Esto evita que los botones clínicos se estiren y preserva la ergonomía humana."),
        ("Modo 2 Desktop — Estación de Trabajo Clínica (Split View de 2 Columnas): ", "Aprovecha la pantalla ancha (>=1024px) dividiendo el espacio en dos columnas paralelas: a la izquierda el Plan Cronológico del Paciente y a la derecha el Panel del Cuidador, Botiquín y Emergencia en tiempo real. Esto permite a médicos y familiares supervisar y registrar sin alternar pestañas."),
    ]
    for mt, md in multi_bullets:
        mp = doc.add_paragraph(style='List Bullet')
        mp.add_run(mt).bold = True
        mp.add_run(md)

    # ==========================================
    # 4. CAPTURAS Y EVIDENCIAS DE LA APLICACIÓN
    # ==========================================
    doc.add_page_break()
    add_heading_1("4. Evidencias Visuales y Verificación de Pantallas")

    figures_dir = r"C:\Users\LENOVO\.gemini\antigravity-cli\brain\5fde4a88-f11a-409e-95ae-c632e1c16083\figures"

    screens = [
        ("modular_app_today.png", "Figura 1: Pantalla Principal 'Hoy' (Móvil) — Hilo Cronológico con Botonera Vertical Apilada"),
        ("modular_app_caregiver.png", "Figura 2: Pestaña 'Cuidador' (Móvil) — Telemetría de Adherencia (100%) y Período de Gracia"),
        ("desktop_mode_mobile_shell.png", "Figura 3: Ejecución en Navegador Web Desktop — Modo Móvil Ergonómico Centrado (Cero Elementos Estirados)"),
        ("desktop_mode_split_view.png", "Figura 4: Ejecución en Navegador Web Desktop — Modo Panel Clínico PC (Split View de 2 Columnas Paralelas)"),
        ("modular_app_stock.png", "Figura 5: Pestaña 'Botiquín' — Control de Inventario y Reposición +30"),
        ("modular_app_emergency.png", "Figura 6: Pestaña 'Emergencia' — Ficha Médica Hospitalaria ICE con Discado SAMU 106"),
    ]

    for img_name, caption in screens:
        img_path = os.path.join(figures_dir, img_name)
        if os.path.exists(img_path):
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(8)
            p_cap.paragraph_format.space_after = Pt(4)
            run_img = p_cap.add_run()
            run_img.add_picture(img_path, width=Inches(3.2))
            
            p_lbl = doc.add_paragraph()
            p_lbl.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_lbl.paragraph_format.space_after = Pt(14)
            r_lbl = p_lbl.add_run(caption)
            r_lbl.font.size = Pt(9.5)
            r_lbl.italic = True
            r_lbl.font.color.rgb = RGBColor(71, 85, 105)

    # ==========================================
    # 5. BATERÍA DE PRUEBAS TDD
    # ==========================================
    doc.add_page_break()
    add_heading_1("5. Verificación Rigurosa con TDD (Test-Driven Development)")

    p_tdd = doc.add_paragraph()
    p_tdd.add_run("Siguiendo la metodología TDD, se diseñaron pruebas automatizadas antes de la implementación de cada motor. La suite ejecuta ")
    p_tdd.add_run("35 pruebas unitarias").bold = True
    p_tdd.add_run(" que validan la robustez del sistema frente a fallos humanos y condiciones de borde clínicas:\n")

    tdd_summary_data = [
        ("Módulo de Prueba", "Pruebas", "Comportamiento Clínico Garantizado"),
        ("DuplicateGuard", "3 tests", "Bloquea tomas duplicadas accidentales en menos de 2 horas. Evita sobredosis."),
        ("StockManager", "4 tests", "Decremento seguro (stock >= 0), cálculo de días restantes y alerta crítica."),
        ("AdherenceCalculator", "2 tests", "Tasa porcentual matemática y categorización de adherencia clínica."),
        ("EscalationEngine", "2 tests", "Ventana de gracia de 30 min y disparo de escalamiento a red de apoyo."),
        ("ScheduleTimelineEngine", "7 tests", "Clasificación de franjas horarias geriátricas, ordenación y estado de tomas."),
        ("ClinicalReportEngine", "5 tests", "Validación de ficha ICE, desglose por principio activo y alertas al geriatra."),
        ("Speech & Notification", "6 tests", "Síntesis de voz pausada con saludo respetuoso y payloads de notificación."),
        ("StorageService", "6 tests", "Persistencia offline-first y recuperación resiliente ante datos corruptos."),
    ]

    tbl_tdd = doc.add_table(rows=len(tdd_summary_data), cols=3)
    tbl_tdd.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tdd.autofit = False

    for r_idx, (col0, col1, col2) in enumerate(tdd_summary_data):
        row = tbl_tdd.rows[r_idx]
        c0, c1, c2 = row.cells[0], row.cells[1], row.cells[2]
        c0.width = Inches(2.2)
        c1.width = Inches(1.0)
        c2.width = Inches(3.3)
        
        for c, text in [(c0, col0), (c1, col1), (c2, col2)]:
            p_cell = c.paragraphs[0]
            r_cell = p_cell.add_run(text)
            set_cell_margins(c, top=60, bottom=60, left=80, right=80)
            if r_idx == 0:
                r_cell.bold = True
                r_cell.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(c, "0F172A")
            else:
                r_cell.font.size = Pt(9.5)
                if r_idx % 2 == 1:
                    set_cell_background(c, "F8FAFC")

    p_tdd_res = doc.add_paragraph()
    p_tdd_res.paragraph_format.space_before = Pt(12)
    p_tdd_res.add_run("Resultado de la Ejecución Automatizada: ").bold = True
    r_pass = p_tdd_res.add_run("35 PASSED / 0 FAILED (100% de éxito en 398 ms)")
    r_pass.bold = True
    r_pass.font.color.rgb = RGBColor(5, 150, 105)

    # ==========================================
    # 6. CONCLUSIONES Y APRENDIZAJES
    # ==========================================
    add_heading_1("6. Conclusiones y Aprendizajes de Plataformas Emergentes")

    conclusions = [
        ("Diseño Centrado en el Adulto Mayor: ", "Las restricciones físicas y cognitivas geriátricas deben gobernar la arquitectura de la interfaz. La adopción de una botonera vertical apilada al 100% con alturas de 54dp/48dp elimina por completo el riesgo de desborde y asegura una experiencia táctil sin errores."),
        ("Erradicación de Slop y Estandarización Profesional: ", "Sustituir emojis por librerías nativas vectoriales (@expo/vector-icons) eleva la calidad del software a estándares de grado médico, garantizando uniformidad visual en cualquier dispositivo y compatibilidad con lectores de accesibilidad TalkBack."),
        ("Clean Architecture y Modularidad en React Native: ", "Desacoplar un archivo monolítico en componentes funcionales especializados (timeline, navigation, caregiver, stock, ice, modals) optimiza drásticamente el ciclo de vida de renderizado, reduce la complejidad ciclomática y permite que nuevos desarrolladores mantengan la base de código sin riesgo de efectos colaterales."),
        ("Offline-First y Resiliencia Sanitaria: ", "La adherencia a tratamientos farmacológicos no puede depender de conectividad a internet continua. La integración de persistencia local resiliente con AsyncStorage asegura que el paciente y su cuidador siempre tengan acceso inmediato a sus horarios e información crítica de emergencia."),
    ]
    for c_title, c_desc in conclusions:
        cp = doc.add_paragraph(style='List Bullet')
        cp.add_run(c_title).bold = True
        cp.add_run(c_desc)

    # Guardar documento
    output_path = r"D:\AndroidApps\pelab\proyecto\INFORME_LAB05_PLATAFORMAS_EMERGENTES_ACOMPANAMED.docx"
    doc.save(output_path)
    print(f"Informe generado exitosamente en: {output_path}")

if __name__ == '__main__':
    create_report()
