import { useState } from "react";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ShieldCheck, X } from "lucide-react";

type Framework = { id: string; code: string; name: string };

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  helper?: string;
  max?: number;
  disabled?: boolean;
  required?: boolean;
};

export function StandardsMultiSelect({
  value,
  onChange,
  label = "Applicable standards",
  helper = "Generated documents will follow each standard's required structure and citation rules.",
  max = 8,
  disabled = false,
  required = false,
}: Props) {
  const { data } = useListComplianceFrameworks();
  const frameworks = (data ?? []) as Framework[];
  const [open, setOpen] = useState(false);

  const selected = frameworks.filter((f) => value.includes(f.id));

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
          {label}{" "}
          {required ? (
            <span className="text-rose-600 font-normal">(required)</span>
          ) : (
            <span className="text-slate-400 font-normal">(optional)</span>
          )}
        </label>
        {value.length > 0 && (
          <button
            type="button"
            className="text-[11px] text-slate-500 hover:text-slate-700"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal h-auto min-h-9 py-2"
            data-testid="standards-multiselect-trigger"
          >
            <span className="text-left flex flex-wrap gap-1 flex-1">
              {selected.length === 0 ? (
                <span className="text-slate-500 text-sm">Select standards…</span>
              ) : (
                selected.map((f) => (
                  <Badge
                    key={f.id}
                    variant="secondary"
                    className="text-[10px] gap-1 pl-2 pr-1.5 py-0.5"
                  >
                    {f.code}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(f.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(f.id);
                        }
                      }}
                      className="hover:bg-slate-300 rounded-sm cursor-pointer p-0.5 inline-flex"
                      aria-label={`Remove ${f.code}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="max-h-72 overflow-y-auto py-1">
            {frameworks.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No frameworks available.</div>
            ) : (
              frameworks.map((f) => {
                const checked = value.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className="flex items-start gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                    data-testid={`standards-option-${f.code.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(f.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{f.code}</div>
                      <div className="text-xs text-slate-500 truncate">{f.name}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {helper && <p className="text-[11px] text-slate-500">{helper}</p>}
    </div>
  );
}
