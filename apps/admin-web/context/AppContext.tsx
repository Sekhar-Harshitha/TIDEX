import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  Report,
  User,
  ReportStatus,
  HazardCategory,
  UserRole,
  AppNotification,
  Message,
  Language,
  MeshPeer,
  MeshPacket,
  MeshLog,
  MeshPacketType,
  GeoLocation,
  ElectricalZone,
  ConnectivityMode,
  SafeZone,
} from "../types";
import { translations } from "./translations";
import { MeshService } from "../services/meshNetwork";
import { apiRequest } from "../services/api";

interface AppContextType {
  reports: Report[];
  users: User[];
  currentUser: User | null;
  messages: Message[];
  isAuthenticated: boolean;
  isOnline: boolean;
  offlineQueue: Report[];
  latestNotification: AppNotification | null;
  language: Language;

  // Location State
  deviceLocation: GeoLocation | null;
  setDeviceLocation: (location: GeoLocation) => void;

  // Mesh Network State
  meshPeers: MeshPeer[];
  meshLogs: MeshLog[];
  isMeshActive: boolean;

  // Electrical Grid State
  electricalZones: ElectricalZone[];
  toggleShutdown: (
    zoneId: string,
    level: "Active" | "Shutdown" | "Partial",
  ) => void;

  // Connectivity State
  connectivityMode: ConnectivityMode;
  setConnectivityMode: (mode: ConnectivityMode) => void;

