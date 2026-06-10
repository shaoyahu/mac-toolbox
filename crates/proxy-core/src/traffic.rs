use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

pub type RequestHeaders = BTreeMap<String, String>;
pub type ResponseHeaders = BTreeMap<String, String>;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", tag = "kind", content = "value")]
pub enum TrafficStatus {
    Pending,
    Complete(u16),
    Tunnel,
    Failed(String),
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TrafficEntry {
    pub id: String,
    pub method: String,
    pub url: String,
    pub host: String,
    pub path: String,
    pub request_headers: RequestHeaders,
    pub request_body: Option<String>,
    pub response_headers: ResponseHeaders,
    pub response_body: Option<String>,
    pub status: TrafficStatus,
    pub started_at_epoch_ms: u128,
    pub duration_ms: Option<u128>,
    pub matched_rule_ids: Vec<String>,
}
