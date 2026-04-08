
import { MeshPacket, MeshPacketType, MeshPeer } from '../types';

/**
 * TideMesh Protocol Implementation
 * 
 * Architecture:
 * - Flood-based Mesh with TTL (Time To Live) to prevent loops.
 * - AES-256 Simulation for payload encryption.
 * - RSSI-based distance estimation.
 */

const BROADCAST_ID = 'BROADCAST';
const DEFAULT_TTL = 3; // Max 3 hops
const PACKET_SIZE_LIMIT = 512; // Bytes (Simulated BLE limit)

// Mock AES Encryption (In real native app, use 'react-native-aes-crypto')
const encryptPayload = (text: string): string => {
  return `ENC[${btoa(text)}]`; 
};

const decryptPayload = (encrypted: string): string => {
  if (encrypted.startsWith('ENC[')) {
    try {
      return atob(encrypted.slice(4, -1));
    } catch (e) {
      return '*** Decryption Error ***';
    }
  }
  return encrypted;
};

// Generate a Unique Packet ID
const generatePacketId = (): string => {
  return 'pkt-' + Math.random().toString(36).substring(2, 11);
};

// Create a Mesh Packet
export const createPacket = (
  senderId: string,
  targetId: string,
  type: MeshPacketType,
  content: string
): MeshPacket => {
  return {
    id: generatePacketId(),
    type,
    senderId,
    targetId,
    payload: encryptPayload(content),
    ttl: DEFAULT_TTL,
    hopCount: 0,
    timestamp: Date.now(),
    hash: Math.random().toString(36).substring(7) // Mock hash
  };
};

// Simulate Device Discovery
export const scanForDevices = (): MeshPeer[] => {
  // In a real app, this would use BleManager.scan()
  // We map these to simulated users with phone numbers
  const mockPeers: MeshPeer[] = [
    { id: 'peer-1', name: 'Citizen A', rssi: -45, distance: 5, lastSeen: Date.now(), isRelay: true },
    { id: 'peer-2', name: 'Rescue Unit 4', rssi: -70, distance: 15, lastSeen: Date.now(), isRelay: true },
    { id: 'peer-3', name: 'Citizen B', rssi: -85, distance: 30, lastSeen: Date.now(), isRelay: false },
    { id: 'peer-4', name: 'Field Medic', rssi: -60, distance: 12, lastSeen: Date.now(), isRelay: true },
  ];
  
  // Randomize RSSI slightly to simulate movement
  return mockPeers.map(p => ({
    ...p,
    rssi: p.rssi + (Math.floor(Math.random() * 10) - 5)
  }));
};

// Logic to determine if we should relay a packet
export const shouldRelay = (packet: MeshPacket, myId: string, seenPackets: Set<string>): boolean => {
  // 1. If we've seen this packet ID before, drop it (Deduplication)
  if (seenPackets.has(packet.id)) return false;
  
  // 2. If TTL is 0, drop it
  if (packet.ttl <= 0) return false;

  // 3. If it's for me, process it (don't relay unless it's broadcast)
  if (packet.targetId === myId) return false;

  // 4. Otherwise, relay
  return true;
};

// Simulate processing a packet hop
export const hopPacket = (packet: MeshPacket): MeshPacket => {
  return {
    ...packet,
    ttl: packet.ttl - 1,
    hopCount: packet.hopCount + 1
  };
};

export const MeshService = {
  createPacket,
  decryptPayload,
  scanForDevices,
  shouldRelay,
  hopPacket,
  BROADCAST_ID
};
