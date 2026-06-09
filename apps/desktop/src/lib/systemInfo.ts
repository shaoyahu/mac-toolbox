import { invoke } from "@tauri-apps/api/core";

export type SystemSnapshotDto = {
  osName: string;
  osVersion: string;
  kernelVersion: string;
  hostName: string;
  cpuName: string;
  cpuCoreCount: number;
  totalMemory: number;
  usedMemory: number;
  totalDisk: number;
  availableDisk: number;
  networkInterfaceCount: number;
};

export type SystemSnapshot = SystemSnapshotDto;

export async function loadSystemSnapshot(): Promise<SystemSnapshot> {
  return invoke<SystemSnapshotDto>("system_snapshot");
}

export function formatMemoryBytes(bytes: number): string {
  return formatBytes(bytes, 1024);
}

export function formatStorageBytes(bytes: number): string {
  return formatBytes(bytes, 1000);
}

function formatBytes(bytes: number, base: 1000 | 1024): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(base)),
    units.length - 1,
  );
  const value = bytes / base ** exponent;
  const rounded = value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1);

  return `${rounded} ${units[exponent]}`;
}
