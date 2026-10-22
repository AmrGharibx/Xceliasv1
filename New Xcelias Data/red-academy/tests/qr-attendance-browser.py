"""Browser acceptance tests for QR trainee device linking.

Runs the actual public page against a disposable static server and a mocked
attendance API. No Academy database or live trainee data is opened.
"""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import re
import threading

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BATCH_QR_ID = "Batch44QrReference_0123456789"
OTHER_BATCH_QR_ID = "Batch45QrReference_0123456789"
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


class ApiStub:
    def __init__(self):
        self.calls = []
        self.link_status = {"status": "pending"}
        self.fail_next_link_response = False
        self.next_link_error = None

    def reset(self):
        self.calls.clear()
        self.link_status = {"status": "pending"}
        self.fail_next_link_response = False
        self.next_link_error = None

    def install(self, context):
        def handle(route):
            request = route.request
            path = request.url.split("?", 1)[0]
            body = json.loads(request.post_data or "{}")
            self.calls.append({"path": path, "body": body})

            if path.endswith("/public/info"):
                route.fulfill(
                    status=200,
                    json={
                        "batchName": "Batch 44",
                        "currentSession": {"dayNumber": 5, "date": "2026-10-22"},
                        "participant": {
                            "checkedIn": False,
                            "recordedElsewhere": False,
                            "active": True,
                        },
                    },
                )
            elif path.endswith("/public/device-link-requests"):
                if self.next_link_error:
                    error = self.next_link_error
                    self.next_link_error = None
                    route.fulfill(status=error["status"], json=error["body"])
                    return
                if self.fail_next_link_response:
                    self.fail_next_link_response = False
                    route.fulfill(status=502, json={"error": "The request could not be confirmed. Try again."})
                    return
                route.fulfill(
                    status=201,
                    json={"status": "pending", "requestHandle": body.get("requestHandle")},
                )
            elif path.endswith("/public/device-link-status"):
                result = self.link_status
                route.fulfill(status=200, json=result)
            elif path.endswith("/public/challenge"):
                route.fulfill(
                    status=200,
                    json={"challengeId": "challenge-test-id", "challenge": "signed-checkin-challenge"},
                )
            elif path.endswith("/public/check-in"):
                route.fulfill(status=200, json={"ok": True})
            else:
                route.fulfill(status=410, json={"error": "This attendance link is no longer available."})

        context.route("**/api/qr-attendance/public/**", handle)

    def calls_for(self, suffix):
        return [call for call in self.calls if call["path"].endswith(suffix)]


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def open_batch(browser, base_url, api, viewport=(1280, 900), legacy_records=None, disable_web_locks=False):
    context = browser.new_context(
        viewport={"width": viewport[0], "height": viewport[1]},
        reduced_motion="reduce",
        permissions=["geolocation"],
        geolocation={"latitude": 30.0444, "longitude": 31.2357},
    )
    if disable_web_locks:
        context.add_init_script("Object.defineProperty(Navigator.prototype, 'locks', {configurable: true, get: () => undefined})")
    api.install(context)
    page = context.new_page()
    page.set_default_timeout(8000)
    if legacy_records is not None:
        page.goto(f"{base_url}/training-academy-logo.svg")
        page.evaluate(
            """async (records) => {
              const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open('red-academy-qr-attendance-v1', 1);
                request.onupgradeneeded = () => request.result.createObjectStore('enrollments', {keyPath: 'batchQrId'});
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
              const keyPair = await crypto.subtle.generateKey(
                {name: 'ECDSA', namedCurve: 'P-256'}, true, ['sign', 'verify']
              );
              await new Promise((resolve, reject) => {
                const tx = db.transaction('enrollments', 'readwrite');
                for (const record of records) tx.objectStore('enrollments').put({...record, privateKey: keyPair.privateKey});
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
              });
              db.close();
            }""",
            legacy_records,
        )
    page.goto(f"{base_url}/qr-attendance/#/batch/{BATCH_QR_ID}")
    page.locator("#page-title").wait_for(state="visible")
    page.wait_for_function("document.querySelector('#page-title')?.textContent === 'Batch 44'")
    return context, page


def wait_until_approved(page, api):
    api.link_status = {
        "status": "approved",
        "credentialId": "approved-credential-44",
        "traineeName": "Ahmed Approved",
    }
    page.wait_for_function(
        "document.querySelector('#trainee-name')?.textContent === 'Ahmed Approved'",
        timeout=10000,
    )


