# QR attendance geofence: research note

**Date:** 2026-10-21
**Scope:** Browser geolocation, a 200 m attendance geofence, and the proposed trainee-first-scan location anchor.

## Findings

- **Permission and HTTPS:** The W3C Geolocation API requires express user permission. Its interfaces are restricted to secure contexts, so a production web check-in needs HTTPS. The user may deny permission, and the browser may also be blocked by the device's OS location setting. [W3C Geolocation API — privacy and consent](https://www.w3.org/TR/geolocation/#user-consent), [W3C Geolocation API — secure-context interfaces](https://www.w3.org/TR/geolocation/#position).
- **Accuracy is an estimate:** `coords.accuracy` is a radius in metres; the specification describes it as a 95% confidence level for closeness to the true position. It is not a guarantee that the submitted point is inside or outside a boundary. Location can come from GPS, network signals, or other sources, and the API explicitly gives no guarantee that it is the device's actual location. [W3C Geolocation API — acquisition and accuracy](https://www.w3.org/TR/geolocation/#dfn-acquire-a-position), [W3C Geolocation API — introduction](https://www.w3.org/TR/geolocation/#introduction).
- **Mock locations are a real test capability:** Android's official docs describe choosing a mock-location app to fake a device's GPS for testing; Android Studio's emulator can also inject a chosen location. Android has a native `Location.isMock()` signal, but the standard browser Geolocation interface exposes coordinates and accuracy—not that Android-specific mock flag. A browser-only site therefore cannot treat browser coordinates as tamper-proof. [Android developer options](https://developer.android.com/studio/debug/dev-options#debugging), [Android emulator location controls](https://developer.android.com/studio/run/emulator-console#geo), [Android `Location.isMock()`](https://developer.android.com/reference/android/location/Location#isMock()).

## Anchor comparison

| Design | What it checks | Main weakness |
| --- | --- | --- |
| Anchor to the trainee's first scan | Later scans are near the location recorded on that trainee's first scan | The first scan can itself be remote or forwarded, so it can anchor the wrong place. It also fails when the training venue changes and does not prove that a later scan is genuine. |
| Anchor to a trainer-configured venue | Every check-in is compared with the venue's fixed, trainer/admin-confirmed coordinates | Better matches the attendance question and avoids trusting a trainee's first location, but still relies on permission-based, potentially inaccurate or simulated device location. |

## Recommendation

A **200 m geofence is a useful deterrent to casual remote QR sharing, not proof of physical presence**. Use the trainer-configured venue as the center and evaluate location at each check-in; do not learn the center from a trainee's first scan. Treat a geofence as an additional signal alongside a session-specific QR and the already-planned one-time trainee/device binding. Keep a trainer override for denied/unavailable GPS and legitimate accuracy failures. If enabled, request location only at check-in, disclose why, and avoid retaining raw coordinates; retain only the minimum outcome needed for attendance review. These privacy precautions follow the W3C's guidance to request location only when necessary and dispose of it when the task is complete. [W3C Geolocation API — recipient privacy guidance](https://www.w3.org/TR/geolocation/#privacy-considerations-for-recipients-of-location-information).

**Decision:** Do not describe or enforce this as “proof.” Use one stable printed QR per batch, while the server opens and closes the current scheduled-date session. The QR itself is reusable and may be forwarded; the active-session check, one-time trainee/device binding, venue check, and trainer review are the layered controls. A venue geofence is an optional anti-sharing signal with an explicit manual exception path; neither one QR nor daily QR codes prevent real-time forwarding by themselves.
