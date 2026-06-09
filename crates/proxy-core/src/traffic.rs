use std::collections::BTreeMap;

pub type RequestHeaders = BTreeMap<String, String>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TrafficStatus {
    Pending,
    Complete(u16),
    Tunnel,
    Failed(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TrafficEntry {
    pub id: String,
    pub method: String,
    pub url: String,
    pub host: String,
    pub path: String,
    pub request_headers: RequestHeaders,
    pub status: TrafficStatus,
    pub started_at_epoch_ms: u128,
    pub duration_ms: Option<u128>,
    pub matched_rule_ids: Vec<String>,
}
