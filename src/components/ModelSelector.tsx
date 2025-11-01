"use client";

import { useState } from "react";
import {
  MODELS_BY_TIER,
  TIER_INFO,
  type ModelConfig,
  type ModelTier,
} from "@/lib/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles } from "lucide-react";

type ModelSelectorProps = {
  selectedModel: ModelConfig;
  onModelChange: (model: ModelConfig) => void;
  disabled?: boolean;
};

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (model: ModelConfig) => {
    onModelChange(model);
    setOpen(false);
  };

  const renderTierGroup = (tier: ModelTier) => {
    const tierModels = MODELS_BY_TIER[tier];
    const tierInfo = TIER_INFO[tier];

    return (
      <DropdownMenuGroup key={tier}>
        <DropdownMenuLabel className="flex items-center justify-between px-2">
          <span className={tierInfo.color}>{tierInfo.name}</span>
          <span className="text-xs text-gray-500">{tierInfo.description}</span>
        </DropdownMenuLabel>
        {tierModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSelect(model)}
            className={`cursor-pointer ${
              selectedModel.id === model.id ? "bg-blue-50" : ""
            }`}
          >
            <div className="flex flex-col gap-0.5 w-full">
              <div className="flex items-center justify-between">
                <span className="font-medium">{model.name}</span>
                {model.supportsReasoning && (
                  <Sparkles className="w-3 h-3 text-amber-500" />
                )}
              </div>
              {model.description && (
                <span className="text-xs text-gray-500">
                  {model.description}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
      </DropdownMenuGroup>
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[180px] h-auto py-1.5"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-sm">{selectedModel.name}</span>
            {selectedModel.supportsReasoning && (
              <Sparkles className="w-3 h-3 text-amber-500" />
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]" align="start">
        {renderTierGroup("premium")}
        {renderTierGroup("standard")}
        {renderTierGroup("basic")}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
