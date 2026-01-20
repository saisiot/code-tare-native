use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use toml::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
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
}

const EXCLUDED_DIRS: &[&str] = &[
    ".",
    "..",
    ".DS_Store",
    "__pycache__",
    "node_modules",
    ".git",
    ".venv",
    "venv",
    ".claude",
    "_project-dashboard",
    "code-tare-native",
];

/// README.md에서 설명 추출
fn extract_description(readme_path: &Path) -> String {
    if let Ok(content) = fs::read_to_string(readme_path) {
        let lines: Vec<&str> = content.lines().filter(|l| !l.trim().is_empty()).collect();
        let mut description = String::new();
        let mut found_title = false;

        for line in lines {
            if line.starts_with('#') {
                found_title = true;
                let title = line.trim_start_matches('#').trim();
                description = title.to_string();
                continue;
            }

            if found_title && !line.starts_with('#') && line.len() > 10 {
                description.push(' ');
                description.push_str(line.trim());
                break;
            }
        }

        if description.is_empty() {
            return "설명 없음".to_string();
        }

        description.chars().take(150).collect()
    } else {
        "설명 없음".to_string()
    }
}

/// Git remote URL 추출
fn extract_git_remote(project_path: &Path) -> Option<String> {
    let git_config_path = project_path.join(".git").join("config");

    if let Ok(content) = fs::read_to_string(git_config_path) {
        for line in content.lines() {
            if line.trim().starts_with("url") {
                if let Some(url) = line.split('=').nth(1) {
                    return Some(url.trim().to_string());
                }
            }
        }
    }

    None
}

/// 마지막 수정 날짜 가져오기
fn get_last_modified_date(project_path: &Path) -> String {
    // .git/logs/HEAD에서 마지막 커밋 날짜 추출
    let git_log_path = project_path.join(".git").join("logs").join("HEAD");

    if let Ok(content) = fs::read_to_string(git_log_path) {
        if let Some(last_line) = content.lines().last() {
            // 로그 형식: ... > timestamp ...
            if let Some(timestamp_str) = last_line.split('>').nth(1) {
                if let Some(timestamp) = timestamp_str.trim().split_whitespace().next() {
                    if let Ok(ts) = timestamp.parse::<i64>() {
                        use chrono::{DateTime, Utc};
                        let dt = DateTime::<Utc>::from_timestamp(ts, 0);
                        if let Some(datetime) = dt {
                            return datetime.to_rfc3339();
                        }
                    }
                }
            }
        }
    }

    // 디렉토리 수정 시간 사용
    if let Ok(metadata) = fs::metadata(project_path) {
        if let Ok(modified) = metadata.modified() {
            use chrono::{DateTime, Utc};
            let datetime: DateTime<Utc> = modified.into();
            return datetime.to_rfc3339();
        }
    }

    use chrono::Utc;
    Utc::now().to_rfc3339()
}

/// 단일 프로젝트 스캔
fn scan_project(project_path: &Path) -> Project {
    let project_name = project_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let mut project = Project {
        name: project_name.clone(),
        path: project_path.to_string_lossy().to_string(),
        project_type: Vec::new(),
        description: "설명 없음".to_string(),
        tech_stack: Vec::new(),
        last_modified: get_last_modified_date(project_path),
        git_remote: None,
        has_tests: false,
        has_ci: false,
    };

    // package.json 확인 (Node.js)
    let package_json_path = project_path.join("package.json");
    if package_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&package_json_path) {
            if let Ok(pkg) = serde_json::from_str::<serde_json::Value>(&content) {
                project.project_type.push("nodejs".to_string());

                if let Some(desc) = pkg.get("description").and_then(|v| v.as_str()) {
                    project.description = desc.to_string();
                }

                // 기술 스택 추출
                let mut deps = Vec::new();
                if let Some(dependencies) = pkg.get("dependencies").and_then(|v| v.as_object()) {
                    deps.extend(dependencies.keys().cloned());
                }
                if let Some(dev_deps) = pkg.get("devDependencies").and_then(|v| v.as_object()) {
                    deps.extend(dev_deps.keys().cloned());
                }
                project.tech_stack = deps.iter().take(10).map(|s| s.to_string()).collect();

                // 테스트 확인
                if let Some(scripts) = pkg.get("scripts").and_then(|v| v.as_object()) {
                    if scripts.contains_key("test") || scripts.contains_key("test:unit") {
                        project.has_tests = true;
                    }
                }
            }
        }
    }

    // pyproject.toml 확인 (Python Poetry)
    let pyproject_path = project_path.join("pyproject.toml");
    if pyproject_path.exists() {
        if let Ok(content) = fs::read_to_string(&pyproject_path) {
            if let Ok(config) = content.parse::<Value>() {
                project.project_type.push("python-poetry".to_string());

                if let Some(desc) = config
                    .get("tool")
                    .and_then(|t| t.get("poetry"))
                    .and_then(|p| p.get("description"))
                    .and_then(|d| d.as_str())
                {
                    project.description = desc.to_string();
                }

                // 의존성 추출
                if let Some(deps) = config
                    .get("tool")
                    .and_then(|t| t.get("poetry"))
                    .and_then(|p| p.get("dependencies"))
                    .and_then(|d| d.as_table())
                {
                    let dep_list: Vec<String> = deps
                        .keys()
                        .filter(|k| k.as_str() != "python")
                        .take(10)
                        .map(|k| k.to_string())
                        .collect();
                    project.tech_stack.extend(dep_list);
                }
            }
        }
    }

    // requirements.txt 확인 (Python pip)
    let requirements_path = project_path.join("requirements.txt");
    if requirements_path.exists() {
        if let Ok(content) = fs::read_to_string(&requirements_path) {
            let deps: Vec<String> = content
                .lines()
                .map(|l| l.trim())
                .filter(|l| !l.is_empty() && !l.starts_with('#'))
                .filter_map(|l| {
                    l.split(&['=', '<', '>'][..])
                        .next()
                        .map(|s| s.to_string())
                })
                .take(10)
                .collect();

            project.project_type.push("python-pip".to_string());
            project.tech_stack.extend(deps);
        }
    }

    // README.md 확인
    let readme_path = project_path.join("README.md");
    if readme_path.exists() && project.description == "설명 없음" {
        project.description = extract_description(&readme_path);
    }

    // Git 정보
    project.git_remote = extract_git_remote(project_path);

    // CI 파일 확인
    let ci_paths = vec![
        project_path.join(".github").join("workflows"),
        project_path.join(".gitlab-ci.yml"),
        project_path.join(".travis.yml"),
    ];
    project.has_ci = ci_paths.iter().any(|p| p.exists());

    // 테스트 폴더 확인
    if !project.has_tests {
        let test_dirs = vec!["test", "tests", "__tests__", "spec"];
        project.has_tests = test_dirs
            .iter()
            .any(|dir| project_path.join(dir).exists());
    }

    project
}

/// 모든 프로젝트 스캔
pub fn scan_all_projects(workspace_path: &str) -> Result<Vec<Project>, String> {
    println!("Scanning projects in: {}", workspace_path);

    let workspace = Path::new(workspace_path);
    if !workspace.exists() {
        return Err(format!("Workspace path does not exist: {}", workspace_path));
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(workspace)
        .map_err(|e| format!("Failed to read workspace directory: {}", e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name().to_string_lossy().to_string();

            if EXCLUDED_DIRS.contains(&file_name.as_str()) {
                continue;
            }

            let path = entry.path();
            if path.is_dir() {
                let project = scan_project(&path);
                projects.push(project);
            }
        }
    }

    println!("Found {} projects", projects.len());
    Ok(projects)
}
