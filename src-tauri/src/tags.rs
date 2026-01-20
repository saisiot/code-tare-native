use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTags {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_title: Option<String>,
    pub progress: String,
    pub categories: Vec<String>,
    pub favorite: bool,
    pub archived: bool,
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagDefinitions {
    pub progress: Vec<String>,
    pub categories: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TagColors {
    pub progress: HashMap<String, String>,
    pub categories: HashMap<String, String>,
}

const PROGRESS_TAGS: &[&str] = &["진행중", "중지", "완료", "계획중", "deprecated"];

const DEFAULT_CATEGORY_TAGS: &[&str] = &[
    "AI",
    "웹앱",
    "CLI",
    "봇",
    "스크래퍼",
    "자동화",
    "지식관리",
    "Obsidian",
    "에이전트",
    "데이터수집",
    "문서변환",
];

const TAILWIND_COLORS: &[&str] = &[
    "bg-purple-100 text-purple-800",
    "bg-indigo-100 text-indigo-800",
    "bg-blue-100 text-blue-800",
    "bg-cyan-100 text-cyan-800",
    "bg-teal-100 text-teal-800",
    "bg-emerald-100 text-emerald-800",
    "bg-green-100 text-green-800",
    "bg-lime-100 text-lime-800",
    "bg-yellow-100 text-yellow-800",
    "bg-amber-100 text-amber-800",
    "bg-orange-100 text-orange-800",
    "bg-pink-100 text-pink-800",
    "bg-rose-100 text-rose-800",
    "bg-violet-100 text-violet-800",
    "bg-fuchsia-100 text-fuchsia-800",
];

fn get_data_dir() -> PathBuf {
    // 프로젝트 루트의 data 디렉토리 사용
    let data_dir = PathBuf::from("data");
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).ok();
    }
    data_dir
}

fn get_project_tags_file() -> PathBuf {
    get_data_dir().join("project-tags.json")
}

fn get_tag_definitions_file() -> PathBuf {
    get_data_dir().join("tag-definitions.json")
}

fn get_tag_colors_file() -> PathBuf {
    get_data_dir().join("tag-colors.json")
}

/// 프로젝트 태그 데이터 로드
pub fn load_project_tags() -> HashMap<String, ProjectTags> {
    let file_path = get_project_tags_file();

    if !file_path.exists() {
        return HashMap::new();
    }

    match fs::read_to_string(&file_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => HashMap::new(),
    }
}

/// 프로젝트 태그 데이터 저장
pub fn save_project_tags(tags: &HashMap<String, ProjectTags>) -> Result<(), String> {
    let file_path = get_project_tags_file();

    let content = serde_json::to_string_pretty(tags)
        .map_err(|e| format!("Failed to serialize tags: {}", e))?;

    fs::write(&file_path, content).map_err(|e| format!("Failed to write tags file: {}", e))?;

    Ok(())
}

/// 태그 정의 로드
pub fn load_tag_definitions() -> TagDefinitions {
    let file_path = get_tag_definitions_file();

    if !file_path.exists() {
        let defaults = TagDefinitions {
            progress: PROGRESS_TAGS.iter().map(|s| s.to_string()).collect(),
            categories: DEFAULT_CATEGORY_TAGS.iter().map(|s| s.to_string()).collect(),
        };
        save_tag_definitions(&defaults).ok();
        return defaults;
    }

    match fs::read_to_string(&file_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| TagDefinitions {
            progress: PROGRESS_TAGS.iter().map(|s| s.to_string()).collect(),
            categories: DEFAULT_CATEGORY_TAGS.iter().map(|s| s.to_string()).collect(),
        }),
        Err(_) => TagDefinitions {
            progress: PROGRESS_TAGS.iter().map(|s| s.to_string()).collect(),
            categories: DEFAULT_CATEGORY_TAGS.iter().map(|s| s.to_string()).collect(),
        },
    }
}

/// 태그 정의 저장
pub fn save_tag_definitions(definitions: &TagDefinitions) -> Result<(), String> {
    let file_path = get_tag_definitions_file();

    let content = serde_json::to_string_pretty(definitions)
        .map_err(|e| format!("Failed to serialize definitions: {}", e))?;

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write definitions file: {}", e))?;

    Ok(())
}

/// 태그 색상 로드
pub fn load_tag_colors() -> TagColors {
    let file_path = get_tag_colors_file();

    if !file_path.exists() {
        let defaults = get_default_tag_colors();
        save_tag_colors(&defaults).ok();
        return defaults;
    }

    match fs::read_to_string(&file_path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| get_default_tag_colors()),
        Err(_) => get_default_tag_colors(),
    }
}

