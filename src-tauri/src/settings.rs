use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub scan_path: String,
    pub terminal_app: String,
    pub editor_command: String,
    pub excluded_folders: Vec<String>,
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
            terminal_app: "Warp".to_string(),
            editor_command: "code".to_string(),
            excluded_folders: vec![
                "node_modules".to_string(),
                ".git".to_string(),
                ".cache".to_string(),
                "target".to_string(),
                "dist".to_string(),
                "build".to_string(),
                ".next".to_string(),
                ".nuxt".to_string(),
                "venv".to_string(),
                "__pycache__".to_string(),
                ".venv".to_string(),
            ],
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
