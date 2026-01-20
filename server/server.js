import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanAllProjects } from './scanner.js';
import {
  loadProjectTags,
  setProjectTags,
  getProjectTags,
  loadTagDefinitions,
  loadTagColors,
  addCategoryTag,
  deleteCategoryTag,
  updateTagColor
} from './tags.js';
import { openProject } from './actions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (docs/images 폴더)
app.use('/docs/images', express.static(path.join(__dirname, '../docs/images')));

// 캐시된 프로젝트 데이터
let cachedProjects = null;

/**
 * GET /api/projects
 * 모든 프로젝트 목록 반환 (태그 정보 포함)
 */
app.get('/api/projects', (req, res) => {
  try {
    // 캐시가 없으면 스캔
    if (!cachedProjects) {
      cachedProjects = scanAllProjects();
    }

    const projects = cachedProjects;
    const projectTags = loadProjectTags();

    // 프로젝트에 태그 정보 병합
    const projectsWithTags = projects.map(project => ({
      ...project,
      tags: projectTags[project.name] || {
        progress: '계획중',
        categories: [],
        favorite: false,
        archived: false,
        notes: ''
      }
    }));

    // 쿼리 파라미터로 필터링
    let filtered = projectsWithTags;

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }

    if (req.query.progress) {
      filtered = filtered.filter(p => p.tags.progress === req.query.progress);
    }

    if (req.query.category) {
      const categories = Array.isArray(req.query.category)
        ? req.query.category
        : [req.query.category];

      filtered = filtered.filter(p =>
        categories.some(cat => p.tags.categories.includes(cat))
      );
    }

    if (req.query.favorite === 'true') {
      filtered = filtered.filter(p => p.tags.favorite);
    }

    if (req.query.archived !== 'true') {
      filtered = filtered.filter(p => !p.tags.archived);
    }

    // 정렬 (즐겨찾기 > 최근 수정일)
    filtered.sort((a, b) => {
      if (a.tags.favorite && !b.tags.favorite) return -1;
      if (!a.tags.favorite && b.tags.favorite) return 1;
      if (a.tags.archived && !b.tags.archived) return 1;
      if (!a.tags.archived && b.tags.archived) return -1;
      return new Date(b.lastModified) - new Date(a.lastModified);
    });

    res.json({
      success: true,
      count: filtered.length,
      projects: filtered
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/projects/scan
 * 프로젝트 재스캔
 */
app.post('/api/projects/scan', (req, res) => {
  try {
    cachedProjects = scanAllProjects();

    res.json({
      success: true,
      scanned: cachedProjects.length,
      message: 'Projects rescanned successfully'
    });
  } catch (error) {
    console.error('Error scanning projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/projects/open
 * 프로젝트를 특정 앱으로 열기
 */
app.post('/api/projects/open', async (req, res) => {
  try {
    const { path: projectPath, app, url } = req.body;

    if (!projectPath && !url) {
      return res.status(400).json({
        success: false,
        error: 'Project path or URL is required'
      });
    }

    if (!app) {
      return res.status(400).json({
        success: false,
        error: 'App name is required'
      });
    }

    const result = await openProject(projectPath, app, url);
    res.json(result);
  } catch (error) {
    console.error('Error opening project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/projects/:name/readme
 * 특정 프로젝트의 README 내용 반환
 */
app.get('/api/projects/:name/readme', (req, res) => {
  try {
    const { name } = req.params;
    const projects = cachedProjects || scanAllProjects();
    const project = projects.find(p => p.name === name);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const readmePath = path.join(project.path, 'README.md');

    if (!fs.existsSync(readmePath)) {
      return res.json({ success: true, content: 'README not found' });
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error reading README:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tags/available
 * 사용 가능한 모든 태그 반환
 */
app.get('/api/tags/available', (req, res) => {
  try {
    const definitions = loadTagDefinitions();
    const colors = loadTagColors();

    res.json({
      success: true,
      definitions,
      colors
    });
  } catch (error) {
    console.error('Error getting available tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tags/:projectName
 * 특정 프로젝트의 태그 반환
 */
app.get('/api/tags/:projectName', (req, res) => {
  try {
    const { projectName } = req.params;
    const tags = getProjectTags(projectName);

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Error getting project tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tags/manage
 * 전역 태그 추가/삭제
 * 주의: 반드시 /api/tags/:projectName 보다 먼저 선언되어야 함
 */
app.post('/api/tags/manage', (req, res) => {
  try {
    const { action, tag } = req.body;
    console.log('[/api/tags/manage] 요청 받음:', { action, tag });

    if (!action || !tag) {
      return res.status(400).json({
        success: false,
        error: 'Action and tag are required'
      });
    }

    let result;

    if (action === 'add') {
      console.log('[/api/tags/manage] addCategoryTag 호출');
      result = addCategoryTag(tag);
      console.log('[/api/tags/manage] addCategoryTag 결과:', JSON.stringify(result).substring(0, 200));
    } else if (action === 'delete') {
      console.log('[/api/tags/manage] deleteCategoryTag 호출');
      result = deleteCategoryTag(tag);
      console.log('[/api/tags/manage] deleteCategoryTag 결과:', JSON.stringify(result).substring(0, 200));
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    console.log('[/api/tags/manage] 최종 응답 전송:', JSON.stringify(result).substring(0, 200));
    res.json(result);
  } catch (error) {
    console.error('[/api/tags/manage] 에러 발생:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tags/:projectName
 * 특정 프로젝트의 태그 저장
 */
app.post('/api/tags/:projectName', (req, res) => {
  try {
    const { projectName } = req.params;
    const tags = req.body;

    const result = setProjectTags(projectName, tags);
    res.json(result);
  } catch (error) {
    console.error('Error saving project tags:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tags/colors
 * 태그 색상 업데이트
 */
app.post('/api/tags/colors', (req, res) => {
  try {
    const { tag, color } = req.body;

    if (!tag || !color) {
      return res.status(400).json({
        success: false,
        error: 'Tag and color are required'
      });
    }

    const result = updateTagColor(tag, color);
    res.json(result);
  } catch (error) {
    console.error('Error updating tag color:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/readme
 * README.md 파일 내용 반환
 */
app.get('/api/readme', (req, res) => {
  try {
    const readmePath = path.join(__dirname, '../README.md');

    if (!fs.existsSync(readmePath)) {
      return res.status(404).json({
        success: false,
        error: 'README.md not found'
      });
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error reading README:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('Scanning projects...');
  cachedProjects = scanAllProjects();
  console.log(`✅ Found ${cachedProjects.length} projects`);
});
