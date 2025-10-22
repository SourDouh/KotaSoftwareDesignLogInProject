//
//  GeofenceModule.swift
//  NuevaLoginTake4
//
//  Created by NUS18072-9-kotnewm on 10/19/25.
//

import Foundation
import Foundation
import CoreLocation
import React

@objc(GeofenceModule)
class GeofenceModule: RCTEventEmitter, CLLocationManagerDelegate {
    
    private var locationManager: CLLocationManager?
    private var isGeofenceActive = false
    private let geofenceIdentifier = "CAMPUS_GEOFENCE"
    private var campusRegion: CLCircularRegion?
    
    override init() {
        super.init()
        locationManager = CLLocationManager()
        locationManager?.delegate = self
        locationManager?.allowsBackgroundLocationUpdates = true
        locationManager?.pausesLocationUpdatesAutomatically = false
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return ["onGeofenceEvent"]
    }
    
    @objc
    func setupGeofence(_ latitude: Double, longitude: Double, radiusMeters: Double, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        // Check authorization status
        let status = locationManager?.authorizationStatus ?? .notDetermined
        
        if status == .denied || status == .restricted {
            rejecter("PERMISSION_DENIED", "Location permission not granted", nil)
            return
        }
        
        // Request permission if needed
        if status == .notDetermined {
            locationManager?.requestAlwaysAuthorization()
        }
        
        // Create circular region
        let center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        let region = CLCircularRegion(center: center, radius: radiusMeters, identifier: geofenceIdentifier)
        region.notifyOnEntry = true
        region.notifyOnExit = true
        
        // Store region reference
        campusRegion = region
        
        // Start monitoring
        locationManager?.startMonitoring(for: region)
        
        // Request current state
        locationManager?.requestState(for: region)
        
        isGeofenceActive = true
        resolver("Geofence setup successful")
    }
    
    @objc
    func removeGeofence(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        if let region = campusRegion {
            locationManager?.stopMonitoring(for: region)
        }
        
        isGeofenceActive = false
        campusRegion = nil
        resolver("Geofence removed")
    }
    
    @objc
    func getCurrentLocation(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard let location = locationManager?.location else {
            rejecter("LOCATION_NULL", "Could not get current location", nil)
            return
        }
        
        let result: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy
        ]
        
        resolver(result)
    }
    
    @objc
    func isGeofenceActive(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        resolver(isGeofenceActive)
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        if region.identifier == geofenceIdentifier {
            print("Entered campus geofence")
            sendGeofenceEvent(isOnCampus: true)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        if region.identifier == geofenceIdentifier {
            print("Exited campus geofence")
            sendGeofenceEvent(isOnCampus: false)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
        if region.identifier == geofenceIdentifier {
            let isInside = state == .inside
            print("Initial geofence state: \(isInside ? "inside" : "outside")")
            sendGeofenceEvent(isOnCampus: isInside)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        print("Geofence monitoring failed: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        print("Location authorization changed: \(status.rawValue)")
    }
    
    // MARK: - Helper Methods
    
    private func sendGeofenceEvent(isOnCampus: Bool) {
        guard let location = locationManager?.location else { return }
        
        let params: [String: Any] = [
            "isOnCampus": isOnCampus,
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        sendEvent(withName: "onGeofenceEvent", body: params)
        
        // Store state in UserDefaults
        UserDefaults.standard.set(isOnCampus, forKey: "isOnCampus")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "lastUpdate")
        UserDefaults.standard.set(location.coordinate.latitude, forKey: "latitude")
        UserDefaults.standard.set(location.coordinate.longitude, forKey: "longitude")
    }
}