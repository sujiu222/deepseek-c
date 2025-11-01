/**
 * AI 模型配置和使用限制
 */

export type ModelTier = "premium" | "standard" | "basic";

export type ModelConfig = {
  id: string;
  name: string;
  provider: "openai" | "deepseek";
  tier: ModelTier;
  dailyLimit: number;
  description?: string;
  supportsReasoning?: boolean;
};

/**
 * 所有可用模型配置
 */
export const MODELS: ModelConfig[] = [
  // Premium 模型 - 每天5次
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    tier: "premium",
    dailyLimit: 5,
    description: "最先进的 GPT-5 模型",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    tier: "premium",
    dailyLimit: 5,
    description: "多模态 GPT-4o 模型",
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    tier: "premium",
    dailyLimit: 5,
    description: "GPT-4.1 升级版",
  },

  // Standard 模型 - 每天30次
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "deepseek",
    tier: "standard",
    dailyLimit: 30,
    description: "深度推理模型",
    supportsReasoning: true,
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "deepseek",
    tier: "standard",
    dailyLimit: 30,
    description: "DeepSeek 第三代模型",
  },
  {
    id: "deepseek-v3-2-exp",
    name: "DeepSeek V3.2 Exp",
    provider: "deepseek",
    tier: "standard",
    dailyLimit: 30,
    description: "DeepSeek V3.2 实验版",
  },

  // Basic 模型 - 每天200次
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    tier: "basic",
    dailyLimit: 200,
    description: "轻量级 GPT-4o",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    tier: "basic",
    dailyLimit: 200,
    description: "经典 GPT-3.5",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    tier: "basic",
    dailyLimit: 200,
    description: "轻量级 GPT-4.1",
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    tier: "basic",
    dailyLimit: 200,
    description: "超轻量 GPT-4.1",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    tier: "basic",
    dailyLimit: 200,
    description: "轻量级 GPT-5",
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    tier: "basic",
    dailyLimit: 200,
    description: "超轻量 GPT-5",
  },
];

/**
 * 根据层级分组模型
 */
export const MODELS_BY_TIER: Record<ModelTier, ModelConfig[]> = {
  premium: MODELS.filter((m) => m.tier === "premium"),
  standard: MODELS.filter((m) => m.tier === "standard"),
  basic: MODELS.filter((m) => m.tier === "basic"),
};

/**
 * 层级信息
 */
export const TIER_INFO: Record<
  ModelTier,
  { name: string; color: string; description: string }
> = {
  premium: {
    name: "高级模型",
    color: "text-purple-600",
    description: "每天 5 次",
  },
  standard: {
    name: "标准模型",
    color: "text-blue-600",
    description: "每天 30 次",
  },
  basic: {
    name: "基础模型",
    color: "text-green-600",
    description: "每天 200 次",
  },
};

/**
 * 根据 ID 查找模型配置
 */
export function getModelById(modelId: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === modelId);
}

/**
 * 获取默认模型
 */
export function getDefaultModel(): ModelConfig {
  return MODELS_BY_TIER.standard[0]; // deepseek-r1
}
