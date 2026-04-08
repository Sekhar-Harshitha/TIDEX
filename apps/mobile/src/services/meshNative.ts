import { NativeModules } from 'react-native';

type MeshModuleType = {
  setCurrentUserId: (userId: string) => Promise<boolean>;
  startMeshService: () => Promise<boolean>;
  triggerSos: () => Promise<boolean>;
  stopMeshService: () => Promise<boolean>;
};

const MeshModule = NativeModules.MeshModule as MeshModuleType | undefined;

export const isMeshModuleAvailable = (): boolean => !!MeshModule;

const requireModule = (): MeshModuleType => {
  if (!MeshModule) {
    throw new Error('MeshModule is unavailable. Build native Android app with MeshPackage linked.');
  }
  return MeshModule;
};

export const bindCurrentUser = async (userId: string): Promise<void> => {
  await requireModule().setCurrentUserId(userId);
};

export const startMeshService = async (): Promise<void> => {
  await requireModule().startMeshService();
};

export const triggerSos = async (): Promise<void> => {
  await requireModule().triggerSos();
};

export const stopMeshService = async (): Promise<void> => {
  await requireModule().stopMeshService();
};