fn get_default_tag_colors() -> TagColors {
    let mut progress = HashMap::new();
    progress.insert(
        "진행중".to_string(),
        "bg-green-100 text-green-800 border-green-300".to_string(),
    );
    progress.insert(
        "중지".to_string(),
        "bg-gray-100 text-gray-800 border-gray-300".to_string(),
    );
    progress.insert(
        "완료".to_string(),
        "bg-blue-100 text-blue-800 border-blue-300".to_string(),
    );
    progress.insert(
        "계획중".to_string(),
        "bg-orange-100 text-orange-800 border-orange-300".to_string(),
    );
    progress.insert(
        "deprecated".to_string(),
        "bg-red-100 text-red-800 border-red-300".to_string(),
    );

    let mut categories = HashMap::new();
    categories.insert("AI".to_string(), "bg-purple-100 text-purple-800".to_string());
    categories.insert("웹앱".to_string(), "bg-indigo-100 text-indigo-800".to_string());
    categories.insert("CLI".to_string(), "bg-slate-100 text-slate-800".to_string());
    categories.insert("봇".to_string(), "bg-pink-100 text-pink-800".to_string());
    categories.insert(
        "스크래퍼".to_string(),
        "bg-orange-100 text-orange-800".to_string(),
    );
    categories.insert("자동화".to_string(), "bg-cyan-100 text-cyan-800".to_string());
    categories.insert(
        "지식관리".to_string(),
        "bg-amber-100 text-amber-800".to_string(),
    );
    categories.insert(
        "Obsidian".to_string(),
        "bg-violet-100 text-violet-800".to_string(),
    );
    categories.insert(
        "에이전트".to_string(),
        "bg-fuchsia-100 text-fuchsia-800".to_string(),
    );
    categories.insert(
        "데이터수집".to_string(),
        "bg-teal-100 text-teal-800".to_string(),
    );
    categories.insert(
        "문서변환".to_string(),
        "bg-emerald-100 text-emerald-800".to_string(),
    );
    categories.insert("default".to_string(), "bg-gray-100 text-gray-600".to_string());

    TagColors {
        progress,
        categories,
    }
}

/// 태그 색상 저장
pub fn save_tag_colors(colors: &TagColors) -> Result<(), String> {
    let file_path = get_tag_colors_file();

    let content = serde_json::to_string_pretty(colors)
        .map_err(|e| format!("Failed to serialize colors: {}", e))?;

    fs::write(&file_path, content).map_err(|e| format!("Failed to write colors file: {}", e))?;

    Ok(())
}

/// 랜덤 색상 할당
pub fn assign_random_color() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let index = rng.gen_range(0..TAILWIND_COLORS.len());
    TAILWIND_COLORS[index].to_string()
}

/// 구분 태그 추가
pub fn add_category_tag(tag: &str) -> Result<(TagDefinitions, TagColors), String> {
    let mut definitions = load_tag_definitions();

    if definitions.categories.contains(&tag.to_string()) {
        return Err("Tag already exists".to_string());
    }

    definitions.categories.push(tag.to_string());
    save_tag_definitions(&definitions)?;

    // 새 태그에 색상 할당
    let mut colors = load_tag_colors();
    if !colors.categories.contains_key(tag) {
        colors
            .categories
            .insert(tag.to_string(), assign_random_color());
        save_tag_colors(&colors)?;
    }

    Ok((definitions, colors))
}

/// 구분 태그 삭제
pub fn delete_category_tag(tag: &str) -> Result<(TagDefinitions, TagColors), String> {
    let mut definitions = load_tag_definitions();

    let index = definitions
        .categories
        .iter()
        .position(|t| t == tag)
        .ok_or("Tag not found".to_string())?;

    // 태그를 사용 중인 프로젝트 확인
    let project_tags = load_project_tags();
    let projects_using_tag: Vec<String> = project_tags
        .iter()
        .filter(|(_, tags)| tags.categories.contains(&tag.to_string()))
        .map(|(name, _)| name.clone())
        .collect();

    if !projects_using_tag.is_empty() {
        return Err(format!("Tag is in use by: {:?}", projects_using_tag));
    }

    // 태그 삭제
    definitions.categories.remove(index);
    save_tag_definitions(&definitions)?;

    // 색상 정의도 삭제
    let mut colors = load_tag_colors();
    colors.categories.remove(tag);
    save_tag_colors(&colors)?;

    Ok((definitions, colors))
}

/// 태그 색상 업데이트
pub fn update_tag_color(tag: &str, color: &str) -> Result<TagColors, String> {
    let mut colors = load_tag_colors();
    colors.categories.insert(tag.to_string(), color.to_string());
    save_tag_colors(&colors)?;
    Ok(colors)
}

/// 특정 프로젝트의 태그 가져오기
pub fn get_project_tags(project_name: &str) -> ProjectTags {
    let all_tags = load_project_tags();

    all_tags.get(project_name).cloned().unwrap_or(ProjectTags {
        custom_title: None,
        progress: "계획중".to_string(),
        categories: Vec::new(),
        favorite: false,
        archived: false,
        notes: String::new(),
    })
}

/// 특정 프로젝트의 태그 저장
pub fn set_project_tags(project_name: &str, mut tags: ProjectTags) -> Result<(), String> {
    // customTitle 유효성 검사
    if let Some(ref title) = tags.custom_title {
        let trimmed = title.trim();
        if trimmed.is_empty() || trimmed.len() > 50 {
            tags.custom_title = None;
        } else {
            tags.custom_title = Some(trimmed.to_string());
        }
    }

    let mut all_tags = load_project_tags();
    all_tags.insert(project_name.to_string(), tags);
    save_project_tags(&all_tags)?;

    Ok(())
}
