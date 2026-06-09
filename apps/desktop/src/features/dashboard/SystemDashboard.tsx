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
  const diskTotal = formatStorageBytes(snapshot.totalDisk);
  const diskAvailable = formatStorageBytes(snapshot.availableDisk);

  return (
    <div className="dashboard-grid" aria-label="本机信息">
      <MetricCard
        tone="forest"
        label="主机"
        value={snapshot.hostName}
        detail={`Kernel ${snapshot.kernelVersion}`}
      />
      <MetricCard
        tone="sage"
        label="操作系统"
        value={`${snapshot.osName} ${snapshot.osVersion}`}
        detail="当前运行环境"
      />
      <MetricCard
        tone="moss"
        label="CPU"
        value={snapshot.cpuName}
        detail={`${snapshot.cpuCoreCount} 核`}
      />
      <MetricCard tone="olive" label="内存" value={memoryValue} detail="已用 / 总量" />
      <MetricCard
        tone="linen"
        label="磁盘"
        value={diskTotal}
        detail={`可用 ${diskAvailable}`}
      />
      <MetricCard
        tone="pine"
        label="网络"
        value={`${snapshot.networkInterfaceCount} 个接口`}
        detail="检测到的网络适配器"
      />
    </div>
  );
}

function MetricCard({
  tone,
  label,
  value,
  detail,
}: {
  tone: "forest" | "sage" | "moss" | "olive" | "linen" | "pine";
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-card-top">
        <span>{label}</span>
        <i aria-hidden="true" />
      </div>
      <strong title={value}>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
