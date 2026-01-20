import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export default function Settings() {
  const [scanPath, setScanPath] = useState('');
  const [terminalApp, setTerminalApp] = useState('');
  const [editorCommand, setEditorCommand] = useState('');
  const [excludedFolders, setExcludedFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customTerminal, setCustomTerminal] = useState('');
  const [customEditor, setCustomEditor] = useState('');
  const [showCustomTerminal, setShowCustomTerminal] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);

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
          excludedFolders  // 기존 값 유지
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
