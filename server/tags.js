import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const PROJECT_TAGS_FILE = path.join(DATA_DIR, 'project-tags.json');
const TAG_DEFINITIONS_FILE = path.join(DATA_DIR, 'tag-definitions.json');
const TAG_COLORS_FILE = path.join(DATA_DIR, 'tag-colors.json');

// 진행 관련 태그 (시스템 고정)
const PROGRESS_TAGS = ['진행중', '중지', '완료', '계획중', 'deprecated'];

// 초기 구분 태그
const DEFAULT_CATEGORY_TAGS = [
  'AI', '웹앱', 'CLI', '봇', '스크래퍼', '자동화',
  '지식관리', 'Obsidian', '에이전트', '데이터수집', '문서변환'
];

// Tailwind 색상 팔레트
const TAILWIND_COLORS = [
  'bg-purple-100 text-purple-800',
  'bg-indigo-100 text-indigo-800',
  'bg-blue-100 text-blue-800',
  'bg-cyan-100 text-cyan-800',
  'bg-teal-100 text-teal-800',
  'bg-emerald-100 text-emerald-800',
  'bg-green-100 text-green-800',
  'bg-lime-100 text-lime-800',
  'bg-yellow-100 text-yellow-800',
  'bg-amber-100 text-amber-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-fuchsia-100 text-fuchsia-800'
];

/**
 * 데이터 디렉토리 초기화
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * 프로젝트 태그 데이터 로드
 */
