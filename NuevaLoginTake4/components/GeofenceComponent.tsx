import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useGeofence } from '../api/useGeofence';
import MapView, { Circle, Marker } from 'react-native-maps';

const GeofenceExample: React.FC = () => {
  const geofence = useGeofence({
    // campus coordinates
    campusLatitude: 37.7749,
    campusLongitude: -122.4194,
    radiusMeters: 500, // 500 meter radius
    
    // school's API endpoints
    apiUrl: 'https://your-school-api.com/checkin',
    
    // Optional: Add authentication headers
    apiHeaders: {
      'Authorization': 'Bearer YOUR_TOKEN_HERE',
    },
  });

  useEffect(() => {
    // Auto-start geofencing when component mounts
    if (!geofence.isActive) {
      geofence.setupGeofence();
    }
  }, []);

  useEffect(() => {
    if (geofence.error) {
      Alert.alert('Error', geofence.error);
    }
  }, [geofence.error]);

  return (
    <View style={styles.container}>
      {/* Status Display */}
      <View style={styles.statusCard}>
        <Text style={styles.title}>Campus Status</Text>
        <Text style={styles.status}>
          {geofence.isOnCampus === null
            ? 'Checking...'
            : geofence.isOnCampus
            ? '✅ On Campus'
            : '❌ Off Campus'}
        </Text>
        <Text style={styles.activeStatus}>
          Geofencing: {geofence.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {/* Map Display */}
      {geofence.currentLocation && (
        <MapView
          style={styles.map}
          region={{
            latitude: geofence.currentLocation.latitude,
            longitude: geofence.currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Campus Geofence Circle */}
          <Circle
            center={{
              latitude: 37.7749,
              longitude: -122.4194,
            }}
            radius={500}
            fillColor="rgba(0, 122, 255, 0.2)"
            strokeColor="rgba(0, 122, 255, 0.8)"
            strokeWidth={2}
          />
          
          {/* User's Current Location */}
          <Marker
            coordinate={{
              latitude: geofence.currentLocation.latitude,
              longitude: geofence.currentLocation.longitude,
            }}
            title="Your Location"
            pinColor={geofence.isOnCampus ? 'green' : 'red'}
          />
        </MapView>
      )}

      {/* Location Details */}
      {geofence.currentLocation && (
        <View style={styles.locationCard}>
          <Text style={styles.locationText}>
            Lat: {geofence.currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Lon: {geofence.currentLocation.longitude.toFixed(6)}
          </Text>
          {geofence.currentLocation.accuracy && (
            <Text style={styles.locationText}>
              Accuracy: ±{geofence.currentLocation.accuracy.toFixed(0)}m
            </Text>
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <Button
          title={geofence.isActive ? 'Stop Geofencing' : 'Start Geofencing'}
          onPress={geofence.isActive ? geofence.stopGeofence : geofence.setupGeofence}
        />
        <View style={styles.spacer} />
        <Button
          title="Refresh Location"
          onPress={geofence.refreshLocation}
          disabled={!geofence.isActive}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 8,
  },
  activeStatus: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  locationCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 14,
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  controls: {
    padding: 16,
  },
  spacer: {
    height: 12,
  },
});

export default GeofenceExample;