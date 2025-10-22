import { useState, useEffect, useCallback, useRef } from 'react';
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';

const { GeofenceModule } = NativeModules;
const geofenceEmitter = new NativeEventEmitter(GeofenceModule);

interface GeofenceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface GeofenceEvent {
  isOnCampus: boolean;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface UseGeofenceConfig {
  campusLatitude: number;
  campusLongitude: number;
  radiusMeters: number;
  apiUrl: string;
  apiHeaders?: Record<string, string>;
  studentId?: string; // 20-digit identifier, set to "00000000000000000000" as placeholder
}

interface UseGeofenceReturn {
  isOnCampus: boolean | null;
  currentLocation: GeofenceLocation | null;
  isActive: boolean;
  error: string | null;
  setupGeofence: () => Promise<void>;
  stopGeofence: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useGeofence = (config: UseGeofenceConfig): UseGeofenceReturn => {
  const [isOnCampus, setIsOnCampus] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeofenceLocation | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track last API call to prevent duplicates
  const lastApiCallRef = useRef<{ isOnCampus: boolean; timestamp: number } | null>(null);

  // Call school API (same endpoint for check-in and check-out)
  const callSchoolApi = useCallback(async (isOnCampus: boolean) => {
    // Prevent duplicate calls within 5 minutes
    const now = Date.now();
    if (
      lastApiCallRef.current &&
      lastApiCallRef.current.isOnCampus === isOnCampus &&
      now - lastApiCallRef.current.timestamp < 5 * 60 * 1000
    ) {
      console.log('Skipping duplicate API call');
      return;
    }

    try {
      const studentId = config.studentId || '00000000000000000000';
      
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.apiHeaders,
        },
        body: JSON.stringify({
          studentId: studentId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      lastApiCallRef.current = { isOnCampus, timestamp: now };
      console.log(`Successfully ${isOnCampus ? 'checked in' : 'checked out'}`);
    } catch (err) {
      console.error('Failed to call school API:', err);
      setError(`Failed to ${isOnCampus ? 'check in' : 'check out'}`);
    }
  }, [config]);

  // Handle geofence events from native
  useEffect(() => {
    const subscription = geofenceEmitter.addListener(
      'onGeofenceEvent',
      (event: GeofenceEvent) => {
        console.log('Geofence event received:', event);
        
        setIsOnCampus(event.isOnCampus);
        setCurrentLocation({
          latitude: event.latitude,
          longitude: event.longitude,
        });

        // Trigger API call
        callSchoolApi(event.isOnCampus);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [callSchoolApi]);

  // Request permissions (Android and iOS)
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for automatic campus check-in',
            buttonPositive: 'OK',
          }
        );

        if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Location permission denied');
          return false;
        }

        // Request background location for Android 10+
        if (Platform.Version >= 29) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message: 'Allow location access all the time for automatic check-in when you arrive on campus',
              buttonPositive: 'OK',
            }
          );

          if (backgroundLocation !== PermissionsAndroid.RESULTS.GRANTED) {
            setError('Background location permission denied');
            return false;
          }
        }

        return true;
      } catch (err) {
        setError('Failed to request permissions');
        return false;
      }
    } else if (Platform.OS === 'ios') {
      // iOS permissions are handled natively via Info.plist and CLLocationManager
      // The native module will request permissions when setupGeofence is called
      return true;
    } else {
      setError('Platform not supported');
      return false;
    }
  }, []);

  // Setup geofence
  const setupGeofence = useCallback(async () => {
    try {
      setError(null);
      
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await GeofenceModule.setupGeofence(
        config.campusLatitude,
        config.campusLongitude,
        config.radiusMeters
      );

      setIsActive(true);
      
      // Get initial location
      await refreshLocation();
      
      console.log('Geofence setup complete');
    } catch (err: any) {
      setError(err.message || 'Failed to setup geofence');
      console.error('Geofence setup error:', err);
    }
  }, [config]);

  // Stop geofence
  const stopGeofence = useCallback(async () => {
    try {
      await GeofenceModule.removeGeofence();
      setIsActive(false);
      setError(null);
      console.log('Geofence stopped');
    } catch (err: any) {
      setError(err.message || 'Failed to stop geofence');
      console.error('Stop geofence error:', err);
    }
  }, []);

  // Manually refresh location
  const refreshLocation = useCallback(async () => {
    try {
      const location = await GeofenceModule.getCurrentLocation();
      setCurrentLocation(location);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      console.error('Get location error:', err);
    }
  }, []);

  // Check if geofence is active on mount
  useEffect(() => {
    GeofenceModule.isGeofenceActive()
      .then((active: boolean) => setIsActive(active))
      .catch(() => setIsActive(false));
  }, []);

  return {
    isOnCampus,
    currentLocation,
    isActive,
    error,
    setupGeofence,
    stopGeofence,
    refreshLocation,
    requestPermissions,
  };
};