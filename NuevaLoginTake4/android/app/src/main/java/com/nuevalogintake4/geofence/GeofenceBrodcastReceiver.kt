package com.nuevalogintake4.geofence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.location.Location
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactContext
import com.google.android.gms.location.*

class GeofenceBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val geofencingEvent = GeofencingEvent.fromIntent(intent)
        
        if (geofencingEvent == null || geofencingEvent.hasError()) {
            Log.e("GeofenceReceiver", "Geofencing error: ${geofencingEvent?.errorCode}")
            return
        }

        val geofenceTransition = geofencingEvent.geofenceTransition
        val triggeringLocation = geofencingEvent.triggeringLocation

        if (triggeringLocation == null) {
            Log.e("GeofenceReceiver", "No triggering location")
            return
        }

        val isOnCampus = when (geofenceTransition) {
            Geofence.GEOFENCE_TRANSITION_ENTER -> {
                Log.d("GeofenceReceiver", "Entered campus geofence")
                true
            }
            Geofence.GEOFENCE_TRANSITION_EXIT -> {
                Log.d("GeofenceReceiver", "Exited campus geofence")
                false
            }
            else -> {
                Log.w("GeofenceReceiver", "Unknown transition type: $geofenceTransition")
                return
            }
        }

        // Send event to React Native
        sendEventToReactNative(
            context,
            isOnCampus,
            triggeringLocation.latitude,
            triggeringLocation.longitude
        )

        // Store state for app startup
        val prefs = context.getSharedPreferences("GeofencePrefs", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("isOnCampus", isOnCampus)
            putLong("lastUpdate", System.currentTimeMillis())
            putString("latitude", triggeringLocation.latitude.toString())
            putString("longitude", triggeringLocation.longitude.toString())
            apply()
        }
    }

    private fun sendEventToReactNative(
        context: Context,
        isOnCampus: Boolean,
        latitude: Double,
        longitude: Double
    ) {
        try {
            val app = context.applicationContext as? ReactApplication
            val reactInstanceManager = app?.reactNativeHost?.reactInstanceManager
            val reactContext = reactInstanceManager?.currentReactContext

            if (reactContext != null) {
                val geofenceModule = reactContext.getNativeModule(GeofenceModule::class.java)
                geofenceModule?.sendGeofenceEvent(isOnCampus, latitude, longitude)
            } else {
                Log.w("GeofenceReceiver", "React context not available, event stored in SharedPreferences")
            }
        } catch (e: Exception) {
            Log.e("GeofenceReceiver", "Error sending event to React Native: ${e.message}")
        }
    }
}