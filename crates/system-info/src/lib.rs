use serde::Serialize;
use sysinfo::{Disks, Networks, System};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SystemSnapshot {
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub host_name: String,
    pub cpu_name: String,
    pub cpu_core_count: usize,
    pub total_memory: u64,
    pub used_memory: u64,
    pub total_disk: u64,
    pub available_disk: u64,
    pub network_interface_count: usize,
}

pub fn collect_system_snapshot() -> SystemSnapshot {
    let mut system = System::new_all();
    system.refresh_all();

    let disks = Disks::new_with_refreshed_list();
    let total_disk = disks.iter().map(|disk| disk.total_space()).sum();
    let available_disk = disks.iter().map(|disk| disk.available_space()).sum();
    let networks = Networks::new_with_refreshed_list();

    SystemSnapshot {
        os_name: System::name().unwrap_or_else(|| "Unknown OS".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown version".to_string()),
        kernel_version: System::kernel_version()
            .unwrap_or_else(|| "Unknown kernel".to_string()),
        host_name: System::host_name().unwrap_or_else(|| "Unknown host".to_string()),
        cpu_name: system
            .cpus()
            .first()
            .map(|cpu| cpu.brand().trim().to_string())
            .filter(|name| !name.is_empty())
            .unwrap_or_else(|| "Unknown CPU".to_string()),
        cpu_core_count: system.cpus().len(),
        total_memory: system.total_memory(),
        used_memory: system.used_memory(),
        total_disk,
        available_disk,
        network_interface_count: networks.len(),
    }
}

#[cfg(test)]
mod tests {
    use super::collect_system_snapshot;

    #[test]
    fn snapshot_populates_core_system_fields() {
        let snapshot = collect_system_snapshot();

        assert!(!snapshot.os_name.trim().is_empty());
        assert!(snapshot.cpu_core_count > 0);
        assert!(snapshot.total_memory > 0);
    }
}
