# Real Android SOS BLE Mesh Setup

This project originally had Expo-only mock connectivity. The files under `mobile/android/app/src/main/java/com/tidex/mobile/mesh` implement a real Android BLE + GPS SOS mesh flow.

## What Is Implemented

- Real user identity from session: `AuthSessionStore` and JS bridge binding from app session
- Real GPS: `FusedLocationProviderClient` via `LocationProvider`
- Real timestamps: `System.currentTimeMillis()` in `SOSMeshForegroundService`
- Real BLE:
  - Advertise: `BluetoothLeAdvertiser`
  - Scan: `BluetoothLeScanner`
  - Simultaneous operation in foreground service
- Real JSON serialization:
  - `SOSMessage.toJsonString()` and `SOSMessage.fromJsonString()`
  - UTF-8 `ByteArray` payloads over BLE service data
- Duplicate protection:
  - Persistent seen ID set in `MeshMessageStore`
- TTL forwarding:
  - Decremented at each relay (`ttl - 1`), forwarded only while `ttl > 0`
- Foreground service:
  - `SOSMeshForegroundService`
- Internet recovery:
  - `NetworkMonitor` watches connectivity
  - Pending messages are sent to backend when internet returns
  - Delivered messages are marked and removed from pending queue
- Error handling:
  - Bluetooth OFF
  - Permission denial
  - Location failure
  - Backend retry by pending queue flush on network recovery
- Required logs:
  - Sent: `Message sent:`
  - Received: `Message received:`
  - Forwarded: `Message forwarded:`

## Native Registration Required

Because this repo currently does not contain a full generated Android app shell (`MainApplication`, Gradle files), complete these integration steps after creating native Android folders with Expo prebuild or in your existing native host app.

1. Generate native Android host (if missing):
- From `mobile/`, run Expo prebuild for Android.

2. Register `MeshPackage` in your Android application class:
- Add `MeshPackage()` to the package list in `MainApplication`.

3. Ensure these dependencies exist in Android app module:
- `com.google.android.gms:play-services-location`
- `org.jetbrains.kotlinx:kotlinx-coroutines-android`
- React Native default dependencies for native module classes

4. Confirm Android manifest entries are present:
- `BLUETOOTH_SCAN`
- `BLUETOOTH_ADVERTISE`
- `BLUETOOTH_CONNECT`
- `ACCESS_FINE_LOCATION`
- `FOREGROUND_SERVICE`
- Service declaration for `SOSMeshForegroundService`

## JavaScript Bridge Usage

- `mobile/src/services/meshNative.ts`
- `mobile/src/services/authSession.ts`
- `mobile/src/screens/ConnectScreen.tsx`

Flow:
1. Request runtime permissions.
2. Resolve real user ID from secure session.
3. Bind user ID into native service session store.
4. Start mesh service.
5. Trigger SOS for real GPS capture + BLE transmission.

## Two Physical Device Test Plan

1. Install the same build on Device A and Device B.
2. On both devices:
- Grant BLE + location + foreground permissions.
- Keep Bluetooth ON.
- Start mesh service from Connect tab.
3. On Device A:
- Trigger SOS.
4. Verify on Device B in Logcat:
- `Message received: <id>`
- `Message forwarded: <id>` when offline and ttl > 0
5. Restore internet on either device and verify:
- `Delivered to backend: <id>`
- No further re-broadcast of delivered message ID.

## Backend Endpoint

`SOSMeshForegroundService` currently posts to:
- `https://your-backend.example.com/api/sos`

Replace `SOS_API_URL` in `SOSMeshForegroundService.kt` with your real endpoint.
