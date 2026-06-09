use std::collections::BTreeMap;

use proxy_core::rules::{
    HeaderMutation, HeaderRule, MatchOperator, RuleMatcher, RuleSet,
};

fn headers(values: &[(&str, &str)]) -> BTreeMap<String, String> {
    values
        .iter()
        .map(|(name, value)| (name.to_string(), value.to_string()))
        .collect()
}

#[test]
fn matches_hosts_by_exact_value_and_contains() {
    let exact = RuleMatcher::host(MatchOperator::Exact, "api.example.test");
    let contains = RuleMatcher::host(MatchOperator::Contains, "example");

    assert!(exact.matches("api.example.test", "/v1/users"));
    assert!(!exact.matches("cdn.example.test", "/v1/users"));
    assert!(contains.matches("cdn.example.test", "/assets"));
}

#[test]
fn matches_paths_by_prefix_and_contains() {
    let prefix = RuleMatcher::path(MatchOperator::Prefix, "/api");
    let contains = RuleMatcher::path(MatchOperator::Contains, "users");

    assert!(prefix.matches("example.test", "/api/v1"));
    assert!(!prefix.matches("example.test", "/public/api"));
    assert!(contains.matches("example.test", "/api/users/42"));
}

#[test]
fn applies_add_replace_and_delete_header_mutations() {
    let rule = HeaderRule {
        id: "rule-1".to_string(),
        name: "Debug headers".to_string(),
        enabled: true,
        matchers: vec![RuleMatcher::host(MatchOperator::Contains, "example")],
        mutations: vec![
            HeaderMutation::add("x-added", "yes"),
            HeaderMutation::replace("x-mode", "debug"),
            HeaderMutation::delete("authorization"),
        ],
    };
    let rules = RuleSet::new(vec![rule]);
    let mut request_headers = headers(&[
        ("x-mode", "prod"),
        ("authorization", "Bearer secret"),
    ]);

    let matched = rules.apply("api.example.test", "/api", &mut request_headers);

    assert_eq!(matched, vec!["rule-1".to_string()]);
    assert_eq!(request_headers.get("x-added"), Some(&"yes".to_string()));
    assert_eq!(request_headers.get("x-mode"), Some(&"debug".to_string()));
    assert!(!request_headers.contains_key("authorization"));
}
