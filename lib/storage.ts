import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const VISITOR_FILE = path.join(DATA_DIR, 'visitor-stats.json');

interface VisitorStats {
  dailyVisitors: Record<string, string[]>; // date -> userId[]
  monthlyVisitors: Record<string, string[]>; // month -> userId[]
  visitorHistory: Record<string, {
    firstVisit: string;
    lastVisit: string;
    visitCount: number;
    actions: string[];
  }>;
  activeToday: string[];
}

export async function initializeStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // 初始化访客统计文件
    const defaultStats: VisitorStats = {
      dailyVisitors: {},
      monthlyVisitors: {},
      visitorHistory: {},
      activeToday: []
    };
    
    const statsExists = await fileExists(VISITOR_FILE);
    if (!statsExists) {
      await fs.writeFile(VISITOR_FILE, JSON.stringify(defaultStats, null, 2));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadVisitorStats(): Promise<VisitorStats> {
  try {
    const data = await fs.readFile(VISITOR_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load visitor stats:', error);
    return {
      dailyVisitors: {},
      monthlyVisitors: {},
      visitorHistory: {},
      activeToday: []
    };
  }
}

export async function saveVisitorStats(stats: VisitorStats): Promise<void> {
  try {
    await fs.writeFile(VISITOR_FILE, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Failed to save visitor stats:', error);
  }
}

export async function updateVisitorStats(userId: string, action: string): Promise<void> {
  try {
    const stats = await loadVisitorStats();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const monthStr = dateStr.substring(0, 7); // YYYY-MM
    
    // 更新今日访客
    if (!stats.dailyVisitors[dateStr]) {
      stats.dailyVisitors[dateStr] = [];
    }
    if (!stats.dailyVisitors[dateStr].includes(userId)) {
      stats.dailyVisitors[dateStr].push(userId);
    }
    
    // 更新本月访客
    if (!stats.monthlyVisitors[monthStr]) {
      stats.monthlyVisitors[monthStr] = [];
    }
    if (!stats.monthlyVisitors[monthStr].includes(userId)) {
      stats.monthlyVisitors[monthStr].push(userId);
    }
    
    // 更新用户访问历史
    if (!stats.visitorHistory[userId]) {
      stats.visitorHistory[userId] = {
        firstVisit: now.toISOString(),
        lastVisit: now.toISOString(),
        visitCount: 1,
        actions: [action]
      };
    } else {
      stats.visitorHistory[userId].lastVisit = now.toISOString();
      stats.visitorHistory[userId].visitCount++;
      stats.visitorHistory[userId].actions.push(action);
    }
    
    // 更新今日活跃用户
    if (!stats.activeToday.includes(userId)) {
      stats.activeToday.push(userId);
    }
    
    await saveVisitorStats(stats);
  } catch (error) {
    console.error('Failed to update visitor stats:', error);
  }
}