import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function ProjectCard({ project, tagColors, onOpenTagEditor }) {
  const [showProgressMenu, setShowProgressMenu] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const PROGRESS_OPTIONS = ['진행중', '중지', '완료', '계획중', 'deprecated'];

  async function handleProgressChange(newProgress) {
    if (newProgress === project.tags?.progress) {
      setShowProgressMenu(false);
      return;
    }

    setIsUpdatingProgress(true);
    try {
      const updatedTags = {
        ...project.tags,
        progress: newProgress
      };

      const data = await invoke('save_tags', {
        projectName: project.name,
        tags: updatedTags
      });

      if (data.success) {
        // 성공 시 페이지 새로고침하거나 부모 컴포넌트에 알림
        window.location.reload();
      } else {
        alert('진행 상태 변경 실패');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('진행 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingProgress(false);
      setShowProgressMenu(false);
    }
  }

  async function openProject(app) {
    try {
      const url = (app === 'github' && project.gitRemote) ? project.gitRemote : null;

      const data = await invoke('open_project', {
        path: project.path,
        app: app,
        url: url
      });

      if (!data.success && data.message) {
        alert(`오류: ${data.message}`);
      }
    } catch (error) {
      console.error('Error opening project:', error);
      alert('프로젝트를 여는 중 오류가 발생했습니다.');
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  }

  function getTagColor(tag, category) {
    if (!tagColors) return 'bg-gray-100 text-gray-600';

    if (category === 'progress') {
      return tagColors.progress?.[tag] || 'bg-gray-100 text-gray-600';
    } else {
      return tagColors.categories?.[tag] || tagColors.categories?.default || 'bg-gray-100 text-gray-600';
    }
  }

  const { tags } = project;
  const displayTitle = tags?.customTitle || project.name;
  const showFolderName = tags?.customTitle && tags.customTitle !== project.name;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center">
            <h3 className="text-lg font-bold text-gray-900 truncate flex-1" title={displayTitle}>
              {displayTitle}
            </h3>
            {tags?.favorite && (
              <span className="text-yellow-400 ml-2">⭐</span>
            )}
          </div>
          {showFolderName && (
            <p className="text-xs text-gray-500 mt-1">
              📁 {project.name}
            </p>
          )}
        </div>
      </div>

      {/* 태그 */}
      <div className="flex gap-1 flex-wrap mb-3 min-h-[28px]">
        {/* 진행 관련 태그 (클릭 가능) */}
        {tags?.progress && (
          <div className="relative">
            <button
              onClick={() => setShowProgressMenu(!showProgressMenu)}
              disabled={isUpdatingProgress}
              className={`text-xs px-2 py-1 rounded font-semibold border-2 cursor-pointer hover:opacity-80 transition-opacity ${getTagColor(tags.progress, 'progress')} ${isUpdatingProgress ? 'opacity-50' : ''}`}
              title="클릭하여 진행 상태 변경"
            >
              {isUpdatingProgress ? '변경 중...' : tags.progress}
            </button>

            {/* 드롭다운 메뉴 */}
            {showProgressMenu && !isUpdatingProgress && (
              <>
                {/* 배경 클릭 시 닫기 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProgressMenu(false)}
                />

                {/* 메뉴 */}
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                  {PROGRESS_OPTIONS.map(option => (
                    <button
                      key={option}
                      onClick={() => handleProgressChange(option)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        option === tags.progress ? 'font-semibold bg-gray-50' : ''
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTagColor(option, 'progress')}`}>
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 구분 태그 */}
        {tags?.categories?.map(tag => (
          <span
            key={tag}
            className={`text-xs px-2 py-1 rounded ${getTagColor(tag, 'category')}`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 설명 */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
        {project.description || '설명 없음'}
      </p>

      {/* 기술 스택 */}
      {project.techStack && project.techStack.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {project.techStack.slice(0, 5).map(tech => (
            <span key={tech} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {tech}
            </span>
          ))}
          {project.techStack.length > 5 && (
            <span className="text-xs text-gray-400">+{project.techStack.length - 5}</span>
          )}
        </div>
      )}

      {/* 메타 정보 */}
      <div className="text-xs text-gray-500 mb-3">
        <div>수정: {formatDate(project.lastModified)}</div>
        {project.type && project.type.length > 0 && (
          <div className="mt-1">타입: {project.type.join(', ')}</div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 flex-wrap border-t pt-3">
        <button
          onClick={() => openProject('claude')}
          className="flex-1 min-w-[80px] bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 transition-colors"
          title="Claude Code로 열기"
        >
          🤖 Claude
        </button>
        <button
          onClick={() => openProject('vscode')}
          className="flex-1 min-w-[80px] bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
          title="VS Code로 열기"
        >
          📝 VSCode
        </button>
        <button
          onClick={() => openProject('finder')}
          className="flex-1 min-w-[80px] bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
          title="Finder에서 보기"
        >
          📁 Finder
        </button>
        {project.gitRemote && (
          <button
            onClick={() => openProject('github')}
            className="flex-1 min-w-[80px] bg-gray-700 text-white px-2 py-1 rounded text-xs hover:bg-gray-800 transition-colors"
            title="GitHub에서 보기"
          >
            🔗 GitHub
          </button>
        )}
        <button
          onClick={onOpenTagEditor}
          className="flex-1 min-w-[80px] bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
          title="태그 편집"
        >
          🏷️ 태그
        </button>
      </div>
    </div>
  );
}
