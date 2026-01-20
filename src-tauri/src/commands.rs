use crate::scanner::scan_all_projects;
use crate::settings::{load_settings, save_settings, AppSettings};
use crate::tags::{
    add_category_tag, delete_category_tag, get_project_tags, load_project_tags,
    load_tag_colors, load_tag_definitions, set_project_tags, ProjectTags,
    TagColors, TagDefinitions,
};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectsResponse {
    pub success: bool,
    pub count: usize,
    pub projects: Vec<ProjectWithTags>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectWithTags {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub project_type: Vec<String>,
    pub description: String,
    pub tech_stack: Vec<String>,
    pub last_modified: String,
    pub git_remote: Option<String>,
    pub has_tests: bool,
    pub has_ci: bool,
    pub tags: ProjectTags,
}

#[derive(Debug, Serialize)]
pub struct TagsResponse {
    pub success: bool,
    pub definitions: TagDefinitions,
    pub colors: TagColors,
}

#[derive(Debug, Serialize)]
pub struct SimpleResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ReadmeResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagManageResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub definitions: Option<TagDefinitions>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colors: Option<TagColors>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projects_using_tag: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagManageRequest {
    pub action: String,
    pub tag: String,
}

/// 모든 프로젝트 목록 반환
#[command]
pub fn get_projects() -> ProjectsResponse {
    let settings = load_settings();
    match scan_all_projects(&settings.scan_path, &settings.excluded_folders) {
        Ok(projects) => {
            let project_tags = load_project_tags();

            let projects_with_tags: Vec<ProjectWithTags> = projects
                .into_iter()
                .map(|project| {
                    let tags = project_tags
                        .get(&project.name)
                        .cloned()
                        .unwrap_or_else(|| ProjectTags {
                            custom_title: None,
                            progress: "계획중".to_string(),
                            categories: Vec::new(),
                            favorite: false,
                            archived: false,
                            notes: String::new(),
                        });

                    ProjectWithTags {
                        name: project.name,
                        path: project.path,
                        project_type: project.project_type,
                        description: project.description,
                        tech_stack: project.tech_stack,
                        last_modified: project.last_modified,
                        git_remote: project.git_remote,
                        has_tests: project.has_tests,
                        has_ci: project.has_ci,
                        tags,
                    }
                })
                .collect();

            ProjectsResponse {
                success: true,
                count: projects_with_tags.len(),
                projects: projects_with_tags,
            }
        }
        Err(_e) => ProjectsResponse {
            success: false,
            count: 0,
            projects: Vec::new(),
        },
    }
}

/// 사용 가능한 모든 태그 반환
#[command]
pub fn get_available_tags() -> TagsResponse {
    println!("🔍 get_available_tags 호출됨");
    let definitions = load_tag_definitions();
    let colors = load_tag_colors();

    println!("✅ 태그 정의 로드: progress={}, categories={}",
             definitions.progress.len(),
             definitions.categories.len());

    TagsResponse {
        success: true,
        definitions,
        colors,
    }
}

/// 특정 프로젝트의 태그 반환
#[command]
pub fn get_tags(project_name: String) -> Result<ProjectTags, String> {
    Ok(get_project_tags(&project_name))
}

/// 특정 프로젝트의 태그 저장
#[command]
pub fn save_tags(project_name: String, tags: ProjectTags) -> SimpleResponse {
    println!("🔍 save_tags 호출됨: project_name={}, tags={:?}", project_name, tags);

    match set_project_tags(&project_name, tags) {
        Ok(_) => {
            println!("✅ 태그 저장 성공: {}", project_name);
            SimpleResponse {
                success: true,
                message: None,
            }
        }
        Err(e) => {
            println!("❌ 태그 저장 실패: {} - 오류: {}", project_name, e);
            SimpleResponse {
                success: false,
                message: Some(e),
            }
        }
    }
}

/// 전역 태그 추가/삭제
#[command]
pub fn manage_tag(action: String, tag: String) -> TagManageResponse {
    match action.as_str() {
        "add" => match add_category_tag(&tag) {
            Ok((definitions, colors)) => TagManageResponse {
                success: true,
                message: None,
                definitions: Some(definitions),
                colors: Some(colors),
                projects_using_tag: None,
            },
            Err(e) => TagManageResponse {
                success: false,
                message: Some(e),
                definitions: None,
                colors: None,
                projects_using_tag: None,
            },
        },
        "delete" => match delete_category_tag(&tag) {
            Ok((definitions, colors)) => TagManageResponse {
                success: true,
                message: None,
                definitions: Some(definitions),
                colors: Some(colors),
                projects_using_tag: None,
            },
            Err(e) => {
                // 에러 메시지에서 프로젝트 목록 추출
                if e.starts_with("Tag is in use by:") {
                    // "Tag is in use by: [\"project1\", \"project2\"]" 형태
                    let projects_str = e.replace("Tag is in use by: ", "");
                    let projects: Vec<String> = serde_json::from_str(&projects_str).unwrap_or_default();
                    TagManageResponse {
                        success: false,
                        message: Some(e.clone()),
                        definitions: None,
                        colors: None,
                        projects_using_tag: Some(projects),
                    }
                } else {
                    TagManageResponse {
                        success: false,
                        message: Some(e),
                        definitions: None,
                        colors: None,
                        projects_using_tag: None,
                    }
                }
            }
        },
        _ => TagManageResponse {
            success: false,
            message: Some("Invalid action".to_string()),
            definitions: None,
            colors: None,
            projects_using_tag: None,
        },
    }
}

/// 프로젝트 열기
#[command]
pub async fn open_project(path: String, app: String, url: Option<String>) -> SimpleResponse {
    let settings = load_settings();

    match app.as_str() {
        "claude" => {
            // 설정에서 읽은 터미널 앱으로 폴더 열기
            #[cfg(target_os = "macos")]
            {
                if let Err(e) = std::process::Command::new("open")
                    .args(&["-a", &settings.terminal_app, &path])
                    .spawn()
                {
                    return SimpleResponse {
                        success: false,
                        message: Some(format!("Failed to open {}: {}", settings.terminal_app, e)),
                    };
                }
            }

            SimpleResponse {
                success: true,
                message: None,
            }
        }
        "vscode" => {
            // 설정에서 읽은 에디터 커맨드로 폴더 열기
            #[cfg(target_os = "macos")]
            {
                if let Err(e) = std::process::Command::new(&settings.editor_command).arg(&path).spawn() {
                    return SimpleResponse {
                        success: false,
                        message: Some(format!("Failed to open editor: {}", e)),
                    };
                }
            }

            SimpleResponse {
                success: true,
                message: None,
            }
        }
        "finder" => {
            #[cfg(target_os = "macos")]
            {
                if let Err(e) = std::process::Command::new("open").arg(&path).spawn() {
                    return SimpleResponse {
                        success: false,
                        message: Some(format!("Failed to open Finder: {}", e)),
                    };
                }
            }

            SimpleResponse {
                success: true,
                message: None,
            }
        }
        "github" => {
            if let Some(github_url) = url {
                #[cfg(target_os = "macos")]
                {
                    if let Err(e) = std::process::Command::new("open").arg(&github_url).spawn() {
                        return SimpleResponse {
                            success: false,
                            message: Some(format!("Failed to open GitHub: {}", e)),
                        };
                    }
                }

                SimpleResponse {
                    success: true,
                    message: None,
                }
            } else {
                SimpleResponse {
                    success: false,
                    message: Some("GitHub URL not provided".to_string()),
                }
            }
        }
        _ => SimpleResponse {
            success: false,
            message: Some("Unknown application".to_string()),
        },
    }
}

/// 설정 가져오기
#[command]
pub fn get_settings() -> AppSettings {
    load_settings()
}

/// 설정 업데이트
#[command]
pub fn update_settings(settings: AppSettings) -> SimpleResponse {
    match save_settings(&settings) {
        Ok(_) => SimpleResponse {
            success: true,
            message: None,
        },
        Err(e) => SimpleResponse {
            success: false,
            message: Some(e),
        },
    }
}

/// 사용 설명서 내용 가져오기
#[command]
pub fn get_readme() -> ReadmeResponse {
    // 컴파일 타임에 USER_GUIDE.md 내용을 포함
    const USER_GUIDE: &str = include_str!("USER_GUIDE.md");

    ReadmeResponse {
        success: true,
        content: Some(USER_GUIDE.to_string()),
        message: None,
    }
}
