import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 프로젝트를 Claude Code로 열기 (Warp 터미널 사용)
 */
export async function openWithClaudeCode(projectPath) {
  try {
    // Warp 터미널로 폴더를 열고 claude 명령어 입력
    await execAsync(`open -a Warp "${projectPath}"`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 프로젝트를 VS Code로 열기
 */
export async function openWithVSCode(projectPath) {
  try {
    await execAsync(`code "${projectPath}"`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Finder에서 프로젝트 폴더 열기
 */
export async function openWithFinder(projectPath) {
  try {
    await execAsync(`open "${projectPath}"`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 터미널에서 프로젝트 폴더 열기
 */
export async function openWithTerminal(projectPath) {
  try {
    await execAsync(`open -a Terminal "${projectPath}"`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * GitHub 리포지토리 브라우저로 열기
 */
export async function openGitHub(url) {
  try {
    await execAsync(`open "${url}"`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 프로젝트 열기 핸들러
 */
export async function openProject(projectPath, app, url = null) {
  switch (app) {
    case 'claude':
      return openWithClaudeCode(projectPath);
    case 'vscode':
      return openWithVSCode(projectPath);
    case 'finder':
      return openWithFinder(projectPath);
    case 'terminal':
      return openWithTerminal(projectPath);
    case 'github':
      return openGitHub(url || projectPath);
    default:
      return { success: false, error: 'Unknown application' };
  }
}
