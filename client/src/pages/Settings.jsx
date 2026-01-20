import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export default function Settings() {
  const [scanPath, setScanPath] = useState('');
  const [terminalApp, setTerminalApp] = useState('');
  const [editorCommand, setEditorCommand] = useState('');
  const [excludedFolders, setExcludedFolders] = useState([]);
  const [hideArchived, setHideArchived] = useState(true);
  const [hideHiddenProjects, setHideHiddenProjects] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customTerminal, setCustomTerminal] = useState('');
  const [customEditor, setCustomEditor] = useState('');
  const [showCustomTerminal, setShowCustomTerminal] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [newFolder, setNewFolder] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const terminalOptions = ['Warp', 'iTerm', 'Terminal', 'Alacritty', 'Kitty'];
  const editorOptions = ['code', 'cursor', 'zed', 'subl', 'atom', 'nvim'];

  async function loadSettings() {
    try {
      const settings = await invoke('get_settings');
      setScanPath(settings.scanPath);

      // 터미널 앱 설정
      if (terminalOptions.includes(settings.terminalApp)) {
        setTerminalApp(settings.terminalApp);
        setShowCustomTerminal(false);
      } else {
        setTerminalApp('custom');
        setCustomTerminal(settings.terminalApp);
        setShowCustomTerminal(true);
      }

      // 에디터 커맨드 설정
      if (editorOptions.includes(settings.editorCommand)) {
        setEditorCommand(settings.editorCommand);
        setShowCustomEditor(false);
      } else {
        setEditorCommand('custom');
        setCustomEditor(settings.editorCommand);
        setShowCustomEditor(true);
      }

      setExcludedFolders(settings.excludedFolders || []);
      setHideArchived(settings.hideArchived ?? true);
      setHideHiddenProjects(settings.hideHiddenProjects ?? true);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleTerminalChange(value) {
    setTerminalApp(value);
    if (value === 'custom') {
      setShowCustomTerminal(true);
    } else {
      setShowCustomTerminal(false);
      setCustomTerminal('');
    }
  }

  function handleEditorChange(value) {
    setEditorCommand(value);
    if (value === 'custom') {
      setShowCustomEditor(true);
    } else {
      setShowCustomEditor(false);
      setCustomEditor('');
    }
  }

  async function handleSelectFolder() {
    try {
      console.log('Opening folder dialog...');
      const selected = await open({
        directory: true,
        multiple: false,
        title: '프로젝트 폴더 선택',
      });

      console.log('Selected folder:', selected);

      if (selected) {
        setScanPath(selected);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert('폴더 선택 중 오류가 발생했습니다: ' + error.message);
    }
  }

  function handleAddExcludedFolder() {
    const folder = newFolder.trim();
    if (folder && !excludedFolders.includes(folder)) {
      setExcludedFolders([...excludedFolders, folder]);
      setNewFolder('');
    }
  }

  function handleRemoveExcludedFolder(index) {
    setExcludedFolders(excludedFolders.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const finalTerminalApp = showCustomTerminal ? customTerminal : terminalApp;
      const finalEditorCommand = showCustomEditor ? customEditor : editorCommand;

      const result = await invoke('update_settings', {
        settings: {
          scanPath,
          terminalApp: finalTerminalApp,
          editorCommand: finalEditorCommand,
          excludedFolders,
          hideArchived,
          hideHiddenProjects
        }
      });

      if (result.success) {
        alert('설정이 저장되었습니다!');
      } else {
        alert('설정 저장 중 오류가 발생했습니다: ' + (result.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">설정 로드 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 프로젝트 폴더 */}
        <div>
          <label className="block mb-2 font-medium">
            프로젝트 부모 폴더
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={scanPath}
              readOnly
              className="flex-1 px-3 py-2 border rounded bg-gray-50"
            />
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              폴더 선택
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            이 폴더의 하위 프로젝트들이 스캔됩니다.
          </p>
        </div>

        {/* 터미널 앱 */}
        <div>
          <label className="block mb-2 font-medium">
            터미널 앱
          </label>
          <select
            value={terminalApp}
            onChange={(e) => handleTerminalChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {terminalOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="custom">기타 (직접 입력)</option>
          </select>
          {showCustomTerminal && (
            <input
              type="text"
              value={customTerminal}
              onChange={(e) => setCustomTerminal(e.target.value)}
              placeholder="터미널 앱 이름 입력"
              className="w-full px-3 py-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <p className="text-sm text-gray-500 mt-2">
            Claude 버튼을 눌렀을 때 열릴 터미널 앱 이름 (macOS 애플리케이션 이름)
          </p>
        </div>

        {/* 에디터 커맨드 */}
        <div>
          <label className="block mb-2 font-medium">
            에디터 커맨드
          </label>
          <select
            value={editorCommand}
            onChange={(e) => handleEditorChange(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {editorOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
            <option value="custom">기타 (직접 입력)</option>
          </select>
          {showCustomEditor && (
            <input
              type="text"
              value={customEditor}
              onChange={(e) => setCustomEditor(e.target.value)}
              placeholder="에디터 커맨드 입력"
              className="w-full px-3 py-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <p className="text-sm text-gray-500 mt-2">
            VS Code 버튼을 눌렀을 때 실행할 커맨드 (PATH에 등록된 커맨드)
          </p>
        </div>

        {/* 제외 폴더 */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">스캔 제외 폴더</h3>
          <p className="text-sm text-gray-500 mb-3">
            프로젝트 스캔 시 제외할 폴더 이름 (예: node_modules, .git)
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newFolder.trim()) {
                  handleAddExcludedFolder();
                }
              }}
              placeholder="폴더 이름 입력"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddExcludedFolder}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {excludedFolders.map((folder, index) => (
              <div
                key={index}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                <span>{folder}</span>
                <button
                  onClick={() => handleRemoveExcludedFolder(index)}
                  className="ml-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 표시 옵션 */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">표시 옵션</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideArchived}
                onChange={(e) => setHideArchived(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>아카이브된 프로젝트 숨기기</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideHiddenProjects}
                onChange={(e) => setHideHiddenProjects(e.target.checked)}
                className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>숨김 프로젝트 가리기 (_, . 시작)</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full px-6 py-2 rounded transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
