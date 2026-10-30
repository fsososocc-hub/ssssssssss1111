import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { Asset, Conversation, TaskRecord, TaskStep, ChatMessage, UserSettings, BaseModel } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_STORAGE = path.resolve(__dirname, '../../storage');
const DB_SQLITE_PATH = path.join(ROOT_STORAGE, 'modagpt.sqlite');

if (!fs.existsSync(ROOT_STORAGE)) {
  fs.mkdirSync(ROOT_STORAGE, { recursive: true });
}

// Initialize SQLite database instance
const db = new DatabaseSync(DB_SQLITE_PATH);

// Configure high performance and ACID integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

// Create transactional relational schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'designer',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    task_id TEXT,
    attachments TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    status TEXT NOT NULL,
    tools_called TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS task_steps (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    tool TEXT,
    details TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER NOT NULL DEFAULT 1024,
    height INTEGER NOT NULL DEFAULT 1024,
    tool TEXT NOT NULL,
    prompt TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    conversation_id TEXT,
    task_id TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calibrated_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    gender TEXT NOT NULL,
    ethnicity TEXT,
    height TEXT,
    measurements TEXT,
    lighting TEXT,
    pose TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    description TEXT,
    is_preset INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    calibration_score INTEGER NOT NULL DEFAULT 95,
    calibration_report TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_conv ON tasks(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_task_steps_task ON task_steps(task_id);
  CREATE INDEX IF NOT EXISTS idx_assets_tool ON assets(tool);
  CREATE INDEX IF NOT EXISTS idx_calibrated_models_active ON calibrated_models(is_active);
`);

// Default initial settings
const defaultSettings: UserSettings = {
  userName: 'Moda Designer',
  email: 'fsososocc@gmail.com',
  language: 'zh-CN',
  region: '中国 / 亚太',
  emailNotifications: true,
  twoFactorAuth: false,
  quotaRemaining: 840,
  quotaTotal: 1000,
  planName: '商业高级版 (Commercial Pro)',
  providers: [
    { name: 'Google GenAI (Gemini 3.1 / 3.8)', status: 'connected', model: 'gemini-3.1-flash-lite', quotaUsed: 160 },
    { name: 'Moda Precision Deterministic Engine', status: 'connected', model: 'Sharp-V2-Engine', quotaUsed: 88 },
    { name: 'Veo Runway Video Engine', status: 'unconnected', model: 'veo-2.0-preview (待授权)', quotaUsed: 0 },
  ],
};

// Seed default conversation & settings if empty
const countConvStmt = db.prepare('SELECT count(*) as cnt FROM conversations');
const convRow = countConvStmt.get() as { cnt: number };
if (convRow.cnt === 0) {
  const insertConv = db.prepare(`
    INSERT INTO conversations (id, title, message_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const now = Date.now();
  insertConv.run('conv-init', 'ModaGPT 生产级创作空间', 0, now, now);
}

const getSettingStmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
const settingRow = getSettingStmt.get('user_settings') as { value: string } | undefined;
if (!settingRow) {
  const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
  insertSetting.run('user_settings', JSON.stringify(defaultSettings));
}

// Seed 5 standard commercial base models into assets
const PRESET_MODELS_SEED = [
  {
    id: 'base-model-asian-female',
    name: '晨曦 · 亚洲商业女模 (Lin).jpg',
    url: '/storage/assets/base-model-asian-female.jpg',
    prompt: '商业摄影棚标准全身亚洲女模：身高178cm，三围83-60-89cm，极简无影白棚，5600K纯正显色',
    metadata: {
      tool: 'model_photoshoot' as const,
      prompt: '商业摄影棚标准全身亚洲女模：身高178cm，三围83-60-89cm，极简无影白棚，5600K纯正显色',
      version: 1,
      modelProfile: {
        name: '晨曦 · 亚洲商业女模',
        code: 'Lin',
        gender: 'female',
        height: '178cm',
        measurements: '83-60-89cm',
        ethnicity: '东亚 / 商业纯净',
        pose: '标准全身直立站姿',
        lighting: '5600K 纯白柔光箱',
      },
    },
  },
  {
    id: 'base-model-euro-female',
    name: '艾琳娜 · 欧美高定女模 (Elena).jpg',
    url: '/storage/assets/base-model-euro-female.jpg',
    prompt: '高级成衣高定时装周全身体态欧美女模：身高180cm，三围82-59-88cm，垂直对称中轴线站姿',
    metadata: {
      tool: 'model_photoshoot' as const,
      prompt: '高级成衣高定时装周全身体态欧美女模：身高180cm，三围82-59-88cm，垂直对称中轴线站姿',
      version: 1,
      modelProfile: {
        name: '艾琳娜 · 欧美高定女模',
        code: 'Elena',
        gender: 'female',
        height: '180cm',
        measurements: '82-59-88cm',
        ethnicity: '欧洲 / 高定骨相',
        pose: '垂直中轴全身站姿',
        lighting: '巴黎时装周极简明暗',
      },
    },
  },
  {
    id: 'base-model-asian-male',
    name: '泽宇 · 亚洲都市男模 (Chen).jpg',
    url: '/storage/assets/base-model-asian-male.jpg',
    prompt: '现代都市轻商务亚裔男模：身高187cm，胸围100cm/腰围78cm，挺拔绅士站姿，干净短发',
    metadata: {
      tool: 'model_photoshoot' as const,
      prompt: '现代都市轻商务亚裔男模：身高187cm，胸围100cm/腰围78cm，挺拔绅士站姿，干净短发',
      version: 1,
      modelProfile: {
        name: '泽宇 · 亚洲都市男模',
        code: 'Chen',
        gender: 'male',
        height: '187cm',
        measurements: '胸围 100cm / 腰围 78cm',
        ethnicity: '东亚 / 现代轻商务',
        pose: '绅士直立挺拔体态',
        lighting: '商业无影漫反射',
      },
    },
  },
  {
    id: 'base-model-euro-male',
    name: '马库斯 · 欧美精英男模 (Marcus).jpg',
    url: '/storage/assets/base-model-euro-male.jpg',
    prompt: '欧美经典绅士工装男模：身高188cm，胸围102cm/腰围80cm，深邃五官，正装挺阔肩线',
    metadata: {
      tool: 'model_photoshoot' as const,
      prompt: '欧美经典绅士工装男模：身高188cm，胸围102cm/腰围80cm，深邃五官，正装挺阔肩线',
      version: 1,
      modelProfile: {
        name: '马库斯 · 欧美精英男模',
        code: 'Marcus',
        gender: 'male',
        height: '188cm',
        measurements: '胸围 102cm / 腰围 80cm',
        ethnicity: '欧美 / 经典绅士工装',
        pose: '自然修身挺立姿态',
        lighting: '85mm 商业肖像柔光',
      },
    },
  },
  {
    id: 'base-model-contemporary-female',
    name: '阿玛拉 · 前卫多元女模 (Amara).jpg',
    url: '/storage/assets/base-model-contemporary-female.jpg',
    prompt: '先锋时装周秀场表现力女模：身高179cm，三围84-61-90cm，极简短发，摩登高级表现力',
    metadata: {
      tool: 'model_photoshoot' as const,
      prompt: '先锋时装周秀场表现力女模：身高179cm，三围84-61-90cm，极简短发，摩登高级表现力',
      version: 1,
      modelProfile: {
        name: '阿玛拉 · 前卫多元女模',
        code: 'Amara',
        gender: 'female',
        height: '179cm',
        measurements: '84-61-90cm',
        ethnicity: '先锋多元 / 时尚秀场',
        pose: '极简松弛感站姿',
        lighting: '无影天顶柔光环照',
      },
    },
  },
];

const checkModelStmt = db.prepare('SELECT id FROM assets WHERE id = ?');
const insertModelStmt = db.prepare(`
  INSERT INTO assets (
    id, name, type, url, thumbnail_url, size_bytes, width, height,
    tool, prompt, version, conversation_id, task_id, metadata, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const m of PRESET_MODELS_SEED) {
  if (!checkModelStmt.get(m.id)) {
    insertModelStmt.run(
      m.id,
      m.name,
      'image',
      m.url,
      m.url,
      490000,
      1024,
      1365,
      'model_photoshoot',
      m.prompt,
      1,
      'conv-init',
      null,
      JSON.stringify(m.metadata),
      Date.now()
    );
  }
}

// Seed calibrated_models table with the 5 preset standard models
const countCalibratedStmt = db.prepare('SELECT count(*) as cnt FROM calibrated_models');
const calibratedCnt = (countCalibratedStmt.get() as { cnt: number }).cnt;
if (calibratedCnt === 0) {
  const insertCalibratedStmt = db.prepare(`
    INSERT INTO calibrated_models (
      id, name, code, gender, ethnicity, height, measurements, lighting, pose,
      url, thumbnail_url, description, is_preset, is_active, is_default,
      calibration_score, calibration_report, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialPresets: BaseModel[] = [
    {
      id: 'base-model-asian-female',
      name: '晨曦 · 亚洲商业女模',
      code: 'Lin',
      gender: 'female',
      ethnicity: '东亚 / 商业纯净',
      height: '178 cm',
      measurements: '83 - 60 - 89 cm',
      lighting: '5600K 纯白柔光箱',
      pose: '标准全身直立站姿',
      url: '/storage/assets/base-model-asian-female.jpg',
      thumbnailUrl: '/storage/assets/base-model-asian-female.jpg',
      description: '身形高挑挺拔，淡雅清透自然底妆，适合全品类成衣、羽绒及高定礼服商业展示。',
      isPreset: true,
      isActive: true,
      isDefault: true,
      calibrationScore: 98,
      calibrationReport: {
        symmetryScore: 99,
        shoulderAlignment: '双肩水平度工差 < 0.2°，无遮挡',
        backgroundCleanliness: '99.4% 纯白漫反射，无杂质',
        drapeSuitability: '极佳 (垂坠松量适配 A+)',
        status: 'calibrated',
      },
    },
    {
      id: 'base-model-euro-female',
      name: '艾琳娜 · 欧美高定女模',
      code: 'Elena',
      gender: 'female',
      ethnicity: '欧洲 / 高定骨相',
      height: '180 cm',
      measurements: '82 - 59 - 88 cm',
      lighting: '巴黎时装周极简明暗',
      pose: '垂直中轴全身站姿',
      url: '/storage/assets/base-model-euro-female.jpg',
      thumbnailUrl: '/storage/assets/base-model-euro-female.jpg',
      description: '清冷高级骨相，极简紧实马尾，对称正面中心线，专为高级成衣虚拟试穿与走秀定制。',
      isPreset: true,
      isActive: true,
      isDefault: false,
      calibrationScore: 97,
      calibrationReport: {
        symmetryScore: 98,
        shoulderAlignment: '骨相清晰，平肩中轴线严密对准',
        backgroundCleanliness: '98.8% 均匀高调摄影背景',
        drapeSuitability: '极佳 (高定成衣贴合度 97%)',
        status: 'calibrated',
      },
    },
    {
      id: 'base-model-asian-male',
      name: '泽宇 · 亚洲都市男模',
      code: 'Chen',
      gender: 'male',
      ethnicity: '东亚 / 现代轻商务',
      height: '187 cm',
      measurements: '胸围 100cm / 腰围 78cm',
      lighting: '商业无影漫反射',
      pose: '绅士直立挺拔体态',
      url: '/storage/assets/base-model-asian-male.jpg',
      thumbnailUrl: '/storage/assets/base-model-asian-male.jpg',
      description: '现代都市利落短发，修长健硕比例，精准适配布鲁克林风工装、大衣及现代西装。',
      isPreset: true,
      isActive: true,
      isDefault: false,
      calibrationScore: 96,
      calibrationReport: {
        symmetryScore: 97,
        shoulderAlignment: '倒三角挺拔肩宽，西装挺括线对齐',
        backgroundCleanliness: '98.5% 柔光棚拍背景',
        drapeSuitability: '优异 (男装西服重力垂褶完全适配)',
        status: 'calibrated',
      },
    },
    {
      id: 'base-model-euro-male',
      name: '马库斯 · 欧美精英男模',
      code: 'Marcus',
      gender: 'male',
      ethnicity: '欧美 / 经典绅士工装',
      height: '188 cm',
      measurements: '胸围 102cm / 腰围 80cm',
      lighting: '85mm 商业肖像柔光',
      pose: '自然修身挺立姿态',
      url: '/storage/assets/base-model-euro-male.jpg',
      thumbnailUrl: '/storage/assets/base-model-euro-male.jpg',
      description: '深邃五官与硬朗轮廓，正装挺括肩线与倒三角体态，展现经典风衣与男装奢华质感。',
      isPreset: true,
      isActive: true,
      isDefault: false,
      calibrationScore: 96,
      calibrationReport: {
        symmetryScore: 96,
        shoulderAlignment: '标准绅士工装站姿，双臂自然下垂',
        backgroundCleanliness: '98.2% 肖像光漫反射',
        drapeSuitability: '优异 (重磅大衣/风衣版型高度适配)',
        status: 'calibrated',
      },
    },
    {
      id: 'base-model-contemporary-female',
      name: '阿玛拉 · 前卫多元女模',
      code: 'Amara',
      gender: 'female',
      ethnicity: '先锋多元 / 时尚秀场',
      height: '179 cm',
      measurements: '84 - 61 - 90 cm',
      lighting: '无影天顶柔光环照',
      pose: '极简松弛感站姿',
      url: '/storage/assets/base-model-contemporary-female.jpg',
      thumbnailUrl: '/storage/assets/base-model-contemporary-female.jpg',
      description: '摩登极简短发，高级时尚张力，与对比色系或结构感外套相衬，极具先锋表现力。',
      isPreset: true,
      isActive: true,
      isDefault: false,
      calibrationScore: 95,
      calibrationReport: {
        symmetryScore: 96,
        shoulderAlignment: '颈肩比例优越，锁骨线条分明',
        backgroundCleanliness: '98.0% 高调柔光无影天顶',
        drapeSuitability: '优异 (前卫剪裁/设计师款极度适配)',
        status: 'calibrated',
      },
    },
  ];

  for (const m of initialPresets) {
    insertCalibratedStmt.run(
      m.id,
      m.name,
      m.code,
      m.gender,
      m.ethnicity,
      m.height,
      m.measurements,
      m.lighting,
      m.pose,
      m.url,
      m.thumbnailUrl,
      m.description,
      1,
      1,
      m.isDefault ? 1 : 0,
      m.calibrationScore ?? 95,
      JSON.stringify(m.calibrationReport ?? {}),
      Date.now()
    );
  }
}

export const DatabaseService = {
  // Asset operations
  insertAsset(asset: Asset): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO assets (
        id, name, type, url, thumbnail_url, size_bytes, width, height,
        tool, prompt, version, conversation_id, task_id, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      asset.id,
      asset.name,
      asset.type,
      asset.url,
      asset.thumbnailUrl ?? asset.url,
      asset.sizeBytes ?? 0,
      asset.width ?? 1024,
      asset.height ?? 1024,
      asset.metadata.tool,
      asset.metadata.prompt || '',
      asset.metadata.version || 1,
      asset.metadata.conversationId ?? null,
      asset.metadata.taskId ?? null,
      JSON.stringify(asset.metadata),
      asset.createdAt
    );
  },

  getAsset(id: string): Asset | undefined {
    const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'image' | 'video',
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      createdAt: row.created_at,
      metadata: JSON.parse(row.metadata || '{}'),
    };
  },

  listAssets(tool?: string, search?: string): Asset[] {
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params: any[] = [];

    if (tool && tool !== 'all') {
      query += ' AND tool = ?';
      params.push(tool);
    }
    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR prompt LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s);
    }
    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as 'image' | 'video',
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      createdAt: row.created_at,
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  },

  deleteAsset(id: string): boolean {
    const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
    stmt.run(id);
    return true;
  },

  // Task operations
  saveTask(task: TaskRecord): void {
    const insertTask = db.prepare(`
      INSERT OR REPLACE INTO tasks (
        id, conversation_id, user_prompt, status, tools_called, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      task.id,
      task.conversationId,
      task.userPrompt,
      task.status,
      JSON.stringify(task.toolsCalled),
      task.createdAt,
      task.completedAt || null
    );

    // Save steps
    const deleteSteps = db.prepare('DELETE FROM task_steps WHERE task_id = ?');
    deleteSteps.run(task.id);

    const insertStep = db.prepare(`
      INSERT INTO task_steps (
        id, task_id, step_order, title, status, tool, details, duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    task.steps.forEach((step, index) => {
      insertStep.run(
        step.id,
        task.id,
        index,
        step.title,
        step.status,
        step.tool || null,
        step.details || '',
        step.durationMs || 0
      );
    });
  },

  getTask(id: string): TaskRecord | undefined {
    const taskStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const taskRow = taskStmt.get(id) as any;
    if (!taskRow) return undefined;

    const stepsStmt = db.prepare('SELECT * FROM task_steps WHERE task_id = ? ORDER BY step_order ASC');
    const stepRows = stepsStmt.all(id) as any[];

    const steps: TaskStep[] = stepRows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      tool: r.tool || undefined,
      details: r.details || undefined,
      durationMs: r.duration_ms,
    }));

    // Find output assets linked to this task
    const assetsStmt = db.prepare('SELECT * FROM assets WHERE task_id = ?');
    const assetRows = assetsStmt.all(id) as any[];
    const outputAssets: Asset[] = assetRows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as 'image' | 'video',
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      createdAt: row.created_at,
      metadata: JSON.parse(row.metadata || '{}'),
    }));

    return {
      id: taskRow.id,
      conversationId: taskRow.conversation_id,
      userPrompt: taskRow.user_prompt,
      status: taskRow.status as TaskRecord['status'],
      steps,
      toolsCalled: JSON.parse(taskRow.tools_called || '[]'),
      outputAssets,
      createdAt: taskRow.created_at,
      completedAt: taskRow.completed_at || undefined,
    };
  },

  // Conversation operations
  getConversations(): Conversation[] {
    const stmt = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      messageCount: r.message_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  createConversation(title: string): Conversation {
    const id = `conv-${Date.now()}`;
    const now = Date.now();
    const cleanTitle = title || '新创作任务';

    const stmt = db.prepare(`
      INSERT INTO conversations (id, title, message_count, created_at, updated_at)
      VALUES (?, ?, 0, ?, ?)
    `);
    stmt.run(id, cleanTitle, now, now);

    return {
      id,
      title: cleanTitle,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  deleteConversation(id: string): boolean {
    const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
    stmt.run(id);
    return true;
  },

  // Message operations
  getMessages(conversationId: string): ChatMessage[] {
    const stmt = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(conversationId) as any[];

    return rows.map((r) => {
      let taskRecord: TaskRecord | undefined = undefined;
      if (r.task_id) {
        taskRecord = this.getTask(r.task_id);
      }

      return {
        id: r.id,
        conversationId: r.conversation_id,
        role: r.role as 'user' | 'assistant',
        content: r.content,
        taskId: r.task_id || undefined,
        taskRecord,
        attachments: JSON.parse(r.attachments || '[]'),
        createdAt: r.created_at,
      };
    });
  },

  addMessage(msg: ChatMessage): void {
    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, task_id, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      msg.id,
      msg.conversationId,
      msg.role,
      msg.content,
      msg.taskId || null,
      JSON.stringify(msg.attachments || []),
      msg.createdAt
    );

    // Update conversation message count and updatedAt
    const countStmt = db.prepare('SELECT count(*) as count FROM messages WHERE conversation_id = ?');
    const countRes = countStmt.get(msg.conversationId) as { count: number };

    const updateConv = db.prepare(`
      UPDATE conversations 
      SET message_count = ?, updated_at = ?
      WHERE id = ?
    `);
    updateConv.run(countRes.count, Date.now(), msg.conversationId);
  },

  // Settings
  getSettings(): UserSettings {
    const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?');
    const row = stmt.get('user_settings') as { value: string } | undefined;
    if (!row) return defaultSettings;
    try {
      return JSON.parse(row.value);
    } catch {
      return defaultSettings;
    }
  },

  updateSettings(patch: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...patch };
    const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
    stmt.run('user_settings', JSON.stringify(updated));
    return updated;
  },

  // Operations & Telemetry Metrics
  getAdminMetrics() {
    const totalTasks = (db.prepare('SELECT count(*) as count FROM tasks').get() as { count: number }).count;
    const succeededTasks = (db.prepare("SELECT count(*) as count FROM tasks WHERE status = 'succeeded'").get() as { count: number }).count;
    const failedTasks = (db.prepare("SELECT count(*) as count FROM tasks WHERE status = 'failed'").get() as { count: number }).count;
    const waitingTasks = (db.prepare("SELECT count(*) as count FROM tasks WHERE status = 'waiting_for_input'").get() as { count: number }).count;
    const totalAssets = (db.prepare('SELECT count(*) as count FROM assets').get() as { count: number }).count;
    const totalBytes = (db.prepare('SELECT COALESCE(sum(size_bytes), 0) as total FROM assets').get() as { total: number }).total;
    const totalConversations = (db.prepare('SELECT count(*) as count FROM conversations').get() as { count: number }).count;
    const totalMessages = (db.prepare('SELECT count(*) as count FROM messages').get() as { count: number }).count;

    const toolBreakdown = db.prepare(`
      SELECT tool, count(*) as count, sum(size_bytes) as bytes 
      FROM assets 
      GROUP BY tool
    `).all() as Array<{ tool: string; count: number; bytes: number }>;

    const failureLogs = db.prepare(`
      SELECT id, user_prompt, status, tools_called, created_at, completed_at
      FROM tasks 
      WHERE status = 'failed'
      ORDER BY created_at DESC 
      LIMIT 10
    `).all() as any[];

    const pragmaWal = (db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string })?.journal_mode || 'wal';

    return {
      totalTasks,
      succeededTasks,
      failedTasks,
      waitingTasks,
      successRate: totalTasks > 0 ? Math.round((succeededTasks / totalTasks) * 100) : 100,
      totalAssets,
      totalBytes,
      totalConversations,
      totalMessages,
      toolBreakdown,
      failureLogs,
      pragmaWal,
    };
  },

  walCheckpoint() {
    return db.prepare('PRAGMA wal_checkpoint(TRUNCATE);').get();
  },

  getAllAuditLogs() {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100').all();
    const assets = db.prepare('SELECT id, name, type, size_bytes, tool, version, created_at FROM assets ORDER BY created_at DESC LIMIT 100').all();
    return {
      system: 'ModaUI Fashion Studio',
      exportedAt: new Date().toISOString(),
      tasks,
      assets,
    };
  },

  // Calibrated Models Management
  listCalibratedModels(activeOnly?: boolean): BaseModel[] {
    const sql = activeOnly
      ? 'SELECT * FROM calibrated_models WHERE is_active = 1 ORDER BY is_default DESC, is_preset DESC, created_at ASC'
      : 'SELECT * FROM calibrated_models ORDER BY is_default DESC, is_preset DESC, created_at ASC';
    const stmt = db.prepare(sql);
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      gender: r.gender,
      ethnicity: r.ethnicity || '',
      height: r.height || '',
      measurements: r.measurements || '',
      lighting: r.lighting || '',
      pose: r.pose || '',
      url: r.url,
      thumbnailUrl: r.thumbnail_url,
      description: r.description || '',
      isPreset: Boolean(r.is_preset),
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      calibrationScore: r.calibration_score || 95,
      calibrationReport: r.calibration_report ? JSON.parse(r.calibration_report) : undefined,
      createdAt: r.created_at,
    }));
  },

  getCalibratedModel(id: string): BaseModel | undefined {
    const stmt = db.prepare('SELECT * FROM calibrated_models WHERE id = ?');
    const r = stmt.get(id) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      gender: r.gender,
      ethnicity: r.ethnicity || '',
      height: r.height || '',
      measurements: r.measurements || '',
      lighting: r.lighting || '',
      pose: r.pose || '',
      url: r.url,
      thumbnailUrl: r.thumbnail_url,
      description: r.description || '',
      isPreset: Boolean(r.is_preset),
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      calibrationScore: r.calibration_score || 95,
      calibrationReport: r.calibration_report ? JSON.parse(r.calibration_report) : undefined,
      createdAt: r.created_at,
    };
  },

  insertCalibratedModel(m: BaseModel): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO calibrated_models (
        id, name, code, gender, ethnicity, height, measurements, lighting, pose,
        url, thumbnail_url, description, is_preset, is_active, is_default,
        calibration_score, calibration_report, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      m.id,
      m.name,
      m.code,
      m.gender,
      m.ethnicity,
      m.height,
      m.measurements,
      m.lighting,
      m.pose,
      m.url,
      m.thumbnailUrl,
      m.description,
      m.isPreset ? 1 : 0,
      m.isActive !== false ? 1 : 0,
      m.isDefault ? 1 : 0,
      m.calibrationScore ?? 95,
      JSON.stringify(m.calibrationReport ?? {}),
      m.createdAt || Date.now()
    );
  },

  updateCalibratedModel(id: string, updates: Partial<BaseModel>): void {
    const existing = this.getCalibratedModel(id);
    if (!existing) return;
    const merged = { ...existing, ...updates };
    this.insertCalibratedModel(merged);
  },

  deleteCalibratedModel(id: string): boolean {
    const existing = this.getCalibratedModel(id);
    if (!existing || existing.isPreset) return false;
    const stmt = db.prepare('DELETE FROM calibrated_models WHERE id = ? AND is_preset = 0');
    stmt.run(id);
    return true;
  },

  setDefaultModel(id: string): void {
    db.prepare('UPDATE calibrated_models SET is_default = 0').run();
    db.prepare('UPDATE calibrated_models SET is_default = 1, is_active = 1 WHERE id = ?').run(id);
  },
};
