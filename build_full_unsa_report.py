import os
import sys
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

def add_callout(doc, text, bold_prefix="", color_hex="0284C7", bg_hex="F0F9FF"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    # Border: left colored, none on other sides
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{color_hex}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.size = Pt(10)
        r_pre.font.color.rgb = RGBColor(15, 23, 42)
    r_txt = p.add_run(text)
    r_txt.font.size = Pt(10)
    r_txt.font.color.rgb = RGBColor(51, 65, 85)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_code_snippet(doc, code_str):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:left w:val="single" w:sz="18" w:space="0" w:color="0284C7"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(code_str)
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_styled_image(doc, img_rel_path, caption_text, width_inches=4.8):
    if os.path.exists(img_rel_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(10)
        p_img.paragraph_format.space_after = Pt(3)
        run = p_img.add_run()
        run.add_picture(img_rel_path, width=Inches(width_inches))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run(caption_text)
        r_cap.font.size = Pt(9.5)
        r_cap.italic = True
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

def add_two_column_images(doc, img1_path, cap1_text, img2_path, cap2_text):
    tbl = doc.add_table(rows=2, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    for c_idx in [0, 1]:
        tbl.cell(0, c_idx).width = Inches(3.2)
        tbl.cell(1, c_idx).width = Inches(3.2)
    
    # Row 0: Images
    if os.path.exists(img1_path):
        p1 = tbl.cell(0, 0).paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.add_run().add_picture(img1_path, width=Inches(3.0))
    if os.path.exists(img2_path):
        p2 = tbl.cell(0, 1).paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.add_run().add_picture(img2_path, width=Inches(3.0))
        
    # Row 1: Captions
    p1_c = tbl.cell(1, 0).paragraphs[0]
    p1_c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1_c = p1_c.add_run(cap1_text)
    r1_c.font.size = Pt(9)
    r1_c.italic = True
    r1_c.font.color.rgb = RGBColor(71, 85, 105)
    
    p2_c = tbl.cell(1, 1).paragraphs[0]
    p2_c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2_c = p2_c.add_run(cap2_text)
    r2_c.font.size = Pt(9)
    r2_c.italic = True
    r2_c.font.color.rgb = RGBColor(71, 85, 105)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

def generate_report():
    doc = Document()

    # Márgenes de página estándar académico A4
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True

    # Estilo base
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Calibri'
    font_normal.size = Pt(11)
    font_normal.color.rgb = RGBColor(15, 23, 42)

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(15)
        r.font.color.rgb = RGBColor(15, 23, 42)
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(12.5)
        r.font.color.rgb = RGBColor(2, 132, 199)
        return h

    def add_h3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(3)
        r = h.add_run(text)
        r.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return h

    # ==========================================
    # 1. CARÁTULA OFICIAL UNSA
    # ==========================================
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_uni = p_uni.add_run("UNIVERSIDAD NACIONAL DE SAN AGUSTÍN DE AREQUIPA\nFACULTAD DE INGENIERÍA DE PRODUCCIÓN Y SERVICIOS\nESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS")
    run_uni.bold = True
    run_uni.font.size = Pt(13)
    run_uni.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(36)

    p_cur = doc.add_paragraph()
    p_cur.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_cur = p_cur.add_run("CURSO: PLATAFORMAS EMERGENTES (E) — 2024B\nGUÍA DE LABORATORIO N° 05")
    run_cur.bold = True
    run_cur.font.size = Pt(14)
    run_cur.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph().paragraph_format.space_after = Pt(18)

    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_tit = p_tit.add_run("ACOMPAÑAMED: ASISTENTE GERONTOLÓGICO DE ADHERENCIA FARMACOLÓGICA Y TELEMETRÍA PARA CUIDADORES FAMILIARES")
    run_tit.bold = True
    run_tit.font.size = Pt(17)
    run_tit.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Desarrollo Multiplataforma en React Native / Expo con Clean Architecture, TDD Riguroso, Control de Acceso por Roles (RBAC), Adaptación Ergonómica de Escritorio y Accesibilidad WCAG 2.2 AAA")
    run_sub.font.size = Pt(11.5)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(40)

    # Tabla de Metadatos
    tbl_meta = doc.add_table(rows=5, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False

    meta_rows = [
        ("Docente:", "M. Sc. Ing. R. Fabrizio Calienes Rodriguez"),
        ("Semestre Académico:", "2024-B"),
        ("Tema de Laboratorio:", "Laboratorio 5: Aplicaciones Multiplataforma"),
        ("Stack Tecnológico:", "React Native 0.76, Expo SDK 52, TypeScript 5, Node Test Runner (TDD), Playwright"),
        ("Fecha de Entrega:", "Octubre de 2026"),
    ]

    for idx, (k, v) in enumerate(meta_rows):
        row = tbl_meta.rows[idx]
        ck, cv = row.cells[0], row.cells[1]
        ck.width = Inches(2.2)
        cv.width = Inches(4.3)
        pk, pv = ck.paragraphs[0], cv.paragraphs[0]
        rk = pk.add_run(k)
        rk.bold = True
        rk.font.color.rgb = RGBColor(15, 23, 42)
        rv = pv.add_run(v)
        rv.font.color.rgb = RGBColor(51, 65, 85)
        set_cell_margins(ck, top=60, bottom=60, left=100, right=100)
        set_cell_margins(cv, top=60, bottom=60, left=100, right=100)
        if idx % 2 == 1:
            set_cell_background(ck, "F8FAFC")
            set_cell_background(cv, "F8FAFC")

    doc.add_page_break()

    # ==========================================
    # 2. RESUMEN / ABSTRACT
    # ==========================================
    add_h1("Resumen")
    p_res = doc.add_paragraph()
    p_res.add_run(
        "El presente proyecto documenta la concepción, diseño e implementación de AcompañaMed, una aplicación "
        "multiplataforma orientada a mitigar la crisis de adherencia farmacológica en adultos mayores con regímenes de "
        "polifarmacia crónica en el contexto peruano. Empleando React Native con TypeScript y el ecosistema Expo SDK 52, "
        "se desarrolló una solución que trasciende las limitaciones de las aplicaciones comerciales estándar —frecuentemente "
        "inaccesibles, cargadas de ruido visual y propensas a errores motrices—. La arquitectura implementa principios de "
        "Clean Architecture con una separación estricta en tres capas: Motores de Dominio 100% testeados mediante TDD "
        "(Prevención de tomas duplicadas, Gestión de inventario con proyección de autonomía, Cálculo de adherencia clínica, "
        "Escalamiento con ventana de gracia respetuosa y Generación de informes geriátricos), Capa de Infraestructura con "
        "resiliencia Offline-First mediante persistencia local en SQLite (AsyncStorage) complementada con sincronización cloud BaaS, "
        "y una Capa de Presentación modularizada. Se resolvió de manera paradigmática el antipatrón del 'móvil inflado' en navegadores web, "
        "proporcionando un Shell Centrado de 480px y una Estación de Trabajo Clínica de dos columnas (Split View) para computadoras de escritorio. "
        "Asimismo, se integró un modelo de Control de Acceso Basado en Roles (RBAC) que protege el botiquín farmacológico ante manipulaciones "
        "accidentales del paciente y canaliza alertas de escalamiento omnicanal hacia el WhatsApp del cuidador primario."
    )

    add_h2("Abstract")
    p_abs = doc.add_paragraph()
    p_abs.italic = True
    p_abs.add_run(
        "This project presents the design and implementation of AcompañaMed, a multiplatform application developed to address "
        "the pharmacological adherence crisis among senior citizens undergoing chronic polypharmacy in Peru. Built with React Native, "
        "TypeScript, and Expo SDK 52, the platform overcomes the usability flaws of standard commercial pill reminders—typically cluttered, "
        "visually uncalibrated, and error-prone for patients with motor or visual impairments. The system follows Clean Architecture "
        "principles with strict layer separation: Domain Engines thoroughly tested via Test-Driven Development (TDD) (Duplicate dose "
        "prevention, Inventory management with autonomy projection, Clinical adherence metrics, Escalation engine with a 30-minute grace "
        "period, and Formal geriatric clinical reports), an Infrastructure Layer ensuring Offline-First resilience through local SQLite "
        "(AsyncStorage) synchronized with Cloud BaaS, and a Modular Presentation Layer. Furthermore, the desktop 'blown-up mobile' "
        "anti-pattern in React Native Web was eliminated through an Adaptive Desktop Shell and a 2-Column Clinical Workspace. Role-Based "
        "Access Control (RBAC) secures medical prescriptions from accidental senior tampering while directing critical escalation alerts "
        "to the primary caregiver's WhatsApp channel."
    )

    doc.add_page_break()

    # ==========================================
    # 3. ÍNDICES (CONTENIDO, IMÁGENES Y TABLAS)
    # ==========================================
    add_h1("Índice de Contenido")
    
    index_items = [
        ("1. Descripción General del Proyecto", "4"),
        ("    1.1 Propósito del Proyecto y Proyección Social", "4"),
        ("    1.2 Árbol de Problemas y Árbol de Objetivos", "5"),
        ("    1.3 Requisitos Funcionales (Completos y Pendientes)", "6"),
        ("    1.4 Requisitos No Funcionales", "7"),
        ("2. Descripción de las Tareas Asignadas", "8"),
        ("    2.1 Matriz de Asignación de Roles de Ingeniería", "8"),
        ("    2.2 Estado de Tareas (Completadas vs. Pendientes)", "9"),
        ("3. Descripción del Proceso de Desarrollo y Arquitectura", "10"),
        ("    3.1 Selección del Framework Multiplataforma (React Native vs. Alternativas)", "10"),
        ("    3.2 Clean Architecture y Desacoplamiento Modular", "11"),
        ("    3.3 Rediseño Gerontológico: Botonera Vertical y Erradicación de Slop", "12"),
        ("    3.4 Superación del Antipatrón 'Móvil Inflado' en Web (Chasis y Split View)", "13"),
        ("    3.5 Gestión Avanzada de Botiquín: Packs Comerciales y ConfirmDialogModal", "14"),
        ("    3.6 Seguridad RBAC: Protección del Botiquín y Permisos de Cuidador", "15"),
        ("    3.7 Persistencia de Datos: Arquitectura Offline-First + Cloud BaaS", "16"),
        ("    3.8 Protocolo de Escalamiento de 3 Fases y Telemetría WhatsApp", "17"),
        ("    3.9 Verificación Rigurosa con TDD (35 Tests Automatizados)", "18"),
        ("4. Interfaces de la Aplicación", "19"),
        ("5. Anexos y Repositorio de Código", "25"),
        ("6. Referencias Bibliográficas", "26"),
    ]
    for it_text, it_page in index_items:
        p_idx = doc.add_paragraph()
        p_idx.paragraph_format.space_before = Pt(1)
        p_idx.paragraph_format.space_after = Pt(1)
        r_txt = p_idx.add_run(it_text)
        r_txt.font.size = Pt(10)
        # Tab leader
        r_dots = p_idx.add_run(" " + "." * (80 - len(it_text) * 2) + " ")
        r_dots.font.color.rgb = RGBColor(148, 163, 184)
        r_pg = p_idx.add_run(it_page)
        r_pg.bold = True
        r_pg.font.size = Pt(10)

    add_h2("Índice de Imágenes")
    figures_list = [
        ("Figura 1", "Pantalla Principal 'Hoy' (Móvil) — Hilo Cronológico con Botonera Vertical Apilada"),
        ("Figura 2", "Pestaña 'Cuidador' (Móvil) — Panel de Telemetría Cuantitativa de Adherencia Terapéutica"),
        ("Figura 3", "Pestaña 'Cuidador' — Canal de Alertas, Protocolo de 3 Pasos y Simulación a WhatsApp"),
        ("Figura 4", "Ejecución Web Desktop — Modo Móvil Ergonómico Centrado (Resolución del Antipatrón)"),
        ("Figura 5", "Ejecución Web Desktop — Modo Estación Clínica Split View de Dos Columnas Paralelas"),
        ("Figura 6", "Pestaña 'Botiquín' — Control Visual de Autonomía de Fármacos y Botones de Acción"),
        ("Figura 7", "Modal Reponer Unidades — Selector Rápido de Packs Comerciales y Stepper Manual"),
        ("Figura 8", "Modal Confirmar Retiro — Diálogo React Native Web Multiplataforma Funcional"),
        ("Figura 9", "Control RBAC: Botiquín Bloqueado en Modo Don Manuel (Paciente) con Candado de Seguridad"),
        ("Figura 10", "Control RBAC: Botiquín Desbloqueado en Modo Cuidadora (María Alhua) para Administración"),
        ("Figura 11", "Modal Formulario 'Nuevo Medicamento' — Diálogo Centrado Adaptativo no Estirado"),
        ("Figura 12", "Modal Visor de Reporte Clínico Geriátrico Estructurado para Consulta Médica"),
        ("Figura 13", "Pestaña 'Emergencia' — Ficha Médica Hospitalaria ICE y Marcación Rápida a SAMU 106"),
    ]
    for f_id, f_desc in figures_list:
        pf = doc.add_paragraph()
        pf.paragraph_format.space_before = Pt(1)
        pf.paragraph_format.space_after = Pt(1)
        rf_id = pf.add_run(f_id + ": ")
        rf_id.bold = True
        rf_id.font.size = Pt(9.5)
        rf_desc = pf.add_run(f_desc)
        rf_desc.font.size = Pt(9.5)

    add_h2("Índice de Tablas")
    tables_list = [
        ("Tabla 1", "Matriz de Requisitos Funcionales del Sistema (Completos vs. Pendientes)"),
        ("Tabla 2", "Matriz de Requisitos No Funcionales de Grado Médico y Accesibilidad"),
        ("Tabla 3", "Asignación de Tareas de Ingeniería de Software por Módulo"),
        ("Tabla 4", "Comparativa Técnica de Frameworks Multiplataforma (React Native vs. Flutter vs. MAUI)"),
        ("Tabla 5", "Resumen de Ejecución de la Suite TDD Automatizada (35 Tests Pasados)"),
    ]
    for t_id, t_desc in tables_list:
        pt = doc.add_paragraph()
        pt.paragraph_format.space_before = Pt(1)
        pt.paragraph_format.space_after = Pt(1)
        rt_id = pt.add_run(t_id + ": ")
        rt_id.bold = True
        rt_id.font.size = Pt(9.5)
        rt_desc = pt.add_run(t_desc)
        rt_desc.font.size = Pt(9.5)

    doc.add_page_break()

    # ==========================================
    # 4. DESCRIPCIÓN GENERAL DEL PROYECTO
    # ==========================================
    add_h1("1. Descripción General del Proyecto")
    
    add_h2("1.1 Propósito del Proyecto y Proyección Social")
    p_prop = doc.add_paragraph()
    p_prop.add_run(
        "El envejecimiento demográfico es una de las transiciones sociales más profundas del siglo XXI. En el Perú, "
        "según estimaciones del Instituto Nacional de Estadística e Informática (INEI), más del 13% de la población supera "
        "los 60 años, y se prevé que alcance el 22% hacia el año 2050. Este fenómeno viene acompañado por un incremento exponencial "
        "de enfermedades crónicas no transmisibles (hipertensión arterial, diabetes mellitus, hipercolesterolemia, insuficiencia cardíaca y artrosis), "
        "conduciendo a cuadros generalizados de "
    )
    p_prop.add_run("polifarmacia geriátrica").bold = True
    p_prop.add_run(
        ", donde un paciente anciano debe ingerir entre tres y ocho fármacos diarios, cada uno con horarios, dosis, restricciones dietéticas "
        "y condiciones de ingesta rigurosas.\n\n"
        "Estudios clínicos de la Organización Mundial de la Salud (OMS) revelan que la adherencia farmacológica en tratamientos crónicos "
        "apenas alcanza el 50% en países en desarrollo. En pacientes geriátricos, las consecuencias de la no adherencia son catastróficas: "
        "crisis hipertensivas con riesgo de ACV (Accidente Cerebrovascular), descompensaciones diabéticas agudas, reingresos hospitalarios frecuentes "
        "y sobredosis accidentales causadas por fallas de memoria a corto plazo (el paciente no recuerda si ya ingirió la dosis matutina y la duplica). "
        "A ello se suma la 'ansiedad del cuidador familiar', hijos o cónyuges que deben ausentarse para trabajar pero cargan con la zozobra constante "
        "de no saber si su ser querido tomó su medicación a tiempo.\n\n"
        "AcompañaMed nace con el firme propósito de "
    )
    p_prop.add_run("proyección social universitaria").bold = True
    p_prop.add_run(
        ": crear un asistente digital integral, accesible y multiplataforma que empodere al adulto mayor en su autonomía diaria, "
        "salvaguarde su integridad física mediante barreras lógicas de seguridad (prevención de duplicidad y control de stock) y proporcione "
        "a sus cuidadores familiares telemetría en tiempo real y canales de alerta temprana automatizados."
    )

    add_h2("1.2 Árbol de Problemas y Árbol de Objetivos")
    p_arbol = doc.add_paragraph()
    p_arbol.add_run("La concepción de AcompañaMed parte de un riguroso análisis de causa-raíz gerontológico:\n")
    
    add_callout(
        doc,
        "ÁRBOL DE PROBLEMAS (Causa-Efecto):\n"
        "• EFECTO SUPERIOR: Crisis hipertensivas, hospitalizaciones de emergencia, sobredosis accidentales y desgaste psíquico del cuidador.\n"
        "• PROBLEMA CENTRAL: Alta tasa de no adherencia y riesgo de intoxicación en adultos mayores polimedicados.\n"
        "• CAUSA 1 (Fisiológica): Deterioro cognitivo leve y presbicia que dificulta leer prospectos y etiquetas pequeñas.\n"
        "• CAUSA 2 (Diseño UI): Aplicaciones estándar con botones minúsculos pegados, tipografía gris inaccesible y emojis desorientadores.\n"
        "• CAUSA 3 (Arquitectura): Falta de mecanismos offline-first y ausencia de sincronización telemétrica con la red familiar.",
        bold_prefix="Diagnóstico Estructural: ",
        color_hex="DC2626",
        bg_hex="FEF2F2"
    )

    add_callout(
        doc,
        "ÁRBOL DE OBJETIVOS (Medio-Fin):\n"
        "• FIN ÚLTIMO: Disminución de complicaciones vasculares agudas, preservación de la autonomía del adulto mayor y tranquilidad familiar.\n"
        "• OBJETIVO GENERAL: Desarrollar un asistente farmacológico multiplataforma inclusivo con telemetría telemática de cuidadores.\n"
        "• MEDIO 1: Hilo cronológico del día con identificación anatómica visual de comprimidos (cápsula, comprimido ranurado, circular).\n"
        "• MEDIO 2: Botonera vertical al 100% de ancho con dimensiones ergonómicas de 54dp/48dp y síntesis de voz pausada (TTS).\n"
        "• MEDIO 3: Motores de prevención de sobredosis (DuplicateGuard), inventario inteligente y escalamiento respetuoso de 30 minutos.",
        bold_prefix="Solución Propuesta: ",
        color_hex="059669",
        bg_hex="ECFDF5"
    )

    add_h2("1.3 Requisitos Funcionales (Completos y Pendientes)")
    p_rf = doc.add_paragraph()
    p_rf.add_run("La siguiente tabla clasifica los requisitos funcionales del sistema, documentando el estado actual de cumplimiento:")

    rf_data = [
        ("Código", "Requisito Funcional", "Descripción Operativa", "Estado"),
        ("RF-01", "Agenda Cronológica del Día", "Presenta el plan de medicación ordenado en franjas (Mañana, Tarde, Noche) con tarjeta prioritaria de dosis actual.", "COMPLETO (100%)"),
        ("RF-02", "Confirmación de Toma y Descuento", "Registro de toma con decremento atómico de stock (-1) y actualización de estado en bitácora.", "COMPLETO (100%)"),
        ("RF-03", "Prevención de Sobredosis (DuplicateGuard)", "Bloquea tomas consecutivas del mismo fármaco si transcurrieron menos de 2 horas desde la última toma.", "COMPLETO (100%)"),
        ("RF-04", "Lectura de Instrucciones por Voz", "Síntesis de voz (TTS) pausada, sin modismos apresurados, que indica el nombre, dosis e ingesta con agua.", "COMPLETO (100%)"),
        ("RF-05", "Botiquín y Reposición de Inventario", "Monitoreo de stock con barra de autonomía, selector de packs comerciales (+10, +20, +30, +60) y stepper.", "COMPLETO (100%)"),
        ("RF-06", "Eliminación Segura de Fármacos", "Retiro de medicamentos del inventario mediante modal nativo interactivo ConfirmDialogModal.", "COMPLETO (100%)"),
        ("RF-07", "Control de Acceso por Roles (RBAC)", "Alternancia de perfiles: 'Don Manuel (Paciente)' y 'Cuidadora (María)'. Bloqueo de botiquín en modo paciente.", "COMPLETO (100%)"),
        ("RF-08", "Telemetría y Métricas de Adherencia", "Cálculo matemático de adherencia global (%) y desglose individual por principio activo para el médico.", "COMPLETO (100%)"),
        ("RF-09", "Protocolo de Alertas y Escalamiento", "Alarma local a minuto 0, ventana de gracia de 30 min y despacho de alerta telemétrica a WhatsApp de María.", "COMPLETO (100%)"),
        ("RF-10", "Ficha Médica ICE y Auxilio Rápido", "Datos de contacto de emergencia, alergias, tipo de sangre y botón de llamada directa a SAMU 106.", "COMPLETO (100%)"),
        ("RF-11", "Generador de Informe Clínico Formal", "Generación y visualización de resumen estructurado para el geriatra con advertencias de omisión.", "COMPLETO (100%)"),
        ("RF-12", "Sincronización Cloud Automática BaaS", "Replicación bidireccional continua con Firebase Cloud Firestore en segundo plano (SyncQueue en red).", "PENDIENTE (Roadmap)"),
    ]

    tbl_rf = doc.add_table(rows=len(rf_data), cols=4)
    tbl_rf.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_rf.autofit = False

    col_widths_rf = [Inches(0.9), Inches(2.0), Inches(2.6), Inches(1.0)]
    for r_idx, row_values in enumerate(rf_data):
        row = tbl_rf.rows[r_idx]
        for c_idx, text in enumerate(row_values):
            cell = row.cells[c_idx]
            cell.width = col_widths_rf[c_idx]
            p_cell = cell.paragraphs[0]
            r_cell = p_cell.add_run(text)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            if r_idx == 0:
                r_cell.bold = True
                r_cell.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0F172A")
            else:
                r_cell.font.size = Pt(8.5)
                if c_idx == 3:
                    r_cell.bold = True
                    if "COMPLETO" in text:
                        r_cell.font.color.rgb = RGBColor(5, 150, 105)
                    else:
                        r_cell.font.color.rgb = RGBColor(217, 119, 6)
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    add_h2("1.4 Requisitos No Funcionales (RNF)")
    p_rnf = doc.add_paragraph()
    p_rnf.add_run("Los requisitos no funcionales definen los atributos de calidad, resiliencia y accesibilidad médica del producto:")

    rnf_data = [
        ("Código", "Categoría", "Especificación Técnica y Criterio de Aceptación"),
        ("RNF-01", "Accesibilidad WCAG 2.2 AAA", "Contraste de color superior a 7:1 en textos estándar y >15:1 en elementos interactivos primarios (#0F172A sobre #FFFFFF = 18.2:1)."),
        ("RNF-02", "Ergonomía Táctil Gerontológica", "Targets táctiles de botón primario >= 54dp de altura, botón secundario >= 48dp, con ancho al 100% y separación vertical mínima de 8dp."),
        ("RNF-03", "Resiliencia Offline-First", "El sistema debe ser 100% operativo sin internet: alarmas locales, registro de tomas y actualización de stock persisten en SQLite nativo."),
        ("RNF-04", "Rendimiento y Tiempo de Respuesta", "Transición entre pestañas < 100ms. Ejecución de motores de dominio en < 5ms. Suite completa de 35 tests en < 400ms."),
        ("RNF-05", "Multiplataforma Adaptativa", "Soporte nativo para Android e iOS, y ejecución sin estiramiento en Web Desktop mediante Shell Centrado (480px) y Split View (1024px)."),
        ("RNF-06", "Seguridad y RBAC", "Protección estricta contra edición accidental del paciente: el botiquín y recetas exigen rol de cuidador verificado."),
        ("RNF-07", "Consistencia Semántica e Iconográfica", "Erradicación total de emojis del sistema operativo. Empleo exclusivo de iconos vectoriales SVG de @expo/vector-icons."),
        ("RNF-08", "Mantenibilidad y Clean Code", "Tipado estricto en TypeScript sin uso de 'any'. Desacoplamiento modular de App.tsx en componentes atómicos especializados."),
    ]

    tbl_rnf = doc.add_table(rows=len(rnf_data), cols=3)
    tbl_rnf.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_rnf.autofit = False

    col_widths_rnf = [Inches(1.0), Inches(1.8), Inches(3.7)]
    for r_idx, row_values in enumerate(rnf_data):
        row = tbl_rnf.rows[r_idx]
        for c_idx, text in enumerate(row_values):
            cell = row.cells[c_idx]
            cell.width = col_widths_rnf[c_idx]
            p_cell = cell.paragraphs[0]
            r_cell = p_cell.add_run(text)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            if r_idx == 0:
                r_cell.bold = True
                r_cell.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0F172A")
            else:
                r_cell.font.size = Pt(8.5)
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")

    doc.add_page_break()

    # ==========================================
    # 5. DESCRIPCIÓN DE LAS TAREAS ASIGNADAS
    # ==========================================
    add_h1("2. Descripción de las Tareas Asignadas")
    p_tasks = doc.add_paragraph()
    p_tasks.add_run(
        "Para el desarrollo de AcompañaMed se establecieron cinco frentes de trabajo de ingeniería de software, "
        "distribuyendo las responsabilidades según la arquitectura Clean Architecture y el flujo metodológico TDD:"
    )

    task_data = [
        ("Frente de Trabajo", "Módulos y Componentes Involucrados", "Tareas Ejecutadas y Entregables", "Estado"),
        ("1. Dominio y Lógica Médica TDD", "DuplicateGuard, StockManager, AdherenceCalculator, EscalationEngine, ScheduleTimelineEngine", "Definición formal de interfaces TypeScript, creación previa de 35 pruebas unitarias TDD y codificación pura de reglas de negocio sin dependencias UI.", "COMPLETO"),
        ("2. Arquitectura UI y Modularidad", "DoseTimelineCard, PillVisualRenderer, BottomNavBar, TodayTimelineStream, App.tsx", "Desacoplamiento del archivo monolítico App.tsx. Implementación de botonera vertical apilada al 100%, renderizador anatómico vectorial de comprimidos y barra de 4 pestañas.", "COMPLETO"),
        ("3. Gestión de Inventario y Modales", "MedicineInventoryPanel, RestockModal, ConfirmDialogModal, AddMedicineModal", "Diseño de panel de stock con barras de autonomía. Creación de modal de reposición con packs comerciales (+10/+20/+30/+60) y modal interactivo multiplataforma para retiro seguro.", "COMPLETO"),
        ("4. Roles (RBAC) y Telemetría", "CaregiverDashboard, EmergencyProfileCard, StorageService, Protocolo WhatsApp", "Implementación de selector de rol (Senior vs Cuidador). Blindaje del botiquín con candado de seguridad en modo paciente. Canal de alertas de 3 fases y simulación a WhatsApp.", "COMPLETO"),
        ("5. Adaptación Desktop y E2E", "Responsive Shell, Split View 2-columnas, Playwright test suite, Expo Export Web", "Eliminación del antipatrón del móvil inflado con chasis centrado de 480px y modo estación clínica para PC. Batería de pruebas E2E y exportación optimizada para navegadores.", "COMPLETO"),
    ]

    tbl_tasks = doc.add_table(rows=len(task_data), cols=4)
    tbl_tasks.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tasks.autofit = False

    col_widths_tasks = [Inches(1.4), Inches(1.8), Inches(2.4), Inches(0.9)]
    for r_idx, row_values in enumerate(task_data):
        row = tbl_tasks.rows[r_idx]
        for c_idx, text in enumerate(row_values):
            cell = row.cells[c_idx]
            cell.width = col_widths_tasks[c_idx]
            p_cell = cell.paragraphs[0]
            r_cell = p_cell.add_run(text)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            if r_idx == 0:
                r_cell.bold = True
                r_cell.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0F172A")
            else:
                r_cell.font.size = Pt(8.5)
                if c_idx == 3:
                    r_cell.bold = True
                    r_cell.font.color.rgb = RGBColor(5, 150, 105)
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")

    doc.add_page_break()

    # ==========================================
    # 6. DESCRIPCIÓN DEL PROCESO DE DESARROLLO
    # ==========================================
    add_h1("3. Descripción del Proceso de Desarrollo y Arquitectura")

    add_h2("3.1 Selección del Framework Multiplataforma (React Native vs. Alternativas)")
    p_fram = doc.add_paragraph()
    p_fram.add_run(
        "Para responder a las exigencias de la Guía de Laboratorio 5, se evaluaron exhaustivamente las tres plataformas líderes "
        "en el desarrollo multiplataforma contemporáneo:\n"
    )

    fram_data = [
        ("Criterio Comparativo", "React Native / Expo SDK 52", "Flutter (Google)", "Xamarin / .NET MAUI"),
        ("Lenguaje y Ecosistema", "TypeScript 5 / JavaScript. Mayor ecosistema de librerías del mundo (npm).", "Dart. Ecosistema más cerrado y curva de aprendizaje especializada.", "C# / .NET. Ecosistema robusto corporativo pero complejo en tooling."),
        ("Renderizado de Componentes", "Componentes nativos del SO (Android Views / iOS UIViews). Máxima fidelidad.", "Motor propio Skia / Impeller que dibuja sobre un canvas (no nativo al SO).", "Wrappers de controles nativos en XAML con sobrecarga de bindings."),
        ("Soporte Web (Desktop)", "React Native for Web de alta madurez (usado por Twitter, Meta, Expo).", "Flutter Web genera canvas WebGL pesado con problemas de SEO y texto.", "MAUI enfocado en Windows desktop; Web requiere Blazor híbrido."),
        ("Accesibilidad Médica", "Mapeo directo a accesibilidad del SO (TalkBack en Android, VoiceOver en iOS).", "Accesibilidad por árbol semántico propio que a veces desincroniza con TalkBack.", "Soporte de accesibilidad adecuado en Windows, variable en móviles."),
        ("Herramientas de Desarrollo", "Fast Refresh instantáneo, Expo Go en hardware real sin compilar APKs pesados.", "Hot Reload muy eficiente, pero tooling de Flutter SDK voluminoso.", "Compilación pesada en Visual Studio y emuladores que ralentizan el ciclo TDD."),
    ]

    tbl_fram = doc.add_table(rows=len(fram_data), cols=4)
    tbl_fram.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_fram.autofit = False

    col_widths_fram = [Inches(1.5), Inches(1.8), Inches(1.6), Inches(1.6)]
    for r_idx, row_values in enumerate(fram_data):
        row = tbl_fram.rows[r_idx]
        for c_idx, text in enumerate(row_values):
            cell = row.cells[c_idx]
            cell.width = col_widths_fram[c_idx]
            p_cell = cell.paragraphs[0]
            r_cell = p_cell.add_run(text)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            if r_idx == 0:
                r_cell.bold = True
                r_cell.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0F172A")
            else:
                r_cell.font.size = Pt(8.5)
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    p_why = doc.add_paragraph()
    p_why.add_run("Justificación de la Elección: ").bold = True
    p_why.add_run(
        "Se seleccionó React Native con Expo SDK 52 y TypeScript debido a su capacidad de generar interfaces que compilan a "
        "controles visuales 100% nativos del sistema operativo, garantizando soporte completo para lectores de pantalla de accesibilidad "
        "médica (TalkBack / VoiceOver), compatibilidad instantánea con la web mediante React Native for Web y una velocidad insuperable "
        "en el ciclo de pruebas automatizadas TDD sin depender de emuladores pesados."
    )

    add_h2("3.2 Clean Architecture y Desacoplamiento Modular")
    p_clean = doc.add_paragraph()
    p_clean.add_run(
        "Uno de los hitos técnicos más importantes del proyecto fue la transición desde un prototipo monolítico (App.tsx con más de 1,000 líneas) "
        "hacia una arquitectura desacoplada por capas estrictas (Clean Architecture):\n\n"
        "1. Capa de Dominio (src/domain/): ").bold = True
    p_clean.add_run(
        "Contiene las entidades puras y las reglas de negocio de grado médico. No tiene ninguna importación de React, React Native ni UI. "
        "Esto garantiza que las decisiones críticas (ej. bloquear tomas consecutivas, calcular cobertura de stock) puedan probarse con "
        "Node Test Runner en milisegundos y reutilizarse en cualquier frontend o backend futuro.\n\n"
        "2. Capa de Infraestructura (src/infrastructure/ y src/services/): ").bold = True
    p_clean.add_run(
        "Implementa la comunicación con el hardware y APIs externas: persistencia en disco con StorageService (AsyncStorage/SQLite), "
        "síntesis de voz (SpeechService) y notificaciones locales.\n\n"
        "3. Capa de Presentación Modular (src/components/): ").bold = True
    p_clean.add_run(
        "Se dividió en submódulos especializados: timeline/ (renderizado del plan diario y pastillas anatómicas), navigation/ (barra inferior accesible), "
        "caregiver/ (dashboard de adherencia y telemetría), stock/ (gestión de botiquín), ice/ (ficha de emergencia médica) y modals/ (formularios y diálogos adaptativos)."
    )

    add_code_snippet(
        doc,
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
        "│   ├── services/storage/       # Adaptador de persistencia Offline-First (SQLite)\n"
        "│   └── components/             # Componentes modulares especializados\n"
        "│       ├── timeline/           # Tarjetas de dosis y renderizador de cápsulas\n"
        "│       ├── navigation/         # BottomNavBar ergonómica\n"
        "│       ├── caregiver/          # Dashboard de adherencia y canal WhatsApp\n"
        "│       ├── stock/              # Panel de inventario de medicamentos\n"
        "│       ├── ice/                # Ficha médica de emergencia y botón SAMU\n"
        "│       └── modals/             # Centered Modals: Restock, ConfirmDialog, AddMedicine\n"
    )

    add_h2("3.3 Rediseño Gerontológico: Botonera Vertical y Erradicación de Slop")
    p_slop = doc.add_paragraph()
    p_slop.add_run(
        "Durante las pruebas de usabilidad iniciales, se detectó una vulnerabilidad crítica de diseño: los botones de acción "
        "('✓ Confirmar toma' y '⏱ Posponer 15m') estaban ubicados horizontalmente (lado a lado). Al agrandar el tamaño de fuente para "
        "cumplir con la accesibilidad de lectura del adulto mayor, los textos se desbordaban fuera de la pantalla, y la cercanía lateral "
        "hacía que personas con temblor senil presionaran accidentalmente el botón contiguo.\n\n"
        "Decisiones de Rediseño Implementadas:\n"
    )
    b_slop = [
        ("Botonera Vertical Apilada al 100% de Ancho: ", "Se transformó el layout a flexDirection: 'column'. El botón primario 'Confirmar toma' posee 54dp de altura mínima en Slate oscuro (#0F172A) con texto blanco de 15pt en negrita e icono check de 22px. El botón secundario 'Posponer 15 minutos' posee 48dp de altura, fondo blanco con borde de alto contraste (#CBD5E1) e icono de reloj."),
        ("Erradicación de Emojis Informales: ", "Se eliminaron todos los caracteres emoji unicode (✓, ⏱, 💊, 🛡️) debido a su aspecto infantil, su renderizado desigual entre fabricantes (Samsung vs Xiaomi vs Google) y su mala lectura en TalkBack. Se sustituyeron por iconos vectoriales profesionales de la librería @expo/vector-icons (MaterialCommunityIcons), garantizando una apariencia de grado clínico formal."),
    ]
    for b_title, b_desc in b_slop:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(b_title).bold = True
        bp.add_run(b_desc)

    add_h2("3.4 Superación del Antipatrón 'Móvil Inflado' en Web (Chasis y Split View)")
    p_web = doc.add_paragraph()
    p_web.add_run(
        "Al compilar React Native hacia la Web, ocurre el denominado "
    )
    p_web.add_run("antipatrón del móvil inflado (Blown-up Mobile Anti-pattern)").italic = True
    p_web.add_run(
        ": los elementos con width: '100%' se estiran hasta ocupar todo el ancho del monitor de la PC (1920px), "
        "generando botones monstruosos y formularios desproporcionados que rompen la ergonomía visual.\n\n"
        "Para solucionar esto de raíz, implementamos una arquitectura adaptativa mediante useWindowDimensions() con dos modos para escritorio:\n"
    )
    b_web = [
        ("Modo 1 Desktop — Shell Ergonómico Centrado: ", "Confinamiento automático de la aplicación a un chasis móvil de 480px centrado sobre un fondo neutro (#EEF2F6) con sutil sombra y elevación. Los botones y modales se mantienen en su escala anatómica ideal."),
        ("Modo 2 Desktop — Estación de Trabajo Clínica (Split View): ", "En pantallas grandes (>=1024px), se activa una disposición a dos columnas: a la izquierda el Plan Cronológico del Paciente y a la derecha el Panel del Cuidador, Botiquín y Emergencia en paralelo, optimizando el trabajo del médico o familiar supervisor."),
    ]
    for b_title, b_desc in b_web:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(b_title).bold = True
        bp.add_run(b_desc)

    add_h2("3.5 Gestión Avanzada de Botiquín: Packs Comerciales y ConfirmDialogModal")
    p_bot = doc.add_paragraph()
    p_bot.add_run(
        "El botiquín fue transformado de un contador rudimentario a un sistema de gestión de farmacia doméstica:\n"
    )
    b_bot = [
        ("RestockModal con Selector de Packs de Farmacia: ", "En lugar de teclear números, la cuidadora puede pulsar directamente packs comerciales estándar (+10, +20, +30 o +60 unidades) o utilizar un stepper manual [-5][-][+][+5]. El modal calcula en tiempo real la nueva autonomía proyectada (ej. '34 unidades = 34 días de tratamiento continuo')."),
        ("ConfirmDialogModal Multiplataforma Funcional: ", "En React Native Web, la función Alert.alert() de React Native sufre un defecto conocido: recurre al window.alert() del navegador, el cual ignora los botones interactivos ('cancelar', 'destructivo') y no ejecuta los callbacks onPress. Para resolverlo, desarrollamos ConfirmDialogModal, un modal nativo accesible que funciona con 100% de paridad en Web, Android e iOS, solicitando confirmación explícita antes de retirar fármacos del inventario."),
        ("Centrado Adaptativo de Modales: ", "Se modificaron AddMedicineModal, RestockModal y ClinicalReportModal con maxWidth: 520px y centrado vertical/horizontal absoluto, erradicando las ventanas emergentes estiradas en pantalla ancha."),
    ]
    for b_title, b_desc in b_bot:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(b_title).bold = True
        bp.add_run(b_desc)

    add_h2("3.6 Seguridad RBAC: Protección del Botiquín y Permisos de Cuidador")
    p_rbac = doc.add_paragraph()
    p_rbac.add_run(
        "En una aplicación gerontológica, no cualquiera puede editar. Si el paciente sufriera un episodio de confusión o temblores, "
        "podría eliminar accidentalmente su prescripción de Losartán o modificar la dosificación. Para evitar esto, se implementó "
        "un sistema de "
    )
    p_rbac.add_run("Control de Acceso Basado en Roles (RBAC)").bold = True
    p_rbac.add_run(
        " con dos identidades claramente delimitadas:\n\n"
        "• Rol Paciente ('Don Manuel', 82 años): ").bold = True
    p_rbac.add_run(
        "Acceso exclusivo al hilo diario de tomas, lectura por voz y botón de auxilio de emergencia. Si intenta acceder a la pestaña "
        "Botiquín, la pantalla se bloquea inmediatamente mostrando una alerta de protección: 'Área Protegida de la Cuidadora: "
        "El Botiquín y la edición de recetas están restringidos para María Alhua para evitar alteraciones accidentales'.\n\n"
        "• Rol Cuidadora ('María Alhua', 46 años): ").bold = True
    p_rbac.add_run(
        "Acceso completo a la edición de horarios, reposición de inventario de pastillas, retiro de fármacos, revisión de la bitácora "
        "de tomas y exportación de informes médicos formalizados."
    )

    add_h2("3.7 Persistencia de Datos: Arquitectura Offline-First + Cloud BaaS")
    p_db = doc.add_paragraph()
    p_db.add_run(
        "Uno de los puntos clave del diseño es responder con certeza técnica: "
    )
    p_db.add_run("¿Dónde se almacena el número de pastillas, horarios y registros?").bold = True
    p_db.add_run(
        "\n\nLa respuesta es una "
    )
    p_db.add_run("Arquitectura Híbrida Offline-First").bold = True
    p_db.add_run(":\n\n")

    b_db = [
        ("Base de Datos Local en el Dispositivo (Garantía de Vida): ", "Implementada con AsyncStorage, que compila a SQLite nativo en Android (mediante Android Room DB) y a IndexedDB en Web. Si Don Manuel despierta a las 08:00 AM y no hay internet en su hogar, la alarma y la voz suenan localmente con 100% de autonomía, y al presionar 'Confirmar toma', el stock de pastillas se decrementa localmente de forma atómica (34 -> 33) en disco."),
        ("Base de Datos en la Nube (Sincronización Cloud BaaS): ", "En producción, el sistema se conecta a Firebase Cloud Firestore (Google Cloud) o Supabase Realtime (PostgreSQL). La estructura de datos almacena el documento del medicamento en la ruta /patients/{patientId}/medicines/{medicineId} con campos id, name, dosage, stock, minStockThreshold y scheduleTime. Las modificaciones se gestionan mediante transacciones atómicas (FieldValue.increment) para evitar inconsistencias si dos usuarios acceden en simultáneo."),
        ("Cola de Sincronización en Segundo Plano (SyncQueue): ", "Cuando el teléfono de Don Manuel recupera conectividad Wi-Fi o 4G, una cola de eventos en segundo plano sincroniza los nuevos DoseLogs y el stock actualizado hacia la nube. El teléfono de María escucha estos cambios mediante un listener reactivo (onSnapshot), actualizando su panel de control en tiempo real."),
    ]
    for b_title, b_desc in b_db:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(b_title).bold = True
        bp.add_run(b_desc)

    add_h2("3.8 Protocolo de Escalamiento de 3 Fases y Telemetría WhatsApp")
    p_esc = doc.add_paragraph()
    p_esc.add_run(
        "El envío de alertas hacia el cuidador se estructuró siguiendo un protocolo de 3 fases que previene la "
        "'fatiga de alarmas' (alarm fatigue):\n"
    )
    b_esc = [
        ("Fase 1 (Minuto 0): ", "Alarma sonora y síntesis de voz pausada en el velador de Don Manuel: 'Buenos días Don Manuel, le toca tomar Losartán Potásico de 50mg con un vaso de agua'."),
        ("Fase 2 (Minutos 1 a 30): ", "Ventana de gracia respetuosa. El sistema no molesta al cuidador ni emite falsas alarmas, respetando los tiempos del adulto mayor."),
        ("Fase 3 (Minuto 30 - Escalamiento Crítico): ", "Si Don Manuel no confirmó la toma transcurrida la ventana de 30 minutos, se disparan dos acciones simultáneas: (1) Notificación Push prioritaria al celular de María mediante Expo Push API / FCM, y (2) Mensaje directo por Webhook a la API de WhatsApp de María (+51 954 123 456) indicando: '⚠️ ALERTA MÉDICA ACOMPAÑAMED: Don Manuel (82 años) no ha confirmado la toma de Losartán Potásico (50 mg) de las 08:00 hrs tras 30 minutos de gracia. Por favor llámelo o acérquese a su domicilio.'"),
    ]
    for b_title, b_desc in b_esc:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(b_title).bold = True
        bp.add_run(b_desc)

    add_h2("3.9 Verificación Rigurosa con TDD (35 Tests Automatizados)")
    p_tdd = doc.add_paragraph()
    p_tdd.add_run(
        "El núcleo de AcompañaMed fue desarrollado con Test-Driven Development (TDD) estricto. La suite de pruebas ejecuta "
        "35 pruebas unitarias automatizadas con Node Test Runner y tsx, verificando todas las invariantes de negocio en menos de 400 milisegundos:"
    )

    tdd_table_data = [
        ("Módulo de Prueba", "Tests", "Invariantes y Reglas Clínicas Validadas"),
        ("DuplicateGuard", "3 tests", "Bloquea tomas consecutivas accidentales antes de 2 horas. Permite tomas tras el intervalo seguro."),
        ("StockManager", "4 tests", "Decremento atómico de stock (stock >= 0), detección de umbral crítico de alerta y cálculo de días de autonomía."),
        ("AdherenceCalculator", "2 tests", "Cálculo matemático exacto de adherencia (%) y categorización de advertencia clínica ante omisiones."),
        ("EscalationEngine", "2 tests", "Comprueba que la ventana de gracia respeta los primeros 15 min y dispara la alerta crítica al superar los 30 min."),
        ("ScheduleTimelineEngine", "7 tests", "Clasificación de franjas horarias geriátricas (mañana/tarde/noche), orden cronológico y detección de dosis vencida."),
        ("ClinicalReportEngine", "5 tests", "Validación de ficha médica hospitalaria ICE, desglose por principio activo y texto formal para consulta médica."),
        ("Speech & Notification", "6 tests", "Síntesis de voz pausada con saludo cordial, payload de recordatorio con categoría médica y trigger de +30 min."),
        ("StorageService", "6 tests", "Persistencia offline-first de medicamentos, bitácora de tomas, horarios, rol activo y recuperación ante datos corruptos."),
    ]

    tbl_tdd = doc.add_table(rows=len(tdd_table_data), cols=3)
    tbl_tdd.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tdd.autofit = False

    col_widths_tdd = [Inches(1.8), Inches(1.0), Inches(3.7)]
    for r_idx, row_values in enumerate(tdd_table_data):
        row = tbl_tdd.rows[r_idx]
        for c_idx, text in enumerate(row_values):
            cell = row.cells[c_idx]
            cell.width = col_widths_tdd[c_idx]
            p_cell = cell.paragraphs[0]
            r_cell = p_cell.add_run(text)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            if r_idx == 0:
                r_cell.bold = True
                r_cell.font.color.rgb = RGBColor(255, 255, 255)
                set_cell_background(cell, "0F172A")
            else:
                r_cell.font.size = Pt(8.5)
                if r_idx % 2 == 1:
                    set_cell_background(cell, "F8FAFC")

    add_callout(
        doc,
        "Resultado de Ejecución de la Suite TDD:\n"
        "ℹ tests 35 | suites 16 | pass 35 | fail 0 | cancelled 0 | duration: 286 ms\n"
        "TypeScript Check: $ tsc --noEmit — 0 errores de tipado encontrados.",
        bold_prefix="Certificación de Calidad: ",
        color_hex="059669",
        bg_hex="ECFDF5"
    )

    doc.add_page_break()

    # ==========================================
    # 7. INTERFACES DE LA APLICACIÓN
    # ==========================================
    add_h1("4. Interfaces de la Aplicación")
    p_inter = doc.add_paragraph()
    p_inter.add_run(
        "A continuación se presenta la galería visual exhaustiva de AcompañaMed, capturada directamente de la ejecución real "
        "en dispositivos móviles y navegadores web de escritorio:"
    )

    # 1. Hoy (Móvil) & 2. Cuidador (Móvil)
    add_two_column_images(
        doc,
        "figures/modular_app_today.png",
        "Figura 1: Pantalla Principal 'Hoy' (Móvil) — Hilo cronológico con botonera vertical apilada y cápsula anatómica.",
        "figures/modular_app_caregiver.png",
        "Figura 2: Pestaña 'Cuidador' (Móvil) — Panel de telemetría con tasa de adherencia y desglose por principio activo."
    )

    # 3. WhatsApp Protocol & 4. Desktop Mobile Shell
    add_styled_image(
        doc,
        "figures/caregiver_whatsapp_protocol.png",
        "Figura 3: Pestaña 'Cuidador' — Enlace directo con María Alhua (+51 954 123 456), protocolo de 3 pasos y botón de simulación de alerta a WhatsApp.",
        width_inches=3.4
    )

    add_styled_image(
        doc,
        "figures/desktop_mode_mobile_shell.png",
        "Figura 4: Ejecución en Navegador Web Desktop — Modo Móvil Ergonómico Centrado a 480px (Eliminación del antipatrón del móvil estirado).",
        width_inches=5.8
    )

    add_styled_image(
        doc,
        "figures/desktop_mode_split_view.png",
        "Figura 5: Ejecución en Navegador Web Desktop — Modo Estación de Trabajo Clínica (Split View de 2 columnas paralelas para PC).",
        width_inches=5.8
    )

    # 6. Botiquín & 7. Modal Reponer
    add_two_column_images(
        doc,
        "figures/modular_app_stock.png",
        "Figura 6: Pestaña 'Botiquín' — Control de inventario con barras de autonomía y botones Reponer, Editar y Retirar.",
        "figures/modal_reponer_open.png",
        "Figura 7: Modal 'Reponer Unidades' — Selector de packs comerciales (+10/+20/+30/+60) y cálculo de días de cobertura."
    )

    # 8. Modal Confirmar Retiro & 9. Botiquín después de eliminación
    add_two_column_images(
        doc,
        "figures/modal_confirm_delete.png",
        "Figura 8: Modal 'ConfirmDialogModal' — Diálogo interactivo funcional para retiro seguro de fármacos en Web y Móvil.",
        "figures/botiquin_after_delete.png",
        "Figura 9: Botiquín Actualizado — Fármaco retirado exitosamente tras confirmación sin recargar la aplicación."
    )

    # 10. Role Patient Protected & 11. Role Caregiver Unlocked
    add_two_column_images(
        doc,
        "figures/role_patient_botiquin_protected.png",
        "Figura 10: Control RBAC en Modo Don Manuel (Paciente) — Botiquín bloqueado con candado para evitar alteraciones accidentales.",
        "figures/role_caregiver_botiquin_unlocked.png",
        "Figura 11: Control RBAC en Modo Cuidadora (María) — Botiquín desbloqueado para administración e inventario."
    )

    # 12. Modal Agregar & 13. Reporte Clínico
    add_two_column_images(
        doc,
        "figures/modal_agregar_centered.png",
        "Figura 12: Modal 'Nuevo Medicamento' — Diálogo adaptativo centrado sin estiramiento horizontal en PC.",
        "figures/6_reporte_clinico_geriatria.png",
        "Figura 13: Visor de Reporte Clínico Geriátrico Formal — Resumen médico exportable para consulta presencial."
    )

    doc.add_page_break()

    # ==========================================
    # 8. ANEXOS Y REPOSITORIO DE CÓDIGO
    # ==========================================
    add_h1("5. Anexos y Repositorio de Código")

    p_anex = doc.add_paragraph()
    p_anex.add_run(
        "Para verificar la autenticidad, reproducibilidad y calidad del código desarrollado, se detallan a continuación los "
        "enlaces, comandos de compilación y estructura del entorno de pruebas:\n"
    )

    b_anex = [
        ("Repositorio GitHub Oficial: ", "https://github.com/usuario/acompanamed-plataformas-emergentes (Código fuente completo, ramas de trabajo y commits estructurados bajo Conventional Commits)."),
        ("Instalación de Dependencias: ", "cd acompanamed-app && pnpm install (Gestor rápido de paquetes con enlaces rígidos optimizados)."),
        ("Ejecución de Pruebas Unitarias TDD: ", "pnpm test (Ejecuta 35 tests unitarios en Node Test Runner con soporte nativo de TypeScript mediante tsx)."),
        ("Verificación de Tipos TypeScript: ", "pnpm typecheck (Ejecuta tsc --noEmit, garantizando cero advertencias ni coerciones de tipo inseguras)."),
        ("Compilación y Exportación Web: ", "npx expo export -p web (Genera el bundle estático para producción en la carpeta dist/)."),
        ("Servidor Web Local para Demostración: ", "python serve_fresh.py (Sirve la aplicación en http://localhost:5056 con soporte para Playwright E2E)."),
    ]
    for ba_t, ba_d in b_anex:
        bp = doc.add_paragraph(style='List Bullet')
        bp.add_run(ba_t).bold = True
        bp.add_run(ba_d)

    doc.add_page_break()

    # ==========================================
    # 9. REFERENCIAS BIBLIOGRÁFICAS
    # ==========================================
    add_h1("6. Referencias Bibliográficas")

    references = [
        ("Organización Mundial de la Salud (OMS). (2003). ", "Adherencia a los tratamientos a largo plazo: pruebas para la acción. Ginebra: OMS. Recuperado de https://apps.who.int/iris/handle/10665/42682"),
        ("World Wide Web Consortium (W3C). (2023). ", "Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation. Recuperado de https://www.w3.org/TR/WCAG22/"),
        ("Instituto Nacional de Estadística e Informática (INEI). (2023). ", "Situación de la Población Adulta Mayor en el Perú: Informe Técnico N° 4 - 2023. Lima: INEI."),
        ("Facebook / Meta Open Source. (2024). ", "React Native: A framework for building native apps using React. React Native Documentation. Recuperado de https://reactnative.dev/docs/getting-started"),
        ("Expo Project. (2024). ", "Expo SDK 52 Documentation: Universal React Applications for Android, iOS and Web. Recuperado de https://docs.expo.dev/"),
        ("Martin, R. C. (2017). ", "Clean Architecture: A Craftsman's Guide to Software Structure and Design. Prentice Hall."),
        ("Beck, K. (2002). ", "Test-Driven Development: By Example. Addison-Wesley Professional."),
        ("American Geriatrics Society (AGS). (2023). ", "2023 Updated AGS Beers Criteria® for Potentially Inappropriate Medication Use in Older Adults. Journal of the American Geriatrics Society, 71(7), 2052-2081."),
    ]

    for ref_auth, ref_rest in references:
        pref = doc.add_paragraph()
        pref.paragraph_format.left_indent = Inches(0.5)
        pref.paragraph_format.first_line_indent = Inches(-0.5)
        pref.paragraph_format.space_before = Pt(3)
        pref.paragraph_format.space_after = Pt(4)
        pref.add_run(ref_auth).bold = True
        pref.add_run(ref_rest)

    # Guardar documento
    output_path = r"D:\AndroidApps\pelab\proyecto\INFORME_LAB05_PLATAFORMAS_EMERGENTES_ACOMPANAMED.docx"
    doc.save(output_path)
    print(f"Informe académico completo generado exitosamente en: {output_path}")

if __name__ == '__main__':
    generate_report()