export function loadProjectTags() {
  ensureDataDir();

  if (!fs.existsSync(PROJECT_TAGS_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(PROJECT_TAGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading project tags:', error);
    return {};
  }
}

/**
 * 프로젝트 태그 데이터 저장
 */
export function saveProjectTags(tags) {
  ensureDataDir();

  try {
    fs.writeFileSync(PROJECT_TAGS_FILE, JSON.stringify(tags, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving project tags:', error);
    return false;
  }
}

/**
 * 태그 정의 로드
 */
export function loadTagDefinitions() {
  ensureDataDir();

  if (!fs.existsSync(TAG_DEFINITIONS_FILE)) {
    const defaults = {
      progress: PROGRESS_TAGS,
      categories: DEFAULT_CATEGORY_TAGS
    };
    saveTagDefinitions(defaults);
    return defaults;
  }

  try {
    const data = fs.readFileSync(TAG_DEFINITIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading tag definitions:', error);
    return {
      progress: PROGRESS_TAGS,
      categories: DEFAULT_CATEGORY_TAGS
    };
  }
}

/**
 * 태그 정의 저장
 */
export function saveTagDefinitions(definitions) {
  ensureDataDir();

  try {
    fs.writeFileSync(TAG_DEFINITIONS_FILE, JSON.stringify(definitions, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving tag definitions:', error);
    return false;
  }
}

/**
 * 태그 색상 로드
 */
export function loadTagColors() {
  ensureDataDir();

  if (!fs.existsSync(TAG_COLORS_FILE)) {
    const defaults = {
      progress: {
        '진행중': 'bg-green-100 text-green-800 border-green-300',
        '중지': 'bg-gray-100 text-gray-800 border-gray-300',
        '완료': 'bg-blue-100 text-blue-800 border-blue-300',
        '계획중': 'bg-orange-100 text-orange-800 border-orange-300',
        'deprecated': 'bg-red-100 text-red-800 border-red-300'
      },
      categories: {
        'AI': 'bg-purple-100 text-purple-800',
        '웹앱': 'bg-indigo-100 text-indigo-800',
        'CLI': 'bg-slate-100 text-slate-800',
        '봇': 'bg-pink-100 text-pink-800',
        '스크래퍼': 'bg-orange-100 text-orange-800',
        '자동화': 'bg-cyan-100 text-cyan-800',
        '지식관리': 'bg-amber-100 text-amber-800',
        'Obsidian': 'bg-violet-100 text-violet-800',
        '에이전트': 'bg-fuchsia-100 text-fuchsia-800',
        '데이터수집': 'bg-teal-100 text-teal-800',
        '문서변환': 'bg-emerald-100 text-emerald-800',
        'default': 'bg-gray-100 text-gray-600'
      }
    };
    saveTagColors(defaults);
    return defaults;
  }

  try {
    const data = fs.readFileSync(TAG_COLORS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading tag colors:', error);
    return {};
  }
}

/**
 * 태그 색상 저장
 */
export function saveTagColors(colors) {
  ensureDataDir();

  try {
    fs.writeFileSync(TAG_COLORS_FILE, JSON.stringify(colors, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving tag colors:', error);
    return false;
  }
}

/**
 * 랜덤 색상 할당
 */
export function assignRandomColor() {
  return TAILWIND_COLORS[Math.floor(Math.random() * TAILWIND_COLORS.length)];
}

/**
 * 구분 태그 추가
 */
export function addCategoryTag(tag) {
  // 디버그 로그 파일에 기록
  fs.appendFileSync('/tmp/tag-debug.log', `\n[${new Date().toISOString()}] addCategoryTag 호출: ${tag}\n`);

  const definitions = loadTagDefinitions();
  fs.appendFileSync('/tmp/tag-debug.log', `definitions: ${JSON.stringify(definitions.categories)}\n`);

  if (definitions.categories.includes(tag)) {
    fs.appendFileSync('/tmp/tag-debug.log', '이미 존재하는 태그\n');
    return { success: false, message: 'Tag already exists' };
  }

  definitions.categories.push(tag);
  fs.appendFileSync('/tmp/tag-debug.log', `태그 추가 후: ${JSON.stringify(definitions.categories)}\n`);

  const saveResult = saveTagDefinitions(definitions);
  fs.appendFileSync('/tmp/tag-debug.log', `저장 결과: ${saveResult}\n`);

  // 새 태그에 색상 할당
  const colors = loadTagColors();
  if (!colors.categories[tag]) {
    colors.categories[tag] = assignRandomColor();
    saveTagColors(colors);
  }

  const result = { success: true, definitions, colors };
  fs.appendFileSync('/tmp/tag-debug.log', `반환값: ${JSON.stringify(result).substring(0, 200)}\n`);

  return result;
}

/**
 * 구분 태그 삭제
 */
export function deleteCategoryTag(tag) {
  const definitions = loadTagDefinitions();

  // 태그가 존재하는지 확인
  const index = definitions.categories.indexOf(tag);
  if (index === -1) {
    return { success: false, message: 'Tag not found' };
  }

  // 태그를 사용 중인 프로젝트 확인
  const projectTags = loadProjectTags();
  const projectsUsingTag = Object.entries(projectTags)
    .filter(([_, data]) => data.categories && data.categories.includes(tag))
    .map(([name, _]) => name);

  if (projectsUsingTag.length > 0) {
    // 경고와 함께 사용 중인 프로젝트 목록 반환
    return {
      success: false,
      message: 'Tag is in use',
      projectsUsingTag
    };
  }

  // 태그 삭제
  definitions.categories.splice(index, 1);
  saveTagDefinitions(definitions);

  // 색상 정의도 삭제
  const colors = loadTagColors();
  delete colors.categories[tag];
  saveTagColors(colors);

  return { success: true, definitions, colors };
}

/**
 * 태그 색상 업데이트
 */
export function updateTagColor(tag, color) {
  const colors = loadTagColors();

  colors.categories[tag] = color;
  saveTagColors(colors);

  return { success: true, colors };
}

/**
 * 특정 프로젝트의 태그 가져오기
 */
export function getProjectTags(projectName) {
  const allTags = loadProjectTags();
  return allTags[projectName] || {
    customTitle: null,
    progress: '계획중',
    categories: [],
    favorite: false,
    archived: false,
    notes: ''
  };
}

/**
 * 특정 프로젝트의 태그 저장
 */
export function setProjectTags(projectName, tags) {
  const allTags = loadProjectTags();

  // customTitle 유효성 검사
  if (tags.customTitle !== undefined) {
    const trimmed = tags.customTitle?.trim();
    tags.customTitle = trimmed && trimmed.length <= 50 ? trimmed : null;
  }

  allTags[projectName] = tags;
  saveProjectTags(allTags);

  return { success: true };
}
