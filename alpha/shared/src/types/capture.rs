// shared/src/types/capture.rs

//! Capture types for screenshots and video recordings
//! 
//! Uses Type-First Domain Architecture with strict enums.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Capture scope (Global vs Project)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CaptureScope {
    Global,
    Project,
}

impl std::fmt::Display for CaptureScope {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Global => write!(f, "global"),
            Self::Project => write!(f, "project"),
        }
    }
}

impl std::str::FromStr for CaptureScope {
    type Err = String;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "global" => Ok(Self::Global),
            "project" => Ok(Self::Project),
            _ => Err(format!("Invalid scope: {}", s)),
        }
    }
}

/// Capture type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CaptureType {
    Screenshot,
    ScreenRecording,
    RegionCapture,
}

impl std::fmt::Display for CaptureType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Screenshot => write!(f, "screenshot"),
            Self::ScreenRecording => write!(f, "screen_recording"),
            Self::RegionCapture => write!(f, "region_capture"),
        }
    }
}

/// Basic capture record for GlobalDb
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRecord {
    pub id: Uuid,
    pub filename: String,
    pub file_path: PathBuf,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub file_size: u64,
    pub content_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub rro_yaml_path: Option<PathBuf>,
}

/// Capture relationship edge in knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRelationship {
    /// Relationship type (e.g., "captured_during", "is_mockup_for")
    #[serde(rename = "type")]
    pub rel_type: String,
    
    /// Target URN (e.g., "urn:project:xyz", "urn:feature:login")
    pub target: String,
    
    /// Optional metadata about this relationship
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Full CaptureRRO (YAML-LD serializable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRRO {
    /// JSON-LD context
    #[serde(rename = "@context")]
    pub context: Vec<String>,
    
    /// JSON-LD type
    #[serde(rename = "@type")]
    pub rro_type: String,
    
    /// JSON-LD ID (URN)
    #[serde(rename = "@id")]
    pub rro_id: String,
    
    /// Core capture metadata
    pub capture: CaptureMetadata,
    
    /// Physical storage info
    pub storage: CaptureStorage,
    
    /// Graph relationships
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub relationships: Vec<CaptureRelationship>,
    
    /// Tags for search
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    
    /// User context
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureMetadata {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    #[serde(rename = "type")]
    pub capture_type: CaptureType,
    pub scope: CaptureScope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureStorage {
    pub primary_path: String,
    pub format: String,
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
    pub content_hash: String,
}

impl CaptureRRO {
    /// Create a basic RRO for a screenshot
    pub fn new_screenshot(
        id: Uuid,
        file_path: PathBuf,
        width: u32,
        height: u32,
        file_size: u64,
        content_hash: String,
        scope: CaptureScope,
    ) -> Self {
        let id_str = id.to_string();
        
        Self {
            context: vec![
                "https://devpulse.ai/schemas/rro/v1".to_string(),
                "https://devpulse.ai/schemas/capture/v1".to_string(),
            ],
            rro_type: "CaptureRRO".to_string(),
            rro_id: format!("urn:uuid:{}", id_str),
            capture: CaptureMetadata {
                id: id_str,
                timestamp: Utc::now(),
                capture_type: CaptureType::Screenshot,
                scope,
            },
            storage: CaptureStorage {
                primary_path: file_path.to_string_lossy().to_string(),
                format: "png".to_string(),
                width,
                height,
                file_size,
                content_hash,
            },
            relationships: vec![],
            tags: vec![],
            context_note: None,
        }
    }
    
    /// Add a relationship to the RRO
    pub fn add_relationship(&mut self, rel_type: impl Into<String>, target: impl Into<String>) {
        self.relationships.push(CaptureRelationship {
            rel_type: rel_type.into(),
            target: target.into(),
            metadata: None,
        });
    }
    
    /// Add a tag
    pub fn add_tag(&mut self, tag: impl Into<String>) {
        self.tags.push(tag.into());
    }
    
    /// Serialize to YAML-LD
    pub fn to_yaml(&self) -> Result<String, serde_yaml::Error> {
        serde_yaml::to_string(self)
    }
    
    /// Deserialize from YAML-LD
    pub fn from_yaml(yaml: &str) -> Result<Self, serde_yaml::Error> {
        serde_yaml::from_str(yaml)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_capture_rro_yaml_ld_serialization() {
        let id = Uuid::new_v4();
        let mut rro = CaptureRRO::new_screenshot(
            id,
            PathBuf::from("C:/captures/test_123.png"),
            1920,
            1080,
            245678,
            "sha256:abcdef123456".to_string(),
            CaptureScope::Global,
        );
        
        // Add relationships
        rro.add_relationship("captured_during", "urn:project:my-app-xyz");
        rro.add_relationship("is_mockup_for", "urn:feature:login-form");
        
        // Add tags
        rro.add_tag("ui");
        rro.add_tag("design");
        
        rro.context_note = Some("Final design before implementation".to_string());
        
        // Serialize to YAML-LD
        let yaml = rro.to_yaml().expect("Failed to serialize to YAML");
        
        // Verify JSON-LD context
        assert!(yaml.contains("@context"));
        assert!(yaml.contains("devpulse.ai/schemas/rro/v1"));
        
        // Deserialize back
        let deserialized = CaptureRRO::from_yaml(&yaml).expect("Failed to deserialize");
        assert_eq!(deserialized.capture.id, rro.capture.id);
        assert_eq!(deserialized.relationships.len(), 2);
        assert_eq!(deserialized.tags.len(), 2);
    }
    
    #[test]
    fn test_capture_rro_json_ld_compatible() {
        let id = Uuid::new_v4();
        let rro = CaptureRRO::new_screenshot(
            id,
            PathBuf::from("test.png"),
            800,
            600,
            12345,
            "sha256:test".to_string(),
            CaptureScope::Project,
        );
        
        // Serialize to JSON-LD
        let json = serde_json::to_string_pretty(&rro).expect("Failed to serialize");
        
        // Verify JSON-LD structure
        assert!(json.contains("\"@context\""));
        assert!(json.contains("\"@type\":\"CaptureRRO\""));
        
        // Deserialize from JSON
        let deserialized: CaptureRRO = serde_json::from_str(&json).expect("Failed to deserialize");
        assert_eq!(deserialized.capture.id, rro.capture.id);
    }
}
