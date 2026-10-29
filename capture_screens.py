import os
import time
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

PORT = 5056
DIRECTORY = os.path.abspath('acompanamed-app/dist')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving dist at http://localhost:{PORT}")
            httpd.serve_forever()
    except Exception as e:
        print(f"Server info: {e}")

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(1)

os.makedirs('figures', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    context = browser.new_context(
        viewport={'width': 412, 'height': 892},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()
    page.goto(f"http://localhost:{PORT}/index.html")
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # 1. Tab Hoy - Hilo del día con Losartán expandido
    print("Capturing 1. Hoy - Hilo del día (Losartán expandido)...")
    page.screenshot(path="figures/1_modo_senior_manana.png")

    # 2. Tab Hoy - Metformina expandida (Cápsula realista)
    print("Capturing 2. Hoy - Metformina expandida...")
    page.click("text=Metformina")
    time.sleep(0.6)
    page.screenshot(path="figures/2_modo_senior_tarde.png")

    # 3. Tab Emergencia - Ficha ICE directa
    print("Capturing 3. Tab Emergencia (Ficha ICE)...")
    page.click("text=Emergencia")
    time.sleep(0.6)
    page.screenshot(path="figures/3_ficha_emergencia_ice.png")

    # 4. Tab Cuidador - Telemetría y Adherencia
    print("Capturing 4. Tab Cuidador (Dashboard)...")
    page.click("text=Cuidador")
    time.sleep(0.6)
    page.screenshot(path="figures/4_modo_cuidador_dashboard.png")

    # 5. Tab Botiquín - Modal Nuevo Medicamento
    print("Capturing 5. Tab Botiquín y Modal...")
    page.click("text=Botiquín")
    time.sleep(0.6)
    page.click("text=Agregar")
    time.sleep(0.6)
    page.screenshot(path="figures/5_modal_nuevo_medicamento.png")

    # Cerrar modal recargando
    page.goto(f"http://localhost:{PORT}/index.html")
    page.wait_for_load_state("networkidle")
    time.sleep(1)

    # 6. Reporte Clínico Formal
    print("Capturing 6. Reporte Clínico Formal...")
    page.click("text=Cuidador")
    time.sleep(0.6)
    page.click("text=Generar Informe Completo")
    time.sleep(0.6)
    page.screenshot(path="figures/6_reporte_clinico_geriatria.png")

    browser.close()
    print("All AcompañaMed screenshots captured successfully!")
