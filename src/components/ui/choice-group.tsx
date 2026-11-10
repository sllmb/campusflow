import { cn } from "@/lib/utils";

type ChoiceGroupProps<T extends string> = {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  defaultValue: T;
  error?: string;
};

/** Boutons radio en forme de pilules (type, priorité…). */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  defaultValue,
  error,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex h-10 items-center rounded-full border-2 bg-surface px-4 text-sm font-bold transition-[background-color,box-shadow]",
                "peer-checked:bg-primary peer-checked:shadow-hard-sm",
                "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-[13px] font-semibold text-error">{error}</p>}
    </fieldset>
  );
}
