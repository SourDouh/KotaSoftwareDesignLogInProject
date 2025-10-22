package com.nuevalogintake4.geofence

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.location.*
import com.google.android.gms.tasks.Task

class GeofenceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val geofencingClient: GeofencingClient = LocationServices.getGeofencingClient(reactContext)
    private val fusedLocationClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(reactContext)
    
    companion object {
        const val GEOFENCE_ID = "CAMPUS_GEOFENCE"
        private var isGeofenceActive = false
    }

    override fun getName(): String = "GeofenceModule"

    @ReactMethod
    fun setupGeofence(latitude: Double, longitude: Double, radiusMeters: Float, promise: Promise) {
        if (ActivityCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted")
            return
        }

        val geofence = Geofence.Builder()
            .setRequestId(GEOFENCE_ID)
            .setCircularRegion(latitude, longitude, radiusMeters)
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
            .setLoiteringDelay(30000) // 30 seconds to avoid false triggers
            .build()

        val geofencingRequest = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofence(geofence)
            .build()

        val intent = Intent(reactApplicationContext, GeofenceBroadcastReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            reactApplicationContext,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        geofencingClient.addGeofences(geofencingRequest, pendingIntent).run {
            addOnSuccessListener {
                isGeofenceActive = true
                promise.resolve("Geofence setup successful")
            }
            addOnFailureListener { e ->
                promise.reject("GEOFENCE_ERROR", "Failed to setup geofence: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun removeGeofence(promise: Promise) {
        geofencingClient.removeGeofences(listOf(GEOFENCE_ID)).run {
            addOnSuccessListener {
                isGeofenceActive = false
                promise.resolve("Geofence removed")
            }
            addOnFailureListener { e ->
                promise.reject("REMOVE_ERROR", "Failed to remove geofence: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        if (ActivityCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted")
            return
        }

        fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
            if (location != null) {
                val result = Arguments.createMap().apply {
                    putDouble("latitude", location.latitude)
                    putDouble("longitude", location.longitude)
                    putDouble("accuracy", location.accuracy.toDouble())
                }
                promise.resolve(result)
            } else {
                promise.reject("LOCATION_NULL", "Could not get current location")
            }
        }.addOnFailureListener { e ->
            promise.reject("LOCATION_ERROR", "Failed to get location: ${e.message}")
        }
    }

    @ReactMethod
    fun isGeofenceActive(promise: Promise) {
        promise.resolve(isGeofenceActive)
    }

    // Called from BroadcastReceiver to send events to React Native
    fun sendGeofenceEvent(isOnCampus: Boolean, latitude: Double, longitude: Double) {
        val params = Arguments.createMap().apply {
            putBoolean("isOnCampus", isOnCampus)
            putDouble("latitude", latitude)
            putDouble("longitude", longitude)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onGeofenceEvent", params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for EventEmitter - keep empty
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for EventEmitter - keep empty
    }
}