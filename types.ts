
export enum HazardCategory {
  CYCLONE = 'Cyclone',
  TSUNAMI = 'Tsunami',
  HIGH_WAVES = 'High Waves',
  FLOODING = 'Coastal Flooding',
  FIRE = 'Fire',
  ELECTRICAL = 'Electrical Hazard', // New Category
  OTHER = 'Other'
}

export enum ReportStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  SUSPICIOUS = 'Suspicious',
  FAKE = 'Fake',
  ACTION_TAKEN = 'Action Taken' // New Status for Electrical repairs/shutdowns
}

export enum PriorityLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum UserRole {
  ADMIN = 'Admin',
  CITIZEN = 'Citizen',
  ELECTRICAL_OFFICER = 'Electrical Officer' // New Role (mapped to Admin for demo)
}

export type Language = 'en' | 'ta' | 'te' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  strikes: number;
  role: UserRole;
  isBanned: boolean;
  profile_image_url?: string;
  last_login?: number;
  created_at?: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  category: HazardCategory;
  description: string;
  location: GeoLocation;
  timestamp: number;
  mediaUrl?: string;
  status: ReportStatus;
  aiConfidence?: number;
  aiReasoning?: string;
  verificationTimestamp?: number;
  crossReferenceStatus?: 'Verified' | 'Potential Duplicate' | 'Old News' | 'AI Generated' | 'Stock Photo' | 'Unknown';
  crossReferenceSource?: string;
  isSOS?: boolean; 
  isOfflineSubmission?: boolean; 
  priorityScore?: number;
  priorityLevel?: PriorityLevel;
}

export interface SocialComment {
  id: string;
  user: string;
  text: string;
}

export interface SocialPost {
  id: string;
  platform: 'Twitter' | 'Reddit' | 'Facebook' | 'Instagram';
  content: string;
  author: string;
  timestamp: number;
  hashtags: string[];
  sentiment: 'Neutral' | 'Panic' | 'Informative';
  imageUrl?: string;
  likes: number;
  comments: SocialComment[];
  isRelevant?: boolean;
}

export interface VerificationResult {
  isHazard: boolean;
  isFake: boolean;
  confidence: number;
  reasoning: string;
  category: HazardCategory;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical'; // Added Severity
  priorityScore: number; // Added Priority Score
  isOldNews?: boolean;
  sourceUrl?: string;
  isAiGenerated?: boolean;
  isStockPhoto?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  targetPhoneNumber?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
}

// --- WEATHER TYPES ---

export interface CurrentWeather {
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy' | 'Fog';
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  uvIndex: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy' | 'Fog';
  windSpeed: number; // km/h
  precipitationChance: number; // %
}

export interface LocationForecast {
  locationName: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  days: DailyForecast[];
  sourceUri?: string; 
  isFallback?: boolean;
}

// --- MESH NETWORK TYPES ---

export enum MeshPacketType {
  HELLO = 'HELLO', 
  TEXT = 'TEXT',   
  ALERT = 'ALERT', 
  ACK = 'ACK'      
}

export interface MeshPeer {
  id: string;
  name: string;
  rssi: number; 
  lastSeen: number;
  distance: number; 
  isRelay: boolean; 
}

export interface MeshPacket {
  id: string;       
  type: MeshPacketType;
  senderId: string;
  targetId: string; 
  payload: string;  
  ttl: number;      
  hopCount: number;
  timestamp: number;
  hash: string;     
}

export interface MeshLog {
  id: string;
  direction: 'TX' | 'RX'; 
  packet: MeshPacket;
  status: 'Queued' | 'Sent' | 'Delivered' | 'Relayed';
}

// --- ELECTRICAL GRID TYPES ---

export interface ElectricalZone {
  id: string;
  name: string;
  status: 'Active' | 'Shutdown' | 'Partial';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  transformers: number;
  affectedCustomers: number;
  lastMaintenance?: string;
}

// --- CONNECTIVITY TYPES ---

export enum ConnectivityMode {
  ONLINE = 'online',
  MESH = 'mesh',
  LORA = 'lora'
}

// --- SAFETY & SHELTER TYPES ---

export interface SafeZone {
  id: string;
  name: string;
  type: 'Shelter' | 'Hospital' | 'High Ground' | 'Police Station';
  location: GeoLocation;
  capacity?: number;
  occupancy?: number;
  status: 'Available' | 'Full' | 'Closed';
  address: string;
  phone?: string;
}
