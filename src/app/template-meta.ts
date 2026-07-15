import {TEMPLATE_IDS, type TemplateId} from '../engine/types';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  shortName: string;
  description: string;
  glyph: string;
  flashes?: boolean;
}

const TEMPLATE_METADATA: Record<TemplateId, Omit<TemplateMeta, 'id'>> = {
  'bold-cuts': {name: '黑白跳切', shortName: '跳切', description: '超大裁切、硬切与密集平铺', glyph: '艺'},
  'fly-grid': {name: '飞入网格', shortName: '飞格', description: '字符从四边冲入网格', glyph: '↘'},
  'elastic-type': {name: '弹性文字', shortName: '拉伸', description: '压缩、拉伸与回落', glyph: '变'},
  'tunnel-zoom': {name: '无限推进', shortName: '隧道', description: '多层描边穿越镜头', glyph: '◎'},
  'flash-invert': {name: '闪烁反相', shortName: '闪变', description: '黑白反相与扫描揭示', glyph: '◩', flashes: true},
  'tile-storm': {name: '密集平铺', shortName: '字暴', description: '重复字阵持续横移', glyph: '林'},
  'glitch-slice': {name: '故障切片', shortName: '错帧', description: '横向切片随机错位', glyph: '裂'},
  'scatter-assemble': {name: '散落聚合', shortName: '聚散', description: '字符散开后重新编组', glyph: '集'},
  'wave-flow': {name: '波浪字流', shortName: '字浪', description: '逐字沿正弦波上下流动', glyph: '≈'},
  typewriter: {name: '打字显现', shortName: '打字', description: '逐字输入、光标闪动与回删', glyph: '▌'},
  'shutter-reveal': {name: '快门揭示', shortName: '快门', description: '交错条带从两侧切入', glyph: '≡'},
};

export const TEMPLATES: TemplateMeta[] = TEMPLATE_IDS.map((id) => ({id, ...TEMPLATE_METADATA[id]}));
