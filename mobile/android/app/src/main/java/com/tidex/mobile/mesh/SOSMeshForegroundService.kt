package com.tidex.mobile.mesh

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class SOSMeshForegroundService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private lateinit var bleMeshManager: BleMeshManager
    private lateinit var locationProvider: LocationProvider
    private lateinit var sessionStore: AuthSessionStore
    private lateinit var messageStore: MeshMessageStore
    private lateinit var networkMonitor: NetworkMonitor

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Mesh service active"))

        bleMeshManager = BleMeshManager(this)
        locationProvider = LocationProvider(this)
        sessionStore = AuthSessionStore(this)
        messageStore = MeshMessageStore(this)
        networkMonitor = NetworkMonitor(this)

        bleMeshManager.onError = { error ->
            Log.e(TAG, error)
        }

        bleMeshManager.onMessageReceived = { incoming ->
            serviceScope.launch {
                handleIncomingMessage(incoming)
            }
        }

        bleMeshManager.startScanning()

        networkMonitor.start {
            serviceScope.launch {
                flushPendingIfOnline()
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_TRIGGER_SOS -> {
                serviceScope.launch {
                    triggerSosAndBroadcast()
                }
            }
            ACTION_STOP -> {
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        networkMonitor.stop()
        bleMeshManager.stopAll()
        serviceScope.cancel()
    }

    private suspend fun triggerSosAndBroadcast() {
        if (!bleMeshManager.hasBlePermissions()) {
            Log.e(TAG, "Cannot trigger SOS: missing BLE permission")
            return
        }
        if (!locationProvider.hasLocationPermission(this)) {
            Log.e(TAG, "Cannot trigger SOS: missing ACCESS_FINE_LOCATION")
            return
        }
        if (!bleMeshManager.isBluetoothEnabled()) {
            Log.e(TAG, "Cannot trigger SOS: Bluetooth OFF")
            return
        }

        val userId = sessionStore.getCurrentUserId()
        if (userId.isNullOrBlank()) {
            Log.e(TAG, "Cannot trigger SOS: no authenticated user session")
            return
        }

        val (lat, lng) = try {
            locationProvider.getCurrentLocation(this)
        } catch (e: Exception) {
            Log.e(TAG, "Location fetch failed", e)
            return
        }

        val message = SOSMessage(
            id = UUID.randomUUID().toString(),
            userId = userId,
            latitude = lat,
            longitude = lng,
            timestamp = System.currentTimeMillis(),
            ttl = DEFAULT_TTL,
            delivered = false
        )

        messageStore.markSeen(message.id)
        messageStore.addPending(message)
        bleMeshManager.advertiseMessage(message)
        Log.i(TAG, "Message sent: ${message.id} user=${message.userId} lat=${message.latitude} lng=${message.longitude} ttl=${message.ttl}")

        if (networkMonitor.isInternetAvailable()) {
            submitToBackend(message)
        }
    }

    private suspend fun handleIncomingMessage(message: SOSMessage) {
        if (messageStore.isSeen(message.id)) {
            return
        }

        messageStore.markSeen(message.id)
        Log.i(TAG, "Message received: ${message.id} from=${message.userId} ttl=${message.ttl}")

        if (networkMonitor.isInternetAvailable()) {
            submitToBackend(message)
            return
        }

        if (message.ttl > 0 && !message.delivered) {
            val forwarded = message.copy(ttl = message.ttl - 1)
            messageStore.addPending(forwarded)
            bleMeshManager.advertiseMessage(forwarded)
            Log.i(TAG, "Message forwarded: ${forwarded.id} ttl=${forwarded.ttl}")
        }
    }

    private suspend fun flushPendingIfOnline() {
        if (!networkMonitor.isInternetAvailable()) return

        val pending = messageStore.getPending()
        pending.forEach { submitToBackend(it) }
    }

    private suspend fun submitToBackend(message: SOSMessage) {
        if (messageStore.isDelivered(message.id)) return

        try {
            val url = URL(SOS_API_URL)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10000
                readTimeout = 10000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }

            val payload = JSONObject().apply {
                put("id", message.id)
                put("userId", message.userId)
                put("latitude", message.latitude)
                put("longitude", message.longitude)
                put("timestamp", message.timestamp)
                put("source", "bluetooth-mesh")
            }.toString()

            OutputStreamWriter(conn.outputStream).use { it.write(payload) }
            val status = conn.responseCode
            conn.disconnect()

            if (status in 200..299) {
                messageStore.markDelivered(message.id)
                messageStore.removePending(message.id)
                Log.i(TAG, "Delivered to backend: ${message.id}")
            } else {
                Log.e(TAG, "Backend delivery failed: ${message.id}, code=$status")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Backend delivery error: ${message.id}", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "TideX SOS Mesh",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setContentTitle("TideX SOS Mesh")
            .setContentText(contentText)
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val TAG = "SOSMeshService"
        private const val CHANNEL_ID = "tidex_sos_mesh_channel"
        private const val NOTIFICATION_ID = 1024
        private const val DEFAULT_TTL = 5

        // Update this to your live backend endpoint.
        private const val SOS_API_URL = "https://your-backend.example.com/api/sos"

        const val ACTION_TRIGGER_SOS = "com.tidex.mobile.mesh.action.TRIGGER_SOS"
        const val ACTION_STOP = "com.tidex.mobile.mesh.action.STOP"
    }
}
