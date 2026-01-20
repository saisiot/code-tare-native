import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TagManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnToProject = location.state?.returnToProject;

  const [tags, setTags] = useState([]);
  const [tagColors, setTagColors] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);

  // 태그 목록 로드
  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags/available');
      const data = await res.json();
      if (data.success) {
        setTags(data.definitions.categories);
        setTagColors(data.colors.categories);
      }
    } catch (error) {
      console.error('태그 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }

  // 태그 추가
  async function handleAddTag() {
    if (!newTagName.trim()) return;

    try {
      const res = await fetch('/api/tags/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', tag: newTagName.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setNewTagName('');

        // Dashboard로 복귀하며 프로젝트 정보 전달
        if (returnToProject) {
          navigate('/', {
            state: {
              reopenProject: returnToProject,
              newTagAdded: true
            }
          });
        } else {
          // 프로젝트 정보가 없으면 태그 목록만 새로고침
          await fetchTags();
          alert('✅ 태그가 추가되었습니다!');
        }
      } else {
        alert('❌ 태그 추가 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('태그 추가 실패:', error);
      alert('❌ 태그 추가 중 오류가 발생했습니다.');
    }
  }

  // 태그 삭제
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
        await fetchTags(); // 목록 새로고침
        alert('✅ 태그가 삭제되었습니다!');
      } else {
        if (data.projectsUsingTag) {
          alert(`❌ 이 태그를 사용 중인 프로젝트가 있습니다:\n${data.projectsUsingTag.join(', ')}`);
        } else {
          alert('❌ 태그 삭제 실패: ' + (data.message || '알 수 없는 오류'));
        }
      }
    } catch (error) {
      console.error('태그 삭제 실패:', error);
      alert('❌ 태그 삭제 중 오류가 발생했습니다.');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🏷️ 구분 태그 관리</h2>
          {returnToProject && (
            <button
              onClick={() => navigate('/', { state: { reopenProject: returnToProject } })}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              ← 돌아가기
            </button>
          )}
        </div>

        {/* 태그 추가 섹션 */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-3">새 태그 추가</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="태그 이름 입력... (예: 백엔드, 프론트엔드)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTag}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              ➕ 추가
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            💡 추가한 태그는 모든 프로젝트에서 선택 가능합니다.
          </p>
        </div>

        {/* 태그 목록 */}
        <div>
          <h3 className="font-semibold mb-3">현재 태그 목록 ({tags.length}개)</h3>
          {tags.length === 0 ? (
            <p className="text-gray-500 text-center py-8">등록된 태그가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm ${tagColors[tag] || 'bg-gray-200 text-gray-700'}`}>
                      {tag}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="px-4 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">ℹ️ 참고사항</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 진행 상태 태그(진행중, 중지, 완료 등)는 시스템 고정 태그로 수정할 수 없습니다.</li>
          <li>• 프로젝트에서 사용 중인 태그는 삭제할 수 없습니다.</li>
          <li>• 삭제된 태그는 복구할 수 없습니다.</li>
        </ul>
      </div>
    </div>
  );
}
