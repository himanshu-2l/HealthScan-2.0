import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5174"
OUTPUT_DIR = "scripts/screenshots"

ROUTES = [
    {"name": "today_mobile", "path": "/", "width": 390, "height": 844, "onboarded": True},
    {"name": "today_desktop", "path": "/", "width": 1280, "height": 800, "onboarded": True},
    {"name": "labs_tab", "path": "/app?tab=labs", "width": 390, "height": 844, "onboarded": True},
    {"name": "care_tab", "path": "/app?tab=care", "width": 390, "height": 844, "onboarded": True},
    {"name": "records_tab", "path": "/app?tab=records", "width": 390, "height": 844, "onboarded": True},
    {"name": "diabetes_page", "path": "/diabetes", "width": 390, "height": 844, "onboarded": True},
    {"name": "bp_tracker_page", "path": "/bp-tracker", "width": 390, "height": 844, "onboarded": True},
    {"name": "symptom_checker_page", "path": "/symptom-checker", "width": 390, "height": 844, "onboarded": True},
    {"name": "period_tracker_page", "path": "/period-tracker", "width": 390, "height": 844, "onboarded": True},
    {"name": "emergency_contacts_page", "path": "/emergency-contacts", "width": 390, "height": 844, "onboarded": True},
    {"name": "smartwatch_page", "path": "/smartwatch", "width": 390, "height": 844, "onboarded": True},
    {"name": "vaccination_page", "path": "/vaccinations", "width": 390, "height": 844, "onboarded": True},
    {"name": "health_predictions_page", "path": "/health-predictions", "width": 390, "height": 844, "onboarded": True},
    {"name": "patient_profile_page", "path": "/profile", "width": 390, "height": 844, "onboarded": True},
    {"name": "doctor_report_page", "path": "/doctor-report", "width": 390, "height": 844, "onboarded": True},
    {"name": "device_model_page", "path": "/device-model", "width": 390, "height": 844, "onboarded": True},
    {"name": "hardware_page", "path": "/hardware", "width": 390, "height": 844, "onboarded": True},
    {"name": "about_page", "path": "/about", "width": 390, "height": 844, "onboarded": True},
    {"name": "purpose_page", "path": "/purpose", "width": 390, "height": 844, "onboarded": True},
]

def capture_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for route in ROUTES:
            name = route["name"]
            path = route["path"]
            w = route["width"]
            h = route["height"]
            page = browser.new_page(viewport={"width": w, "height": h})
            try:
                page.goto(f"{BASE_URL}{path}", timeout=20000)
                if route.get("onboarded"):
                    page.evaluate("() => localStorage.setItem('healthscan_onboarded', 'true')")
                    page.reload()
                page.wait_for_timeout(1500)
                out_path = os.path.join(OUTPUT_DIR, f"{name}.png")
                page.screenshot(path=out_path, full_page=False)
                print(f"[OK] Captured {name} -> {out_path}")
            except Exception as e:
                print(f"[FAIL] {name}: {e}")
            finally:
                page.close()
        browser.close()

if __name__ == "__main__":
    capture_all()
