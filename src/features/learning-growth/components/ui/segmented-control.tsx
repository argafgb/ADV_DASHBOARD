"use client";

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
}

interface SegmentedControlProps<K extends string> {
  options: readonly SegmentOption<K>[];
  value: K;
  onChange: (next: K) => void;
  ariaLabel: string;
}

/** Reference segmented control: #EEF1F6 track, white active pill, blue text. */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<K>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-[2px] rounded-[9px] bg-[#EEF1F6] dark:bg-zinc-800 p-[3px] shadow-[inset_0_1px_3px_rgba(16,24,40,0.08)] sm:flex sm:w-auto"
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={
              active
                ? "min-w-0 cursor-pointer rounded-[7px] bg-white dark:bg-zinc-900 px-2.5 py-[6px] text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.1),0_3px_8px_rgba(16,24,40,0.1)] transition-[background-color,color] duration-150 sm:px-[14px] sm:text-[12.5px]"
                : "min-w-0 cursor-pointer rounded-[7px] bg-transparent px-2.5 py-[6px] text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400 transition-[background-color,color] duration-150 hover:text-blue-600 dark:hover:text-blue-400 sm:px-[14px] sm:text-[12.5px]"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
