use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub scan_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        let default_path = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("/"))
            .join("code_workshop")
            .to_string_lossy()
            .to_string();

        AppSettings {
            scan_path: default_path,
        }
    }
}

fn get_settings_file() -> PathBuf {
    let data_dir = PathBuf::from("data");
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).ok();
    }
    data_dir.join("settings.json")
}

pub fn load_settings() -> AppSettings {
    let settings_path = get_settings_file();

    if let Ok(content) = fs::read_to_string(&settings_path) {
        if let Ok(settings) = serde_json::from_str(&content) {
            return settings;
        }
    }

    // 기본값 반환 및 저장
    let default_settings = AppSettings::default();
    save_settings(&default_settings).ok();
    default_settings
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let settings_path = get_settings_file();
    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;
    Ok(())
}
