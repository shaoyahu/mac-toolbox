import {
  formatMemoryBytes,
  formatStorageBytes,
  SystemSnapshot,
} from "../../lib/systemInfo";

type SystemDashboardProps = {
  snapshot: SystemSnapshot;
};

export function SystemDashboard({ snapshot }: SystemDashboardProps) {
  const memoryValue = `${formatMemoryBytes(snapshot.usedMemory)} / ${formatMemoryBytes(
    snapshot.totalMemory,
  )}`;

  return (
    <div className="dashboard-grid" aria-label="System information">
      <MetricCard label="Host" value={snapshot.hostName} detail={snapshot.kernelVersion} />
      <MetricCard
        label="Operating system"
        value={`${snapshot.osName} ${snapshot.osVersion}`}
        detail="Current runtime"
      />
      <MetricCard
        label="CPU"
        value={snapshot.cpuName}
        detail={`${snapshot.cpuCoreCount} cores`}
      />
      <MetricCard label="Memory" value={memoryValue} detail="Used / total" />
      <MetricCard
        label="Disk"
        value={formatStorageBytes(snapshot.totalDisk)}
        detail={`${formatStorageBytes(snapshot.availableDisk)} available`}
      />
      <MetricCard
        label="Network"
        value={`${snapshot.networkInterfaceCount} interfaces`}
        detail="Detected adapters"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
