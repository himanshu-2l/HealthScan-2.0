import os
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "scripts/screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    
    # 1. Desktop Mega Menu
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto("http://localhost:5174/", timeout=20000)
    page.evaluate("() => localStorage.setItem('healthscan_onboarded', 'true')")
    page.reload()
    page.wait_for_timeout(1000)
    more_btn = page.locator("button:has-text('More')")
    if more_btn.is_visible():
        more_btn.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{OUTPUT_DIR}/desktop_mega_menu.png")
        print("[OK] desktop_mega_menu.png")

    # 2. Desktop Profile Dropdown
    page.reload()
    page.wait_for_timeout(1000)
    profile_btn = page.locator("button[aria-label='User account menu']")
    if profile_btn.is_visible():
        profile_btn.click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{OUTPUT_DIR}/desktop_profile_menu.png")
        print("[OK] desktop_profile_menu.png")
    page.close()

    # 3. Mobile Drawer
    page_m = browser.new_page(viewport={"width": 390, "height": 844})
    page_m.goto("http://localhost:5174/", timeout=20000)
    page_m.evaluate("() => localStorage.setItem('healthscan_onboarded', 'true')")
    page_m.reload()
    page_m.wait_for_timeout(1000)
    menu_btn = page_m.locator("button[aria-label='Open mobile navigation menu']")
    if menu_btn.is_visible():
        menu_btn.click()
        page_m.wait_for_timeout(600)
        page_m.screenshot(path=f"{OUTPUT_DIR}/mobile_drawer.png")
        print("[OK] mobile_drawer.png")
    page_m.close()

    # 4. Subpage Header Modules Jump
    page_sub = browser.new_page(viewport={"width": 1280, "height": 800})
    page_sub.goto("http://localhost:5174/diabetes", timeout=20000)
    page_sub.evaluate("() => localStorage.setItem('healthscan_onboarded', 'true')")
    page_sub.reload()
    page_sub.wait_for_timeout(1000)
    mod_btn = page_sub.locator("button[aria-label='Quick Jump to other health modules']")
    if mod_btn.is_visible():
        mod_btn.click()
        page_sub.wait_for_timeout(600)
        page_sub.screenshot(path=f"{OUTPUT_DIR}/subpage_modules_menu.png")
        print("[OK] subpage_modules_menu.png")
    page_sub.close()

    # 5. QR Code Modal (Tunnel and Wi-Fi tabs)
    page_qr = browser.new_page(viewport={"width": 1280, "height": 800})
    page_qr.goto("http://localhost:5174/", timeout=20000)
    page_qr.evaluate("() => localStorage.setItem('healthscan_onboarded', 'true')")
    page_qr.reload()
    page_qr.wait_for_timeout(1000)
    qr_btn = page_qr.locator("button:has-text('Test on Phone')")
    if qr_btn.is_visible():
        qr_btn.click()
        page_qr.wait_for_timeout(600)
        page_qr.screenshot(path=f"{OUTPUT_DIR}/qr_modal_tunnel.png")
        print("[OK] qr_modal_tunnel.png")
        
        wifi_btn = page_qr.locator("button:has-text('Local Wi-Fi')")
        if wifi_btn.is_visible():
            wifi_btn.click()
            page_qr.wait_for_timeout(600)
            page_qr.screenshot(path=f"{OUTPUT_DIR}/qr_modal_wifi.png")
            print("[OK] qr_modal_wifi.png")
    page_qr.close()

    browser.close()
