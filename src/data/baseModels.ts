export interface BaseModel {
  id: string;
  name: string;
  code: string;
  gender: 'female' | 'male';
  ethnicity: string;
  height: string;
  measurements: string;
  lighting: string;
  pose: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  isPreset?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  calibrationScore?: number;
  calibrationReport?: {
    symmetryScore: number;
    shoulderAlignment: string;
    backgroundCleanliness: string;
    drapeSuitability: string;
    status: 'calibrated' | 'warning' | 'pending';
  };
  createdAt?: number;
}

export const PRESET_BASE_MODELS: BaseModel[] = [
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
  },
];
