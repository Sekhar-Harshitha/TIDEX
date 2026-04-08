import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Map as MapIcon } from 'lucide-react-native';

export const MapScreen = () => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 13.0827,
          longitude: 80.2707,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{ latitude: 13.0827, longitude: 80.2707 }}
          title="Your Location"
          pinColor="#0ea5e9"
        />
        
        {/* Mock Hazard Zone */}
        <Circle
          center={{ latitude: 13.09, longitude: 80.28 }}
          radius={1000}
          fillColor="rgba(239, 68, 68, 0.2)"
          strokeColor="rgba(239, 68, 68, 0.5)"
        />

        <Marker
          coordinate={{ latitude: 13.10, longitude: 80.29 }}
          title="Emergency Shelter"
          description="Available Capacity: 50"
        >
          <View style={styles.shelterMarker}>
            <MapIcon size={16} color="#fff" />
          </View>
        </Marker>
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>High Risk Zone</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Safe Shelter</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  shelterMarker: { backgroundColor: '#10b981', padding: 8, borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  overlay: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  legend: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 20, elevation: 5 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' }
});
