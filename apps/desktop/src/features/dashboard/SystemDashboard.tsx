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
    <div className="dashboard-grid" aria-label="本机信息">
      <MetricCard label="主机" value={snapshot.hostName} detail={snapshot.kernelVersion} />
      <MetricCard
        label="操作系统"
        value={`${snapshot.osName} ${snapshot.osVersion}`}
        detail="当前运行环境"
      />
      <MetricCard
        label="CPU"
        value={snapshot.cpuName}
        detail={`${snapshot.cpuCoreCount} 核`}
      />
      <MetricCard label="内存" value={memoryValue} detail="已用 / 总量" />
      <MetricCard
        label="磁盘"
        value={formatStorageBytes(snapshot.totalDisk)}
        detail={`可用 ${formatStorageBytes(snapshot.availableDisk)}`}
      />
      <MetricCard
        label="网络"
        value={`${snapshot.networkInterfaceCount} 个接口`}
        detail="检测到的网络适配器"
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
