use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

pub type HeaderMap = BTreeMap<String, String>;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum MatchOperator {
    Exact,
    Contains,
    Prefix,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum RuleMatcher {
    Host {
        operator: MatchOperator,
        value: String,
    },
    Path {
        operator: MatchOperator,
        value: String,
    },
}

impl RuleMatcher {
    pub fn host(operator: MatchOperator, value: impl Into<String>) -> Self {
        Self::Host {
            operator,
            value: value.into(),
        }
    }

    pub fn path(operator: MatchOperator, value: impl Into<String>) -> Self {
        Self::Path {
            operator,
            value: value.into(),
        }
    }

    pub fn matches(&self, host: &str, path: &str) -> bool {
        match self {
            Self::Host { operator, value } => matches_value(operator, host, value),
            Self::Path { operator, value } => matches_value(operator, path, value),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum HeaderMutation {
    Add { name: String, value: String },
    Replace { name: String, value: String },
    Delete { name: String },
}

impl HeaderMutation {
    pub fn add(name: impl Into<String>, value: impl Into<String>) -> Self {
        Self::Add {
            name: normalize_header_name(name),
            value: value.into(),
        }
    }

    pub fn replace(name: impl Into<String>, value: impl Into<String>) -> Self {
        Self::Replace {
            name: normalize_header_name(name),
            value: value.into(),
        }
    }

    pub fn delete(name: impl Into<String>) -> Self {
        Self::Delete {
            name: normalize_header_name(name),
        }
    }

    fn apply(&self, headers: &mut HeaderMap) {
        match self {
            Self::Add { name, value } | Self::Replace { name, value } => {
                headers.insert(name.clone(), value.clone());
            }
            Self::Delete { name } => {
                headers.remove(name);
            }
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HeaderRule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub matchers: Vec<RuleMatcher>,
    pub mutations: Vec<HeaderMutation>,
}

impl HeaderRule {
    fn matches(&self, host: &str, path: &str) -> bool {
        self.enabled && self.matchers.iter().all(|matcher| matcher.matches(host, path))
    }
}

#[derive(Debug, Clone, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuleSet {
    rules: Vec<HeaderRule>,
}

impl RuleSet {
    pub fn new(rules: Vec<HeaderRule>) -> Self {
        Self { rules }
    }

    pub fn rules(&self) -> &[HeaderRule] {
        &self.rules
    }

    pub fn apply(&self, host: &str, path: &str, headers: &mut HeaderMap) -> Vec<String> {
        let mut matched_rule_ids = Vec::new();

        for rule in &self.rules {
            if rule.matches(host, path) {
                for mutation in &rule.mutations {
                    mutation.apply(headers);
                }
                matched_rule_ids.push(rule.id.clone());
            }
        }

        matched_rule_ids
    }
}

fn matches_value(operator: &MatchOperator, candidate: &str, value: &str) -> bool {
    match operator {
        MatchOperator::Exact => candidate == value,
        MatchOperator::Contains => candidate.contains(value),
        MatchOperator::Prefix => candidate.starts_with(value),
    }
}

fn normalize_header_name(name: impl Into<String>) -> String {
    name.into().trim().to_ascii_lowercase()
}
