package com.tidex.mobile.mesh

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MeshModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MeshModule"

    @ReactMethod
    fun setCurrentUserId(userId: String, promise: Promise) {
        if (userId.isBlank()) {
            promise.reject("INVALID_USER", "userId must not be empty")
            return
        }
        AuthSessionStore(reactContext).saveCurrentUserId(userId)
        promise.resolve(true)
    }

    @ReactMethod
    fun startMeshService(promise: Promise) {
        try {
            val intent = Intent(reactContext, SOSMeshForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("MESH_START_FAILED", e)
        }
    }

    @ReactMethod
    fun triggerSos(promise: Promise) {
        try {
            val intent = Intent(reactContext, SOSMeshForegroundService::class.java).apply {
                action = SOSMeshForegroundService.ACTION_TRIGGER_SOS
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SOS_TRIGGER_FAILED", e)
        }
    }

    @ReactMethod
    fun stopMeshService(promise: Promise) {
        try {
            val intent = Intent(reactContext, SOSMeshForegroundService::class.java).apply {
                action = SOSMeshForegroundService.ACTION_STOP
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("MESH_STOP_FAILED", e)
        }
    }
}
