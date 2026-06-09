use serde::Serialize;
use std::path::{Path, PathBuf};
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

#[derive(Debug, Clone, PartialEq, Eq)]
struct DiskSpaceEntry {
    mount_point: PathBuf,
    total: u64,
    available: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct DiskSpace {
    total: u64,
    available: u64,
}

pub fn collect_system_snapshot() -> SystemSnapshot {
    let mut system = System::new_all();
    system.refresh_all();

    let disks = Disks::new_with_refreshed_list();
    let disk_space = collect_disk_space(&disks);
    let networks = Networks::new_with_refreshed_list();

    SystemSnapshot {
        os_name: System::name().unwrap_or_else(|| "Unknown OS".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown version".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unknown kernel".to_string()),
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
        total_disk: disk_space.total,
        available_disk: disk_space.available,
        network_interface_count: networks.len(),
    }
}

fn collect_disk_space(disks: &Disks) -> DiskSpace {
    let entries = disks
        .iter()
        .map(|disk| DiskSpaceEntry {
            mount_point: disk.mount_point().to_path_buf(),
            total: disk.total_space(),
            available: disk.available_space(),
        })
        .collect::<Vec<_>>();
    select_disk_space(&entries)
}

fn select_disk_space(entries: &[DiskSpaceEntry]) -> DiskSpace {
    #[cfg(target_os = "macos")]
    {
        select_macos_disk_space(entries).unwrap_or_else(|| sum_disk_space(entries))
    }

    #[cfg(not(target_os = "macos"))]
    {
        sum_disk_space(entries)
    }
}

#[cfg(target_os = "macos")]
fn select_macos_disk_space(entries: &[DiskSpaceEntry]) -> Option<DiskSpace> {
    ["/System/Volumes/Data", "/"]
        .iter()
        .find_map(|mount_point| disk_space_for_mount(entries, mount_point))
        .or_else(|| {
            entries
                .iter()
                .filter(|entry| entry.total > 0)
                .max_by_key(|entry| entry.total)
                .map(DiskSpace::from)
        })
}

fn disk_space_for_mount(entries: &[DiskSpaceEntry], mount_point: &str) -> Option<DiskSpace> {
    entries
        .iter()
        .find(|entry| entry.mount_point == Path::new(mount_point) && entry.total > 0)
        .map(DiskSpace::from)
}

fn sum_disk_space(entries: &[DiskSpaceEntry]) -> DiskSpace {
    entries.iter().fold(
        DiskSpace {
            total: 0,
            available: 0,
        },
        |acc, entry| DiskSpace {
            total: acc.total + entry.total,
            available: acc.available + entry.available,
        },
    )
}

impl From<&DiskSpaceEntry> for DiskSpace {
    fn from(entry: &DiskSpaceEntry) -> Self {
        Self {
            total: entry.total,
            available: entry.available,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{collect_system_snapshot, select_disk_space, DiskSpace, DiskSpaceEntry};
    use std::path::PathBuf;

    #[test]
    fn snapshot_populates_core_system_fields() {
        let snapshot = collect_system_snapshot();

        assert!(!snapshot.os_name.trim().is_empty());
        assert!(snapshot.cpu_core_count > 0);
        assert!(snapshot.total_memory > 0);
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn macos_disk_space_uses_primary_data_volume_without_apfs_double_counting() {
        let entries = vec![
            disk_entry("/", 482_797_652_000, 147_389_788_000),
            disk_entry("/System/Volumes/Data", 482_797_652_000, 147_389_788_000),
            disk_entry("/System/Volumes/Preboot", 482_797_652_000, 147_389_788_000),
            disk_entry("/System/Volumes/VM", 482_797_652_000, 147_389_788_000),
        ];

        assert_eq!(
            select_disk_space(&entries),
            DiskSpace {
                total: 482_797_652_000,
                available: 147_389_788_000,
            },
        );
    }

    #[test]
    #[cfg(not(target_os = "macos"))]
    fn non_macos_disk_space_sums_mounts() {
        let entries = vec![disk_entry("/", 100, 40), disk_entry("/data", 200, 90)];

        assert_eq!(
            select_disk_space(&entries),
            DiskSpace {
                total: 300,
                available: 130,
            },
        );
    }

    fn disk_entry(mount_point: &str, total: u64, available: u64) -> DiskSpaceEntry {
        DiskSpaceEntry {
            mount_point: PathBuf::from(mount_point),
            total,
            available,
        }
    }
}
