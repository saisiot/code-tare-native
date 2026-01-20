import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseToml } from 'toml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// code_workshop 디렉토리 경로 (이 프로젝트의 부모 디렉토리)
const WORKSPACE_PATH = path.join(__dirname, '../..');

// 스캔에서 제외할 디렉토리
const EXCLUDED_DIRS = [
  '.', '..', '.DS_Store', '__pycache__', 'node_modules',
  '.git', '.venv', 'venv', '.claude', '_project-dashboard'
];

/**
 * README.md에서 설명 추출
 */
function extractDescription(readmePath) {
  try {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    // 첫 번째 제목(#) 다음의 텍스트 추출
    let description = '';
    let foundTitle = false;

    for (const line of lines) {
      if (line.startsWith('#')) {
        foundTitle = true;
        // 제목에서 # 제거하고 설명으로 사용
        description = line.replace(/^#+\s*/, '').trim();
        continue;
      }

      if (foundTitle && !line.startsWith('#') && line.length > 10) {
        description += ' ' + line.trim();
        break;
      }
    }

    return description.slice(0, 150) || '설명 없음';
  } catch (error) {
    return '설명 없음';
  }
}

/**
 * Git remote URL 추출
 */
function extractGitRemote(projectPath) {
  try {
    const gitConfigPath = path.join(projectPath, '.git', 'config');
    if (!fs.existsSync(gitConfigPath)) return null;

    const config = fs.readFileSync(gitConfigPath, 'utf-8');
    const match = config.match(/url\s*=\s*(.+)/);
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

/**
 * 마지막 수정 날짜 가져오기
 */
function getLastModifiedDate(projectPath) {
  try {
    // .git/logs/HEAD가 있으면 마지막 커밋 날짜 사용
    const gitLogPath = path.join(projectPath, '.git', 'logs', 'HEAD');
    if (fs.existsSync(gitLogPath)) {
      const logs = fs.readFileSync(gitLogPath, 'utf-8').trim().split('\n');
      const lastLog = logs[logs.length - 1];
      const match = lastLog.match(/>\s+(\d+)/);
      if (match) {
        return new Date(parseInt(match[1]) * 1000).toISOString();
      }
    }

    // 그렇지 않으면 디렉토리 수정 시간 사용
    const stats = fs.statSync(projectPath);
    return stats.mtime.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * 단일 프로젝트 스캔
 */
function scanProject(projectPath) {
  const projectName = path.basename(projectPath);

  const project = {
    name: projectName,
    path: projectPath,
    type: [],
    description: '설명 없음',
    techStack: [],
    lastModified: getLastModifiedDate(projectPath),
    gitRemote: null,
    hasTests: false,
    hasCI: false
  };

  // package.json 확인 (Node.js/TypeScript)
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      project.type.push('nodejs');

      if (pkg.description) {
        project.description = pkg.description;
      }

      // 기술 스택 추출
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      project.techStack = Object.keys(deps).slice(0, 10);

      // 테스트 확인
      if (pkg.scripts && (pkg.scripts.test || pkg.scripts['test:unit'])) {
        project.hasTests = true;
      }
    } catch (error) {
      console.error(`Error parsing package.json in ${projectName}:`, error.message);
    }
  }

  // pyproject.toml 확인 (Python Poetry)
  const pyprojectPath = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, 'utf-8');
      const config = parseToml(content);

      project.type.push('python-poetry');

      if (config.tool?.poetry?.description) {
        project.description = config.tool.poetry.description;
      }

      // 의존성 추출
      if (config.tool?.poetry?.dependencies) {
        const deps = Object.keys(config.tool.poetry.dependencies).filter(d => d !== 'python');
        project.techStack = [...project.techStack, ...deps.slice(0, 10)];
      }
    } catch (error) {
      console.error(`Error parsing pyproject.toml in ${projectName}:`, error.message);
    }
  }

  // requirements.txt 확인 (Python pip)
  const requirementsPath = path.join(projectPath, 'requirements.txt');
  if (fs.existsSync(requirementsPath)) {
    try {
      const content = fs.readFileSync(requirementsPath, 'utf-8');
      const deps = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split(/[=<>]/)[0])
        .slice(0, 10);

      project.type.push('python-pip');
      project.techStack = [...project.techStack, ...deps];
    } catch (error) {
      console.error(`Error parsing requirements.txt in ${projectName}:`, error.message);
    }
  }

  // README.md 확인
  const readmePath = path.join(projectPath, 'README.md');
  if (fs.existsSync(readmePath) && project.description === '설명 없음') {
    project.description = extractDescription(readmePath);
  }

  // Git 정보
  project.gitRemote = extractGitRemote(projectPath);

  // CI 파일 확인
  const ciPaths = [
    path.join(projectPath, '.github', 'workflows'),
    path.join(projectPath, '.gitlab-ci.yml'),
    path.join(projectPath, '.travis.yml')
  ];

  project.hasCI = ciPaths.some(p => fs.existsSync(p));

  // 테스트 폴더 확인
  const testDirs = ['test', 'tests', '__tests__', 'spec'];
  if (!project.hasTests) {
    project.hasTests = testDirs.some(dir =>
      fs.existsSync(path.join(projectPath, dir))
    );
  }

  return project;
}

/**
 * 모든 프로젝트 스캔
 */
export function scanAllProjects() {
  console.log(`Scanning projects in: ${WORKSPACE_PATH}`);

  const projects = [];
  const entries = fs.readdirSync(WORKSPACE_PATH);

  for (const entry of entries) {
    if (EXCLUDED_DIRS.includes(entry)) continue;

    const fullPath = path.join(WORKSPACE_PATH, entry);

    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        const project = scanProject(fullPath);
        projects.push(project);
      }
    } catch (error) {
      console.error(`Error scanning ${entry}:`, error.message);
    }
  }

  console.log(`Found ${projects.length} projects`);
  return projects;
}
