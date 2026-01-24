import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronsUpDown, X, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { POPULAR_TRADING_PAIRS, MAX_SYMBOLS_PER_SCRIPT } from '@/lib/constants';

interface SymbolMultiSelectProps {
  value: string[];
  onChange: (symbols: string[]) => void;
  disabled?: boolean;
  maxSymbols?: number;
  label?: string;
  placeholder?: string;
}

export default function SymbolMultiSelect({
  value = [],
  onChange,
  disabled = false,
  maxSymbols = MAX_SYMBOLS_PER_SCRIPT,
  label = 'Trading Symbols',
  placeholder = 'Select symbols...',
}: SymbolMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');

  const availableSymbols = useMemo(() => {
    return POPULAR_TRADING_PAIRS.filter((symbol) => !value.includes(symbol));
  }, [value]);

  const handleSelect = useCallback(
    (symbol: string) => {
      if (value.length >= maxSymbols) return;
      if (!value.includes(symbol)) {
        onChange([...value, symbol]);
      }
    },
    [value, onChange, maxSymbols]
  );

  const handleRemove = useCallback(
    (symbol: string) => {
      onChange(value.filter((s) => s !== symbol));
    },
    [value, onChange]
  );

  const handleAddCustom = useCallback(() => {
    const normalized = customSymbol.toUpperCase().trim();
    if (!normalized) return;
    if (value.length >= maxSymbols) return;
    if (value.includes(normalized)) {
      setCustomSymbol('');
      return;
    }
    
    // Basic validation: must end with USDT, BUSD, or be a valid pair format
    if (normalized.length < 4) return;
    
    onChange([...value, normalized]);
    setCustomSymbol('');
  }, [customSymbol, value, onChange, maxSymbols]);

  const isMaxReached = value.length >= maxSymbols;
  const hasError = value.length === 0;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label} *</Label>
          <span
            className={cn(
              'text-xs font-medium',
              isMaxReached ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {value.length} / {maxSymbols} selected
          </span>
        </div>
      )}

      {/* Selected Symbols */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-md border border-input bg-background">
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          value.map((symbol) => (
            <Badge
              key={symbol}
              variant="secondary"
              className="gap-1 pr-1 hover:bg-secondary/80"
            >
              {symbol}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(symbol)}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          At least 1 symbol is required
        </div>
      )}

      {/* Max reached warning */}
      {isMaxReached && (
        <div className="flex items-center gap-1.5 text-xs text-amber-500">
          <AlertCircle className="h-3.5 w-3.5" />
          Maximum {maxSymbols} symbols allowed
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2">
          {/* Popular Symbols Dropdown */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled || isMaxReached}
                className="flex-1 justify-between"
              >
                <span className="text-muted-foreground">Add from popular...</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search symbols..." />
                <CommandList>
                  <CommandEmpty>No symbols found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {availableSymbols.map((symbol) => (
                        <CommandItem
                          key={symbol}
                          value={symbol}
                          onSelect={() => {
                            handleSelect(symbol);
                            setOpen(false);
                          }}
                          disabled={isMaxReached}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value.includes(symbol) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {symbol}
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Custom Symbol Input */}
          <div className="flex gap-1">
            <Input
              placeholder="Custom symbol"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              disabled={disabled || isMaxReached}
              className="w-32"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddCustom}
              disabled={disabled || isMaxReached || !customSymbol.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Quick Add Buttons for Top Pairs */}
      {!disabled && value.length < maxSymbols && (
        <div className="flex flex-wrap gap-1">
          {POPULAR_TRADING_PAIRS.slice(0, 6)
            .filter((s) => !value.includes(s))
            .map((symbol) => (
              <Button
                key={symbol}
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => handleSelect(symbol)}
                disabled={isMaxReached}
              >
                + {symbol}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
