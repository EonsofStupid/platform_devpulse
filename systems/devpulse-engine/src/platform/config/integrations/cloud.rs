//! The DevPulse account (devpulse.app): `[integrations.cloud.auth]` in
//! `config/platform/integrations/cloud.toml`, or in your `{data_dir}/platform.toml`.
//!
//! Supabase auth for the first-run account step (plan 0001, Account step A1).
//! Both values are public by design: the anon key ships to every client, and
//! the project's row-level security guards the data. The desktop backend
//! lets the OS keychain entry `cloud_supabase_anon_key` override the anon key,
//! for a self-hosted project.

use serde::Deserialize;

/// The cloud integration's configuration.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CloudConfig {
    /// The account's auth endpoint.
    #[serde(default)]
    pub auth: CloudAuthConfig,
}

/// Where the DevPulse account signs in. An empty value means not configured.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CloudAuthConfig {
    /// The Supabase project's API URL.
    #[serde(default)]
    pub url: String,
    /// The project's public anon key.
    #[serde(default)]
    pub anon_key: String,
}

impl CloudAuthConfig {
    /// The project URL, when configured.
    #[must_use]
    pub fn url(&self) -> Option<&str> {
        non_empty(&self.url)
    }

    /// The anon key, when configured.
    #[must_use]
    pub fn anon_key(&self) -> Option<&str> {
        non_empty(&self.anon_key)
    }
}

fn non_empty(value: &str) -> Option<&str> {
    let trimmed = value.trim();
    (!trimmed.is_empty()).then_some(trimmed)
}

#[cfg(test)]
mod tests {
    use crate::platform::config::loader::DEFAULT_CONFIG;
    use crate::platform::config::PlatformBootConfig;

    #[test]
    fn the_shipped_config_names_the_auth_endpoint() {
        let config: PlatformBootConfig = match toml::from_str(DEFAULT_CONFIG) {
            Ok(config) => config,
            Err(e) => panic!("the shipped platform config must parse: {e}"),
        };
        let auth = &config.integrations.cloud.auth;
        let url = auth.url().unwrap_or_default();
        assert!(url.starts_with("https://"), "auth url {url:?}");
    }

    #[test]
    fn blank_values_are_not_configured() {
        let auth: super::CloudAuthConfig = match toml::from_str("url = \"  \"\nanon_key = \"\"") {
            Ok(auth) => auth,
            Err(e) => panic!("parses: {e}"),
        };
        assert_eq!(auth.url(), None);
        assert_eq!(auth.anon_key(), None);
    }

    #[test]
    fn unknown_keys_are_refused() {
        assert!(toml::from_str::<super::CloudAuthConfig>("service_key = \"x\"").is_err());
    }
}
