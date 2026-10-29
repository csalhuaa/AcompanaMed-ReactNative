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

    # 1. Modo Senior - Mañana
    print("Capturing 1. Modo Senior - Mañana...")
    page.screenshot(path="figures/1_modo_senior_manana.png")

    # 2. Modo Senior - Tarde
    print("Capturing 2. Modo Senior - Tarde...")
    page.click("text=Tarde")
    time.sleep(0.5)
    page.screenshot(path="figures/2_modo_senior_tarde.png")

    # 3. Ficha Médica de Emergencia (ICE)
    print("Capturing 3. Ficha Médica de Emergencia (ICE)...")
    page.click("text=VER MI FICHA MÉDICA DE EMERGENCIA (ICE)")
    time.sleep(0.8)
    page.screenshot(path="figures/3_ficha_emergencia_ice.png")

    # Close modal by reloading
    page.goto(f"http://localhost:{PORT}/index.html")
    page.wait_for_load_state("networkidle")
    time.sleep(1)

    # 4. Modo Cuidador - Dashboard
    print("Capturing 4. Modo Cuidador...")
    page.click("text=Modo Cuidador")
    time.sleep(0.8)
    page.screenshot(path="figures/4_modo_cuidador_dashboard.png")

    # 5. Modo Cuidador - Modal Nuevo Medicamento
    print("Capturing 5. Modal Nuevo Medicamento...")
    page.click("text=Agregar")
    time.sleep(0.8)
    page.screenshot(path="figures/5_modal_nuevo_medicamento.png")

    # Close modal by reloading and returning to caregiver mode
    page.goto(f"http://localhost:{PORT}/index.html")
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    page.click("text=Modo Cuidador")
    time.sleep(0.5)

    # 6. Modo Cuidador - Reporte Clínico
    print("Capturing 6. Reporte Clínico Formal...")
    page.click("text=Generar Informe Completo")
    time.sleep(0.8)
    page.screenshot(path="figures/6_reporte_clinico_geriatria.png")

    browser.close()
    print("All AcompañaMed screenshots captured successfully!")
