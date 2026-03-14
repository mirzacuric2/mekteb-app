import {
  Children,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type OptionLikeProps = {
  value?: string | number | readonly string[];
  children?: ReactNode;
  disabled?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, value, defaultValue, onChange, onBlur, disabled, name, ...props },
  ref
) {
  const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>((defaultValue as string) || "");
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: "top" | "bottom";
  }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
    placement: "bottom",
  });
  const controlledValue = typeof value === "string" ? value : undefined;

  const options = useMemo<SelectOption[]>(() => {
    return Children.toArray(children)
      .filter((child): child is ReactElement<OptionLikeProps> => isValidElement<OptionLikeProps>(child) && child.type === "option")
      .map((child) => {
        return {
          value: String(child.props.value ?? ""),
          label: String(child.props.children ?? ""),
          disabled: Boolean(child.props.disabled),
        };
      });
  }, [children]);

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    if (controlledValue !== undefined) return;
    if (internalValue) return;
    if (!options.length) return;
    setInternalValue(options[0].value);
  }, [controlledValue, internalValue, options]);

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" = spaceBelow < 220 && spaceAbove > spaceBelow ? "top" : "bottom";
    const maxHeight =
      placement === "top"
        ? Math.max(120, Math.min(280, spaceAbove - 12))
        : Math.max(120, Math.min(280, spaceBelow - 12));
    const top = placement === "top" ? rect.top - 4 : rect.bottom + 4;
    setMenuPosition({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement,
    });
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onViewportChange = () => updateMenuPosition();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open]);

  const triggerChange = (nextValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(nextValue);
    }
    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = nextValue;
      hiddenSelectRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <select
        ref={(node) => {
          hiddenSelectRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        name={name}
        value={selectedValue}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        {...props}
      >
        {children}
      </select>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-ring disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        <span className={cn("truncate", selectedOption ? "text-slate-900" : "text-slate-500")}>
          {selectedOption?.label || "Select..."}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-500" />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                maxHeight: menuPosition.maxHeight,
                transform: menuPosition.placement === "top" ? "translateY(-100%)" : undefined,
              }}
              className="z-[200] overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg"
            >
              {options.map((option) => {
                const isSelected = option.value === selectedValue;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      triggerChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm",
                      option.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-slate-50",
                      isSelected ? "bg-slate-100 text-slate-900" : "text-slate-700"
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
});
