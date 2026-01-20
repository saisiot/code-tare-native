export default function FilterPanel({ filters, onFilterChange, tagDefinitions }) {
  if (!tagDefinitions) return null;

  const PROGRESS_TAGS = tagDefinitions.progress || [];
  const CATEGORY_TAGS = tagDefinitions.categories || [];

  function toggleProgressFilter(tag) {
    const current = filters.progress;
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];

    onFilterChange({ ...filters, progress: updated });
  }

  function toggleCategoryFilter(tag) {
    const current = filters.categories;
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];

    onFilterChange({ ...filters, categories: updated });
  }

  function toggleFavorite() {
    onFilterChange({ ...filters, favorite: !filters.favorite });
  }

  function clearFilters() {
    onFilterChange({ progress: [], categories: [], favorite: false });
  }

  const hasFilters = filters.progress.length > 0 ||
    filters.categories.length > 0 ||
    filters.favorite;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">필터</h2>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            초기화
          </button>
        )}
      </div>

      {/* 진행 상태 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">진행 상태</h3>
        <div className="space-y-2">
          {PROGRESS_TAGS.map(tag => (
            <label key={tag} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.progress.includes(tag)}
                onChange={() => toggleProgressFilter(tag)}
                className="mr-2 rounded"
              />
              <span className="text-sm">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 구분 태그 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">구분</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {CATEGORY_TAGS.map(tag => (
            <label key={tag} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(tag)}
                onChange={() => toggleCategoryFilter(tag)}
                className="mr-2 rounded"
              />
              <span className="text-sm">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 즐겨찾기 */}
      <div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={filters.favorite}
            onChange={toggleFavorite}
            className="mr-2 rounded"
          />
          <span className="text-sm font-medium">⭐ 즐겨찾기만</span>
        </label>
      </div>
    </div>
  );
}
