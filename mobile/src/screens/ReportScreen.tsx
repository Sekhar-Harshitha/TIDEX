import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Camera, MapPin, AlertTriangle } from 'lucide-react-native';

export const ReportScreen = () => {
  const [description, setDescription] = useState('');

  const handleSOS = () => {
    Alert.alert(
      "Confirm SOS",
      "Are you sure you want to trigger an emergency alert?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "YES, TRIGGER SOS", onPress: () => console.log("SOS Triggered"), style: "destructive" }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
        <AlertTriangle size={32} color="#fff" />
        <Text style={styles.sosText}>TRIGGER SOS</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Describe the Hazard</Text>
        <TextInput
          style={styles.input}
          placeholder="What's happening?"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Camera size={24} color="#64748b" />
            <Text style={styles.actionText}>Add Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MapPin size={24} color="#64748b" />
            <Text style={styles.actionText}>Get Location</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  sosButton: { 
    backgroundColor: '#ef4444', 
    margin: 20, 
    padding: 30, 
    borderRadius: 25, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 5
  },
  sosText: { color: '#fff', fontSize: 24, fontWeight: '900', marginLeft: 10 },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  input: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 15, 
    padding: 15, 
    textAlignVertical: 'top',
    fontSize: 16
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    gap: 8
  },
  actionText: { fontWeight: 'bold', color: '#64748b' },
  submitButton: { 
    backgroundColor: '#0ea5e9', 
    marginTop: 30, 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center' 
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
