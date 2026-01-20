import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import ProjectCard from '../components/ProjectCard';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import TagEditor from '../components/TagEditor';

export default function Dashboard() {
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    progress: [],
    categories: [],
    favorite: false
  });
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tagDefinitions, setTagDefinitions] = useState(null);
  const [tagColors, setTagColors] = useState(null);
  const [settings, setSettings] = useState(null);

  // 프로젝트 로드
  useEffect(() => {
    fetchProjects();
    fetchTagDefinitions();
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await invoke('get_settings');
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }

  // location.state 감지 및 모달 자동 재개방
  useEffect(() => {
    const reopenProjectName = location.state?.reopenProject;
    const newTagAdded = location.state?.newTagAdded;

    if (reopenProjectName && projects.length > 0) {
      // 해당 프로젝트 찾기
      const projectToReopen = projects.find(p => p.name === reopenProjectName);

      if (projectToReopen) {
        // 태그 목록 새로고침
        if (newTagAdded) {
          fetchTagDefinitions();
        }

        // 모달 자동 재개방
        setSelectedProject(projectToReopen);
        setTagEditorOpen(true);
      }

      // location.state 정리 (브라우저 뒤로가기 시 재실행 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location.state, projects]);

  // 검색 및 필터링 적용
  useEffect(() => {
    if (!settings) return; // 설정 로드 전에는 실행 안 함

    let result = [...projects];

    // 아카이브 숨기기
    if (settings.hideArchived) {
      result = result.filter(p => !p.tags.archived);
    }

    // 숨김 프로젝트 필터링 (_나 .으로 시작)
    if (settings.hideHiddenProjects) {
      result = result.filter(p => {
        const name = p.name;
        return !name.startsWith('_') && !name.startsWith('.');
      });
    }

    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => {
        const title = p.tags?.customTitle || p.name;
        return (
          title.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        );
      });
    }

    // 진행 상태 필터링
    if (filters.progress.length > 0) {
      result = result.filter(p =>
        filters.progress.includes(p.tags.progress)
      );
    }

    // 구분 태그 필터링
    if (filters.categories.length > 0) {
      result = result.filter(p =>
        filters.categories.some(cat => p.tags.categories.includes(cat))
      );
    }

    // 즐겨찾기 필터링
    if (filters.favorite) {
      result = result.filter(p => p.tags.favorite);
    }

    // 최종 수정일 기준 내림차순 정렬 (최신순)
    result.sort((a, b) => {
      const dateA = new Date(a.lastModified);
      const dateB = new Date(b.lastModified);
      return dateB - dateA;
    });

    setFilteredProjects(result);
  }, [projects, searchQuery, filters, settings]);

  async function fetchProjects() {
    try {
      const data = await invoke('get_projects');
      if (data.success) {
        setProjects(data.projects);
        setFilteredProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTagDefinitions() {
    try {
      const data = await invoke('get_available_tags');
      if (data.success) {
        setTagDefinitions(data.definitions);
        setTagColors(data.colors);
      }
    } catch (error) {
      console.error('Error fetching tag definitions:', error);
    }
  }

  function handleOpenTagEditor(project) {
    setSelectedProject(project);
    setTagEditorOpen(true);
  }

  function handleCloseTagEditor() {
    setTagEditorOpen(false);
    setSelectedProject(null);
  }

  async function handleSaveTags(projectName, tags) {
    try {
      const data = await invoke('save_tags', { projectName, tags });
      if (data.success) {
        // 프로젝트 목록 업데이트
        setProjects(prev => prev.map(p =>
          p.name === projectName ? { ...p, tags } : p
        ));
        handleCloseTagEditor();
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  }

  async function handleRescan() {
    setLoading(true);
    try {
      await fetchProjects();
    } catch (error) {
      console.error('Error rescanning projects:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">프로젝트 로드 중...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 검색바 및 새로고침 버튼 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <button
              onClick={handleRescan}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* 필터 패널 */}
          <aside className="w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              tagDefinitions={tagDefinitions}
            />
          </aside>

          {/* 프로젝트 그리드 */}
          <main className="flex-1">
            <div className="mb-4 text-sm text-gray-600">
              총 {filteredProjects.length}개 프로젝트
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.name}
                  project={project}
                  tagColors={tagColors}
                  onOpenTagEditor={() => handleOpenTagEditor(project)}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 태그 편집 모달 */}
      {tagEditorOpen && selectedProject && (
        <TagEditor
          project={selectedProject}
          tagDefinitions={tagDefinitions}
          tagColors={tagColors}
          onClose={handleCloseTagEditor}
          onSave={handleSaveTags}
          onRefreshDefinitions={fetchTagDefinitions}
        />
      )}
    </div>
  );
}
