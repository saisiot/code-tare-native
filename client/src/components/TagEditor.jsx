import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TagEditor({
  project,
  tagDefinitions,
  tagColors,
  onClose,
  onSave,
  onRefreshDefinitions
}) {
  const [customTitle, setCustomTitle] = useState(project.tags?.customTitle || '');
  const [progress, setProgress] = useState(project.tags?.progress || '계획중');
  const [categories, setCategories] = useState(project.tags?.categories || []);
  const [favorite, setFavorite] = useState(project.tags?.favorite || false);
  const [archived, setArchived] = useState(project.tags?.archived || false);
  const [notes, setNotes] = useState(project.tags?.notes || '');
  const [newCategoryTag, setNewCategoryTag] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);

  if (!tagDefinitions || !tagColors) return null;

  const PROGRESS_TAGS = tagDefinitions.progress || [];
  const CATEGORY_TAGS = tagDefinitions.categories || [];

  function toggleCategory(tag) {
    if (categories.includes(tag)) {
      setCategories(categories.filter(t => t !== tag));
    } else {
      setCategories([...categories, tag]);
    }
  }

  async function handleAddNewCategory() {
    if (!newCategoryTag.trim()) return;

    try {
      const res = await fetch('/api/tags/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          tag: newCategoryTag.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('새 구분 태그가 추가되었습니다!');
        setNewCategoryTag('');

        // 페이지 새로고침 대신 콜백 호출
        if (onRefreshDefinitions) {
          await onRefreshDefinitions();
        }

        // 새로 추가된 태그를 자동으로 선택
        setCategories([...categories, newCategoryTag.trim()]);
      } else {
        alert(data.message || '태그 추가 실패');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('태그 추가 중 오류가 발생했습니다.');
    }
  }

  function handleSave() {
    const tags = {
      customTitle: customTitle.trim() || null,
      progress,
      categories,
      favorite,
      archived,
      notes
    };

    onSave(project.name, tags);
  }

  function getTagColor(tag, category) {
    if (category === 'progress') {
      return tagColors.progress?.[tag] || 'bg-gray-100 text-gray-600';
    } else {
      return tagColors.categories?.[tag] || tagColors.categories?.default || 'bg-gray-100 text-gray-600';
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">프로젝트 태그 관리</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{project.name}</p>
        </div>

        {/* 프로젝트 정보 */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">프로젝트 정보</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={project.name}
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                비워두면 폴더명이 표시됩니다
              </p>
            </div>

            <div className="bg-white px-3 py-2 rounded border border-gray-200">
              <p className="text-xs text-gray-600">
                📁 폴더명: <span className="font-mono">{project.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4 space-y-6">
          {/* 진행 상태 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              진행 상태 <span className="text-xs text-gray-500">(1개 선택, 고정 옵션)</span>
            </h3>
            <div className="space-y-2">
              {PROGRESS_TAGS.map(tag => (
                <label key={tag} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="progress"
                    value={tag}
                    checked={progress === tag}
                    onChange={(e) => setProgress(e.target.value)}
                    className="mr-2"
                  />
                  <span className={`text-sm px-3 py-1 rounded border-2 font-semibold ${getTagColor(tag, 'progress')}`}>
                    {tag}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 구분 태그 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              구분 태그 <span className="text-xs text-gray-500">(다중 선택 가능, 자유 추가/삭제)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_TAGS.map(tag => (
                <label key={tag} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(tag)}
                    onChange={() => toggleCategory(tag)}
                    className="mr-2"
                  />
                  <span className={`text-xs px-2 py-1 rounded ${getTagColor(tag, 'category')}`}>
                    {tag}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 새 구분 태그 추가 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">새 구분 태그 추가</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="새 구분 태그 입력... (예: 백엔드, 프론트엔드)"
                value={newCategoryTag}
                onChange={(e) => setNewCategoryTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddNewCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                + 전역 태그로 추가
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              전역 태그로 추가하면 모든 프로젝트에서 선택 가능합니다.
            </p>
          </div>

          {/* 메모 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">메모</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="프로젝트에 대한 메모..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 즐겨찾기 & 아카이브 */}
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">⭐ 즐겨찾기</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium">📦 아카이브 (숨기기)</span>
            </label>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between">
          <Link
            to="/tags"
            state={{ returnToProject: project.name }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            ⚙️ 구분 태그 전체 관리
          </Link>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 구분 태그 관리 모달 (간단한 버전) */}
      {showManageModal && (
        <TagManagementModal
          tagDefinitions={tagDefinitions}
          tagColors={tagColors}
          onClose={() => setShowManageModal(false)}
          onRefresh={onRefreshDefinitions}
        />
      )}
    </div>
  );
}

// 태그 관리 모달 (간단한 구현)
function TagManagementModal({ tagDefinitions, tagColors, onClose, onRefresh }) {
  const CATEGORY_TAGS = tagDefinitions.categories || [];

  async function handleDeleteTag(tag) {
    if (!confirm(`"${tag}" 태그를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch('/api/tags/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', tag })
      });

      const data = await res.json();
      if (data.success) {
        alert('태그가 삭제되었습니다.');

        // 페이지 새로고침 대신 콜백 호출
        if (onRefresh) {
          await onRefresh();
        }

        // 모달 닫기
        onClose();
      } else {
        if (data.projectsUsingTag) {
          alert(`이 태그를 사용 중인 프로젝트가 있습니다:\n${data.projectsUsingTag.join(', ')}`);
        } else {
          alert(data.message || '태그 삭제 실패');
        }
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('태그 삭제 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">구분 태그 전체 관리</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-2">
            {CATEGORY_TAGS.map(tag => {
              const color = tagColors.categories?.[tag] || tagColors.categories?.default;
              return (
                <div key={tag} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className={`text-sm px-3 py-1 rounded ${color}`}>
                    {tag}
                  </span>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    삭제
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