  // Safe Zones
  safeZones: SafeZone[];
  setSafeZones: (zones: SafeZone[]) => void;

  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  uploadPhoto: (base64: string) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
  sendOtp: (type: "email" | "phone", value: string) => Promise<void>;
  verifyOtp: (
    type: "email" | "phone",
    value: string,
    code: string,
  ) => Promise<void>;
  addReport: (report: Report) => void;
  updateReportStatus: (
    id: string,
    status: ReportStatus,
    reasoning?: string,
  ) => void;
  incrementStrikes: (userId: string) => void;
  switchUserRole: (targetRole?: UserRole) => void;
  toggleNetworkStatus: () => void;
  toggleMeshNetwork: () => void;
  sendMeshMessage: (text: string, targetId?: string) => void;
  triggerSOS: (location: { lat: number; lng: number }) => void;
  broadcastAlert: (message: string) => void;
  sendDirectSMS: (phoneNumber: string, message: string) => void;
  sendMessage: (text: string) => void;
  deleteReport: (id: string) => void;
  deleteAllReports: () => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SEED_ZONES: ElectricalZone[] = [
  {
    id: "z1",
    name: "Marina Zone A",
    status: "Active",
    riskLevel: "Low",
    transformers: 12,
    affectedCustomers: 1500,
    lastMaintenance: "2026-02-15 09:00",
  },
  {
    id: "z2",
    name: "Mylapore Grid",
    status: "Active",
    riskLevel: "High",
    transformers: 24,
    affectedCustomers: 4200,
    lastMaintenance: "2026-02-10 14:30",
  },
  {
    id: "z3",
    name: "Velachery Low",
    status: "Shutdown",
    riskLevel: "Critical",
    transformers: 8,
    affectedCustomers: 950,
    lastMaintenance: "2026-02-20 11:15",
  },
  {
    id: "z4",
    name: "Port Sector",
    status: "Active",
    riskLevel: "Medium",
    transformers: 15,
    affectedCustomers: 3100,
    lastMaintenance: "2026-01-28 16:45",
  },
];

const SEED_SAFE_ZONES: SafeZone[] = [
  {
    id: "sz1",
    name: "Nehru Indoor Stadium",
    type: "Shelter",
    location: { latitude: 13.085, longitude: 80.27 },
    capacity: 2000,
    occupancy: 450,
    status: "Available",
    address: "Periamet, Chennai",
    phone: "044-25381234",
  },
  {
    id: "sz2",
    name: "Apollo Hospital Greams Rd",
    type: "Hospital",
    location: { latitude: 13.06, longitude: 80.25 },
    capacity: 500,
    occupancy: 480,
    status: "Available",
    address: "Greams Road, Chennai",
    phone: "044-28293333",
  },
  {
    id: "sz3",
    name: "Anna University Campus",
    type: "High Ground",
    location: { latitude: 13.01, longitude: 80.235 },
    capacity: 5000,
    occupancy: 1200,
    status: "Available",
    address: "Guindy, Chennai",
    phone: "044-22357004",
  },
  {
    id: "sz4",
    name: "Mylapore Police Station",
    type: "Police Station",
    location: { latitude: 13.033, longitude: 80.268 },
    capacity: 100,
    occupancy: 20,
    status: "Available",
    address: "Kutchery Rd, Mylapore",
    phone: "044-24981234",
  },
  {
    id: "sz5",
    name: "Loyola College Shelter",
    type: "Shelter",
    location: { latitude: 13.062, longitude: 80.234 },
    capacity: 1500,
    occupancy: 1500,
    status: "Full",
    address: "Nungambakkam, Chennai",
    phone: "044-28178200",
  },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("tidex_messages");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("tidex_currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("tidex_token"),
  );

  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<Report[]>([]);
  const [latestNotification, setLatestNotification] =
    useState<AppNotification | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  // Location State
  const [deviceLocation, setDeviceLocation] = useState<GeoLocation | null>(
    null,
  );

  // Mesh Network State
  const [isMeshActive, setIsMeshActive] = useState(false);
  const [meshPeers, setMeshPeers] = useState<MeshPeer[]>([]);
  const [meshLogs, setMeshLogs] = useState<MeshLog[]>([]);
  const [seenPackets, setSeenPackets] = useState<Set<string>>(new Set());

  // Electrical State
  const [electricalZones, setElectricalZones] =
    useState<ElectricalZone[]>(SEED_ZONES);

  // Safe Zones
  const [safeZones, setSafeZones] = useState<SafeZone[]>(SEED_SAFE_ZONES);

  // Connectivity State
  const [connectivityMode, setConnectivityMode] = useState<ConnectivityMode>(
    () => {
      const saved = localStorage.getItem("tidex_connectivityMode");
      return (saved as ConnectivityMode) || ConnectivityMode.ONLINE;
    },
  );

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem("tidex_messages", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem("tidex_currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("tidex_currentUser");
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("tidex_connectivityMode", connectivityMode);
    // Sync with isOnline and isMeshActive for backward compatibility if needed
    if (connectivityMode === ConnectivityMode.ONLINE) {
      setIsOnline(true);
      setIsMeshActive(false);
    } else if (connectivityMode === ConnectivityMode.MESH) {
      setIsOnline(false);
      setIsMeshActive(true);
    } else {
      setIsOnline(false);
      setIsMeshActive(false);
    }
  }, [connectivityMode]);
  useEffect(() => {
    if (token) localStorage.setItem("tidex_token", token);
    else localStorage.removeItem("tidex_token");
  }, [token]);

  // Mesh Network Scanner Effect
  useEffect(() => {
    let interval: any;
    if (isMeshActive) {
      interval = setInterval(() => {
        const peers = MeshService.scanForDevices();
        setMeshPeers(peers);

        if (Math.random() > 0.85) {
          const randomPeer = peers[Math.floor(Math.random() * peers.length)];
          const fakeContent = [
            "Power out in Sector 4",
            "Wire down near school",
            "Need backup at sub-station",
            "Grid check complete",
          ][Math.floor(Math.random() * 4)];
          const fakePacket = MeshService.createPacket(
            randomPeer.name,
            MeshService.BROADCAST_ID,
            MeshPacketType.TEXT,
            fakeContent,
          );
          handleIncomingPacket(fakePacket);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isMeshActive]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const normalizeRole = (role: string | undefined): UserRole => {
    const normalized = (role || "").toLowerCase();
    if (normalized === "admin") return UserRole.ADMIN;
    if (
      normalized === "electrical officer" ||
      normalized === "electrical_officer"
    ) {
      return UserRole.ELECTRICAL_OFFICER;
    }
    return UserRole.CITIZEN;
  };

  const normalizeReportStatus = (status: string | undefined): ReportStatus => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "verified") return ReportStatus.VERIFIED;
    if (normalized === "suspicious") return ReportStatus.SUSPICIOUS;
    if (normalized === "fake") return ReportStatus.FAKE;
    if (normalized === "action taken" || normalized === "action_taken") {
      return ReportStatus.ACTION_TAKEN;
    }
    return ReportStatus.PENDING;
  };

  const mapUserFromApi = (user: any): User => ({
    id: String(user.id),
    name: String(user.name || "Unknown"),
    email: String(user.email || ""),
    phone: user.phone || "",
    strikes: Number(user.strikes || 0),
    role: normalizeRole(user.role),
    isBanned: Boolean(user.isBanned || Number(user.strikes || 0) >= 3),
    profile_image_url: user.profile_image_url || undefined,
    created_at: user.created_at
      ? new Date(user.created_at).getTime()
      : undefined,
    last_login: user.last_login
      ? new Date(user.last_login).getTime()
      : undefined,
  });

  const mapReportFromApi = (report: any): Report => ({
    id: String(report.id),
    userId: String(report.userId || report.user_id || ""),
    userName: String(report.userName || report.user_name || "Unknown User"),
    category: (report.category as HazardCategory) || HazardCategory.OTHER,
    description: String(report.description || ""),
    location: {
      latitude: Number(report.location?.latitude ?? report.lat ?? 0),
      longitude: Number(report.location?.longitude ?? report.lng ?? 0),
    },
    timestamp: report.timestamp
      ? Number.isFinite(report.timestamp)
        ? Number(report.timestamp)
        : new Date(report.timestamp).getTime()
      : Date.now(),
    mediaUrl: report.mediaUrl || report.media_url || undefined,
    status: normalizeReportStatus(report.status),
    aiConfidence: report.aiConfidence ?? report.ai_confidence,
    aiReasoning: report.aiReasoning ?? report.ai_reasoning,
    priorityScore: report.priorityScore ?? report.priority_score,
    priorityLevel: report.priorityLevel ?? report.priority_level,
    isSOS: Boolean(report.isSOS),
    isOfflineSubmission: Boolean(report.isOfflineSubmission),
  });

  const getAuthHeaders = (
    authToken: string | null,
  ): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const loadSessionData = async (authToken: string) => {
    const headers = getAuthHeaders(authToken);
    const [profile, usersData, reportsData] = await Promise.all([
      apiRequest<any>("/api/profile", { headers }),
      apiRequest<any[]>("/api/users", { headers }),
      apiRequest<any[]>("/api/reports", { headers }),
    ]);

    setCurrentUser(mapUserFromApi(profile));
    setUsers((usersData || []).map(mapUserFromApi));
    setReports((reportsData || []).map(mapReportFromApi));
  };

  useEffect(() => {
    if (!token) return;

    loadSessionData(token).catch((err) => {
      console.error("Failed to load session data:", err);
      setLatestNotification({
        id: `session-load-failure-${Date.now()}`,
        title: "Backend Connection Error",
        message: err?.message || "Could not load data from backend",
        timestamp: Date.now(),
      });
    });
  }, [token]);

  const toggleNetworkStatus = () => {
    setIsOnline((prev) => {
      const newState = !prev;
      if (newState && offlineQueue.length > 0) {
        const pendingReports = [...offlineQueue];

        (async () => {
          if (!token) {
            setLatestNotification({
              id: `sync-failed-${Date.now()}`,
              title: "Sync Failed",
              message: "Cannot sync offline queue without authentication.",
              timestamp: Date.now(),
            });
            return;
          }

          try {
            const synced: Report[] = [];

            for (const report of pendingReports) {
              const created = await apiRequest<any>("/api/reports", {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify({
                  category: report.category,
                  description: report.description,
                  location: report.location,
                  mediaUrl: report.mediaUrl,
                  status: report.status,
                  aiReasoning: report.aiReasoning,
                }),
              });
              synced.push(mapReportFromApi(created));
            }

            setReports((currentReports) => [...synced, ...currentReports]);
            setOfflineQueue([]);
            setLatestNotification({
              id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: "Sync Complete",
              message: `${pendingReports.length} offline reports uploaded successfully.`,
              timestamp: Date.now(),
            });
          } catch (error: any) {
            console.error("Offline queue sync failed:", error);
            setLatestNotification({
              id: `sync-failed-${Date.now()}`,
              title: "Sync Failed",
              message: error?.message || "Failed to upload offline reports",
              timestamp: Date.now(),
            });
          }
        })();
      }
      return newState;
    });
  };

  const toggleMeshNetwork = () => {
    setIsMeshActive((prev) => !prev);
    if (!isMeshActive) {
      setLatestNotification({
        id: `mesh-act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: "TideMesh Activated",
        message: "Scanning for nearby devices using Bluetooth Low Energy...",
        timestamp: Date.now(),
      });
    }
  };

  const handleIncomingPacket = (packet: MeshPacket) => {
    if (seenPackets.has(packet.id)) return;
    setSeenPackets((prev) => new Set(prev).add(packet.id));

    const newLog: MeshLog = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      direction: "RX",
      packet,
      status: "Delivered",
    };
    setMeshLogs((prev) => [newLog, ...prev]);

    if (
      packet.targetId === MeshService.BROADCAST_ID ||
      packet.targetId === currentUser?.id
    ) {
      const decryptedText = MeshService.decryptPayload(packet.payload);

      const newMessage: Message = {
        id: `msg-${packet.id}-${Math.random().toString(36).substring(2, 5)}`,
        senderId: packet.senderId,
        receiverId: "me",
        text: decryptedText,
        timestamp: packet.timestamp,
        isRead: false,
      };
      setMessages((prev) => [...prev, newMessage]);

      if (packet.senderId !== currentUser?.id) {
        setLatestNotification({
          id: `notif-${packet.id}-${Math.random().toString(36).substring(2, 5)}`,
          title: `Mesh: ${packet.senderId}`,
          message: decryptedText,
          timestamp: Date.now(),
        });
      }
    }

    if (packet.ttl > 0 && packet.targetId !== currentUser?.id) {
      setTimeout(() => {
        const relayedPacket = MeshService.hopPacket(packet);
        setMeshLogs((prev) => [
          {
            id: `relay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            direction: "TX",
            packet: relayedPacket,
            status: "Relayed",
          },
          ...prev,
        ]);
      }, 1000);
    }
  };

  const sendMeshMessage = (
    text: string,
    targetId: string = MeshService.BROADCAST_ID,
  ) => {
    if (!currentUser) return;
    const packet = MeshService.createPacket(
      currentUser.id,
      targetId,
      MeshPacketType.TEXT,
      text,
    );

    const newLog: MeshLog = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      direction: "TX",
      packet,
      status: "Sent",
    };
    setMeshLogs((prev) => [newLog, ...prev]);
    setSeenPackets((prev) => new Set(prev).add(packet.id));

    const myMessage: Message = {
      id: packet.id,
      senderId: "me",
      receiverId:
        targetId === MeshService.BROADCAST_ID ? "Broadcast" : targetId,
      text: text,
      timestamp: Date.now(),
      isRead: true,
    };
    setMessages((prev) => [...prev, myMessage]);

    setLatestNotification({
      id: `mesh-bc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: "Mesh Broadcast",
      message: "Message hopping to nearby nodes...",
      timestamp: Date.now(),
    });
  };

  const toggleShutdown = (
    zoneId: string,
    level: "Active" | "Shutdown" | "Partial",
  ) => {
    setElectricalZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, status: level } : z)),
    );

    const zone = electricalZones.find((z) => z.id === zoneId);
    if (!zone) return;

    const msg =
      level === "Active"
        ? `POWER RESTORED: ${zone.name}. Grid operational.`
        : `EMERGENCY ALERT: ${level} shutdown initiated for ${zone.name}. Power cut to ${zone.affectedCustomers} lines.`;

    // 1. Send Mesh Alert
    if (isMeshActive) {
      sendMeshMessage(msg, MeshService.BROADCAST_ID);
    }

    // 2. Broadcast SMS
    broadcastAlert(msg);
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest<any>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const normalizedUser = mapUserFromApi(data.user);
      setCurrentUser(normalizedUser);
      setToken(data.token);
      await loadSessionData(data.token);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => {
    try {
      const data = await apiRequest<any>("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const normalizedUser = mapUserFromApi(data.user);
      setCurrentUser(normalizedUser);
      setToken(data.token);
      await loadSessionData(data.token);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
  };

  const updateProfile = async (data: {
    name: string;
    email: string;
    phone: string;
  }) => {
    try {
      const updatedUser = await apiRequest<any>("/api/profile", {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      setCurrentUser(mapUserFromApi(updatedUser));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const uploadPhoto = async (photoBase64: string) => {
    try {
      const data = await apiRequest<any>("/api/upload-photo", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ photoBase64 }),
      });
      setCurrentUser((prev) =>
        prev ? { ...prev, profile_image_url: data.profile_image_url } : null,
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await apiRequest<any>("/api/change-password", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ oldPassword, newPassword }),
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const sendOtp = async (type: "email" | "phone", value: string) => {
    try {
      await apiRequest<any>("/api/otp/send", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ type, value }),
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const verifyOtp = async (
    type: "email" | "phone",
    value: string,
    code: string,
  ) => {
    try {
      await apiRequest<any>("/api/otp/verify", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ type, value, code }),
      });

      // If verified, update the actual profile field
      if (!currentUser) return;
      if (type === "email") {
        await updateProfile({
          name: currentUser.name,
          email: value,
          phone: currentUser.phone || "",
        });
      } else {
        await updateProfile({
          name: currentUser.name,
          email: currentUser.email,
          phone: value,
        });
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const addReport = (report: Report) => {
    if (isOnline) {
      if (!token) {
        setLatestNotification({
          id: `report-auth-${Date.now()}`,
          title: "Authentication Required",
          message: "Please login again before submitting reports.",
          timestamp: Date.now(),
        });
        return;
      }

      (async () => {
        try {
          const created = await apiRequest<any>("/api/reports", {
            method: "POST",
            headers: getAuthHeaders(token),
            body: JSON.stringify({
              category: report.category,
              description: report.description,
              location: report.location,
              mediaUrl: report.mediaUrl,
              status: report.status,
              aiReasoning: report.aiReasoning,
            }),
          });
          setReports((prev) => [mapReportFromApi(created), ...prev]);
        } catch (error: any) {
          console.error("Failed to submit report:", error);
          const offlineReport = { ...report, isOfflineSubmission: true };
          setOfflineQueue((prev) => [offlineReport, ...prev]);
          setLatestNotification({
            id: `report-failed-${Date.now()}`,
            title: "Submission Failed",
            message:
              error?.message ||
              "Report queued offline and will retry on reconnect.",
            timestamp: Date.now(),
          });
        }
      })();
    } else {
      const offlineReport = { ...report, isOfflineSubmission: true };
      setOfflineQueue((prev) => [offlineReport, ...prev]);
      if (isMeshActive) {
        sendMeshMessage(
          `Hazard Report: ${report.category} at my location.`,
          MeshService.BROADCAST_ID,
        );
      }
    }
  };

  const triggerSOS = (location: { lat: number; lng: number }) => {
    if (!currentUser) return;

    const sosReport: Report = {
      id: `SOS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      category: HazardCategory.OTHER,
      description: "EMERGENCY SOS ALERT! Immediate assistance required.",
      location: { latitude: location.lat, longitude: location.lng },
      timestamp: Date.now(),
      status: ReportStatus.PENDING,
      isSOS: true,
      mediaUrl: "https://media.giphy.com/media/3o6ozh46EbuWRYAcSY/giphy.gif",
    };

    if (isOnline) {
      // ONLINE LOGIC
      console.log(
        "SOS: Online mode detected. Contacting emergency services via API...",
      );
      // Simulate API call to responders
      setTimeout(() => {
        setLatestNotification({
          id: `sos-online-${Date.now()}`,
          title: "Emergency Services Contacted",
          message:
            "First responders have been notified of your location. Stay where you are.",
          timestamp: Date.now(),
        });
      }, 1500);

      addReport(sosReport);
    } else {
      // OFFLINE LOGIC
      console.log(
        "SOS: Offline mode detected. Activating Bluetooth Mesh broadcast...",
      );

      // Auto-activate mesh if offline
      if (!isMeshActive) {
        setIsMeshActive(true);
      }

      // Broadcast distress signal
      const distressMsg = `SOS DISTRESS SIGNAL: User ${currentUser.name} at [${location.lat}, ${location.lng}] needs immediate help!`;
      sendMeshMessage(distressMsg, MeshService.BROADCAST_ID);

      // Add to offline queue
      const offlineReport = { ...sosReport, isOfflineSubmission: true };
      setOfflineQueue((prev) => [offlineReport, ...prev]);

      setLatestNotification({
        id: `sos-offline-${Date.now()}`,
        title: "Mesh SOS Broadcasted",
        message:
          "Your distress signal is being relayed across the mesh network to nearby devices.",
        timestamp: Date.now(),
      });
    }
  };

  const updateReportStatus = (
    id: string,
    status: ReportStatus,
    reasoning?: string,
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedReport = {
            ...r,
            status,
            aiReasoning: reasoning || r.aiReasoning,
          };

          if (
            status === ReportStatus.VERIFIED ||
            status === ReportStatus.ACTION_TAKEN
          ) {
            const user = users.find((u) => u.id === r.userId);
            const msg =
              status === ReportStatus.ACTION_TAKEN
                ? `Update: Action has been taken on your report '${r.category}'. Maintenance crew deployed.`
                : `Report Verified: Rescue team dispatched to location.`;

            setLatestNotification({
              id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: "TideX Alert",
              message: msg,
              timestamp: Date.now(),
              targetPhoneNumber: user?.phone,
            });
          }

          return updatedReport;
        }
        return r;
      }),
    );

    if (status === ReportStatus.FAKE) {
      const report = reports.find((r) => r.id === id);
      if (report) incrementStrikes(report.userId);
    }
  };

  const broadcastAlert = (message: string) => {
    const newMsg: Message = {
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: "admin",
      receiverId: "broadcast",
      text: message,
      timestamp: Date.now(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);

    setLatestNotification({
      id: `ebc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: "EMERGENCY BROADCAST",
      message: message,
      timestamp: Date.now(),
    });
  };

  const sendDirectSMS = (phoneNumber: string, message: string) => {
    const targetUser = users.find((u) => u.phone === phoneNumber);
    if (targetUser) {
      const newMsg: Message = {
        id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId: "admin",
        receiverId: targetUser.id,
        text: message,
        timestamp: Date.now(),
        isRead: false,
      };
      setMessages((prev) => [...prev, newMsg]);
    }

    setLatestNotification({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: "TideX Message",
      message: message,
      timestamp: Date.now(),
      targetPhoneNumber: phoneNumber,
    });
  };

  const sendMessage = (text: string) => {
    if (!currentUser) return;
    const newMsg: Message = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: currentUser.id,
      receiverId: "admin",
      text: text,
      timestamp: Date.now(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const incrementStrikes = (userId: string) => {
    if (!token) return;

    apiRequest<any>(`/api/users/${userId}/strikes`, {
      method: "PATCH",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ delta: 1 }),
    })
      .then((updatedUser) => {
        const normalized = mapUserFromApi(updatedUser);
        setUsers((prev) => prev.map((u) => (u.id === userId ? normalized : u)));

        if (normalized.strikes === 2) {
          setLatestNotification({
            id: `warn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: "Warning Issued",
            message:
              "You have submitted 2 fake reports. One more and your account will be banned.",
            timestamp: Date.now(),
            targetPhoneNumber: normalized.phone,
          });
        }

        if (normalized.strikes >= 3) {
          setLatestNotification({
            id: `ban-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: "Account Suspended",
            message:
              "Your account has been banned due to repeated fake reporting.",
            timestamp: Date.now(),
            targetPhoneNumber: normalized.phone,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to increment strikes:", error);
      });
  };

  const switchUserRole = async (targetRole?: UserRole) => {
    if (!currentUser) return;

    const newRole =
      targetRole ||
      (currentUser.role === UserRole.ADMIN ? UserRole.CITIZEN : UserRole.ADMIN);

    if (!token) {
      setLatestNotification({
        id: `role-switch-failed-${Date.now()}`,
        title: "Role Switch Failed",
        message: "You are not authenticated.",
        timestamp: Date.now(),
      });
      return;
    }

    const previousUser = currentUser;
    setCurrentUser({ ...currentUser, role: newRole });

    try {
      const updated = await apiRequest<any>("/api/profile/role", {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ role: newRole }),
      });
      const normalized = mapUserFromApi(updated);
      setCurrentUser(normalized);
      setUsers((prev) =>
        prev.map((u) => (u.id === normalized.id ? normalized : u)),
      );
    } catch (err: any) {
      console.error("Failed to update role on server:", err);
      setCurrentUser(previousUser);
      setLatestNotification({
        id: `role-switch-failed-${Date.now()}`,
        title: "Role Switch Failed",
        message: err?.message || "Backend rejected role switch",
        timestamp: Date.now(),
      });
      return;
    }

    setLatestNotification({
      id: `role-switch-${Date.now()}`,
      title: "Role Switched",
      message: `You are now operating as ${newRole}`,
      timestamp: Date.now(),
    });
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const deleteAllReports = () => {
    setReports([]);
  };

  const clearNotification = () => setLatestNotification(null);

  return (
    <AppContext.Provider
      value={{
        reports,
        users,
        currentUser,
        messages,
        isAuthenticated: !!currentUser,
        isOnline,
        offlineQueue,
        latestNotification,
        language,
        deviceLocation,
        setDeviceLocation,
        meshPeers,
        meshLogs,
        isMeshActive,
        electricalZones,
        toggleShutdown,
        connectivityMode,
        setConnectivityMode,
        safeZones,
        setSafeZones,

        setLanguage,
        t,
        login,
        signup,
        logout,
        updateProfile,
        uploadPhoto,
        changePassword,
        sendOtp,
        verifyOtp,
        addReport,
        updateReportStatus,
        incrementStrikes,
        switchUserRole,
        toggleNetworkStatus,
        toggleMeshNetwork,
        sendMeshMessage,
        triggerSOS,
        broadcastAlert,
        sendDirectSMS,
        sendMessage,
        deleteReport,
        deleteAllReports,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