def run_checks(browser, base_url, api):
    # Phone submission must create a generic pending request, never an enrollment.
    api.reset()
    context, page = open_batch(browser, base_url, api)
    require(page.locator("#verification-kind").is_visible(), "Phone/code selection is missing")
    require(page.locator("#verification-value").is_visible(), "Verification input is missing")
    require("Your exact location is checked securely and is not stored" in page.locator("#location-notice").inner_text(), "Existing precise-location notice was changed")
    require("Hosting and security systems may process connection metadata" in page.locator("#connection-privacy-note").inner_text(), "Connection-metadata privacy note is missing")
    page.locator("#verification-kind").select_option("phone")
    page.locator("#verification-value").fill("+20 10 1234 5678")
    page.locator("#link-device-button").click()
    page.locator("#pending-state").wait_for(state="visible")
    request = api.calls_for("/public/device-link-requests")[-1]
    require(request["body"].get("phone") == "+20 10 1234 5678", "Phone was not sent as the selected verification")
    require(re.fullmatch(r"[A-Za-z0-9_-]{43}", request["body"].get("requestHandle", "")) is not None, "Client did not persist a valid idempotency handle")
    require("activationCode" not in request["body"], "Request included both phone and recovery code")
    require(set(request["body"]["publicKey"]) == {"kty", "crv", "x", "y"}, "Public P-256 key was not sanitized")
    require(request["body"]["publicKey"].get("crv") == "P-256", "Device key is not P-256")
    require(page.locator("#pending-state").inner_text().lower().find("waiting") >= 0, "Generic waiting state is missing")
    require(not page.locator("#trainee-name").is_visible(), "Trainee identity leaked before approval")
    require(not page.locator("#check-in-button").is_visible(), "Check-in is available while pending")
    require(not api.calls_for("/public/enroll"), "Legacy direct-enroll endpoint was called")
    require(not api.calls_for("/public/challenge") and not api.calls_for("/public/check-in"), "Pending request attempted attendance")
    status = api.calls_for("/public/device-link-status")
    require(bool(status), "Pending request did not start status polling")
    poll = status[-1]["body"]
    require(poll.get("requestHandle") == request["body"].get("requestHandle"), "Status poll did not use the opaque persisted handle")
    require(re.fullmatch(r"[A-Za-z0-9_-]{43}", poll.get("requestHandle", "")) is not None, "Mock request handle does not match the Edge base64url contract")
    require(re.fullmatch(r"[A-Za-z0-9_-]{86}", poll.get("signature", "")) is not None, "Status poll signature is not base64url P-256 P1363")
    print("PASS: phone request waits generically, with a sanitized key and no trainee/check-in leak")
    context.close()

    # Two open tabs share one IndexedDB identity and serialize request submission.
    for lock_mode, disable_web_locks in (("Web Locks", False), ("IndexedDB fallback", True)):
        api.reset()
        context, first_tab = open_batch(browser, base_url, api, disable_web_locks=disable_web_locks)
        second_tab = context.new_page()
        second_tab.set_default_timeout(8000)
        second_tab.goto(f"{base_url}/qr-attendance/#/batch/{BATCH_QR_ID}")
        second_tab.wait_for_function("document.querySelector('#page-title')?.textContent === 'Batch 44'")
        for tab in (first_tab, second_tab):
            tab.locator("#verification-kind").select_option("phone")
            tab.locator("#verification-value").fill("01012345678")
        first_tab.locator("#link-device-button").click()
        second_tab.locator("#link-device-button").click()
        second_tab.locator("#pending-state").wait_for(state="visible")
        require(len(api.calls_for("/public/device-link-requests")) == 1, f"Two tabs created more than one identity request ({lock_mode})")
        print(f"PASS: simultaneous tabs reuse one origin-scoped identity with {lock_mode}")
        context.close()

    # A lost response can be retried with the same pre-persisted handle and device key.
    api.reset()
    api.fail_next_link_response = True
    context, page = open_batch(browser, base_url, api)
    page.locator("#verification-kind").select_option("phone")
    page.locator("#verification-value").fill("01012345678")
    page.locator("#link-device-button").click()
    page.locator("#feedback").wait_for(state="visible")
    first = api.calls_for("/public/device-link-requests")[0]["body"]
    page.locator("#verification-value").fill("01012345678")
    page.locator("#link-device-button").click()
    page.locator("#pending-state").wait_for(state="visible")
    retry = api.calls_for("/public/device-link-requests")[1]["body"]
    require(retry.get("requestHandle") == first.get("requestHandle"), "Retry did not reuse the handle persisted before the first request")
    require(retry.get("publicKey") == first.get("publicKey"), "Retry did not reuse the same device identity")
    require(len(api.calls_for("/public/device-link-requests")) == 2, "Retry did not resubmit the pending identity request")
    print("PASS: a lost request response can be safely retried with the same persisted handle")
    context.close()

    # A same-handle retry with changed details is explicit and keeps polling its original request.
    api.reset()
    api.next_link_error = {
        "status": 409,
        "body": {"error": "This browser already has a request waiting with different details.", "errorCode": "QR_DEVICE_HANDLE_CONFLICT"},
    }
    context, page = open_batch(browser, base_url, api)
    page.locator("#verification-kind").select_option("phone")
    page.locator("#verification-value").fill("01012345678")
    page.locator("#link-device-button").click()
    page.locator("#pending-state").wait_for(state="visible")
    require(not page.locator("#recovery-state").is_visible(), "A same-handle request conflict was misclassified as an already-linked device")
    request_handle = api.calls_for("/public/device-link-requests")[-1]["body"]["requestHandle"]
    page.wait_for_function("document.querySelector('#pending-state')?.hidden === false")
    require(any(call["body"].get("requestHandle") == request_handle for call in api.calls_for("/public/device-link-status")), "The existing request stopped polling after a changed-details conflict")
    print("PASS: changed details cannot silently replace an existing request, and its status remains recoverable")
    context.close()

    # Recovery-code mode must submit only the code and keep the generic pending screen.
    api.reset()
    context, page = open_batch(browser, base_url, api, viewport=(390, 844))
    page.locator("#verification-kind").select_option("activationCode")
    page.locator("#verification-value").fill("ABCD-EFGH-JKLM-NPQR")
    page.locator("#link-device-button").click()
    page.locator("#pending-state").wait_for(state="visible")
    request = api.calls_for("/public/device-link-requests")[-1]
    require(request["body"].get("activationCode") == "ABCD-EFGH-JKLM-NPQR", "Recovery code was not sent")
    require("phone" not in request["body"], "Recovery request included a phone number")
    require(not page.locator("#check-in-button").is_visible(), "Mobile pending state exposes check-in")
    require(page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile layout overflows horizontally")
    page.locator("#language-toggle").click()
    require(page.evaluate("document.documentElement.dir") == "rtl", "Arabic mode did not set RTL")
    require("اربط" in page.locator("#link-device-button").inner_text(), "Egyptian Arabic link action is missing")
    require("قد تعالج أنظمة الاستضافة والأمان بيانات الاتصال" in page.locator("#connection-privacy-note").inner_text(), "Arabic connection-metadata note is missing")
    require("موقعك الدقيق بيتراجع بأمان ومش بيتخزن" in page.locator("#location-notice").inner_text(), "Arabic precise-location notice was changed")
    require(float(page.locator(".signature").evaluate("e => parseFloat(getComputedStyle(e).animationDuration)")) <= 0.001, "Reduced-motion preference was ignored")
    print("PASS: recovery-code request, Arabic RTL, reduced-motion, and mobile layout")
    context.close()

    # Approval is the only point at which identity and check-in become visible.
    api.reset()
    context, page = open_batch(browser, base_url, api)
    page.locator("#verification-kind").select_option("phone")
    page.locator("#verification-value").fill("01012345678")
    page.locator("#link-device-button").click()
    page.locator("#pending-state").wait_for(state="visible")
    wait_until_approved(page, api)
    require(page.locator("#bound-state").is_visible(), "Approved identity state is not visible")
    require(page.locator("#check-in-button").is_visible(), "Approved trainee has no check-in action")
    require(not page.locator("#link-form").is_visible(), "Approved trainee can switch identity in the form")
    require(page.locator("#trainee-name").inner_text() == "Ahmed Approved", "Approved identity is incorrect")
    require(not page.locator("#pending-state").is_visible(), "Pending state remains after approval")
    page.locator("#check-in-button").click()
    page.wait_for_function("document.querySelector('#feedback')?.textContent.toLowerCase().includes('checked in')")
    challenge = api.calls_for("/public/challenge")[-1]["body"]
    check_in = api.calls_for("/public/check-in")[-1]["body"]
    require("traineeId" not in challenge and "trainee_id" not in challenge, "Challenge accepted a caller-selected trainee")
    require("traineeId" not in check_in and "trainee_id" not in check_in, "Check-in accepted a caller-selected trainee")
    require(check_in.get("credentialId") == "approved-credential-44", "Check-in was not bound to the approved credential")
    link_request_count = len(api.calls_for("/public/device-link-requests"))
    page.evaluate("(value) => { location.hash = value; }", f"#/batch/{OTHER_BATCH_QR_ID}")
    page.locator("#recovery-state").wait_for(state="visible")
    require(not page.locator("#verification-value").is_visible(), "A linked browser was allowed to switch trainees for another batch")
    require(not page.locator("#check-in-button").is_visible(), "A bound credential was offered for another batch")
    require(len(api.calls_for("/public/device-link-requests")) == link_request_count, "A second batch generated a new identity request")
    print("PASS: approval reveals only the bound trainee, check-in stays credential-bound, and identity cannot switch")
    context.close()

    # A fresh browser profile (including cleared site storage) must request approval again.
    api.reset()
    context, page = open_batch(browser, base_url, api)
    page.locator("#verification-kind").select_option("phone")
    page.locator("#verification-value").fill("01012345678")
    page.locator("#link-device-button").click()
    page.locator("#pending-state").wait_for(state="visible")
    require(not page.locator("#check-in-button").is_visible(), "Fresh browser profile checked in before approval")
    require(len(api.calls_for("/public/device-link-requests")) == 1, "Fresh browser profile did not enter approval flow")
    require(not api.calls_for("/public/enroll"), "Fresh browser profile used legacy direct enrollment")
    print("PASS: cleared-site/new-browser recovery requires a new trainer-approved link")
    context.close()

    # One legacy enrollment is migrated; conflicting legacy enrollments are never guessed.
    api.reset()
    legacy = [{"batchQrId": BATCH_QR_ID, "credentialId": "legacy-credential", "traineeName": "Legacy Trainee", "createdAt": "2026-10-01T08:00:00.000Z"}]
    context, page = open_batch(browser, base_url, api, legacy_records=legacy)
    page.wait_for_function("document.querySelector('#trainee-name')?.textContent === 'Legacy Trainee'")
    require(page.locator("#check-in-button").is_visible(), "Single legacy link was not migrated")
    require(not page.locator("#verification-value").is_visible(), "Migrated legacy identity can be switched")
    require(not api.calls_for("/public/device-link-requests"), "Migrated legacy identity created a second link request")
    print("PASS: a single valid legacy enrollment migrates without relinking")
    context.close()

    api.reset()
    conflicting = [
        {"batchQrId": BATCH_QR_ID, "credentialId": "legacy-credential-a", "traineeName": "Legacy A", "createdAt": "2026-10-01T08:00:00.000Z"},
        {"batchQrId": OTHER_BATCH_QR_ID, "credentialId": "legacy-credential-b", "traineeName": "Legacy B", "createdAt": "2026-10-02T08:00:00.000Z"},
    ]
    context, page = open_batch(browser, base_url, api, legacy_records=conflicting)
    require(page.locator("#recovery-state").is_visible(), "Conflicting legacy links did not request staff-assisted recovery")
    body = page.locator("body").inner_text()
    require("Legacy A" not in body and "Legacy B" not in body, "Legacy trainee names leaked during conflict recovery")
    require(not page.locator("#check-in-button").is_visible(), "A conflicting legacy browser can check in")
    require(not api.calls_for("/public/device-link-requests"), "Conflicting legacy identities were resolved automatically")
    print("PASS: multiple legacy links require staff assistance without choosing or exposing an identity")
    context.close()


def main():
    chromium = os.environ.get("CHROMIUM_PATH")
    if not chromium:
        candidates = [
            Path(os.environ.get("LOCALAPPDATA", "")) / "ms-playwright/chromium-1248/chrome-win64/chrome.exe",
            Path(os.environ.get("LOCALAPPDATA", "")) / "ms-playwright/chromium-1243/chrome-win64/chrome.exe",
        ]
        chromium = next((str(path) for path in candidates if path.is_file()), None)

    handler = partial(QuietHandler, directory=str(PUBLIC))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{server.server_port}"
    api = ApiStub()

    try:
        with sync_playwright() as playwright:
            launch = {"headless": True, "args": ["--no-sandbox"]}
            if chromium:
                launch["executable_path"] = chromium
            browser = playwright.chromium.launch(**launch)
            try:
                run_checks(browser, base_url, api)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


if __name__ == "__main__":
    main()
