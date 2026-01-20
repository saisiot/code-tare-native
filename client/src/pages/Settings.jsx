import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export default function Settings() {
  const [scanPath, setScanPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await invoke('get_settings');
      setScanPath(settings.scanPath);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
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
      const result = await invoke('update_settings', {
        settings: { scanPath }
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

      <div className="bg-white rounded-lg shadow p-6">
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

        <button
          onClick={handleSave}
          disabled={saving}
          className={`mt-4 px-6 py-2 rounded transition-colors ${
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
