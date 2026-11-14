'use client';

/**
 * Labeled range slider with a live value readout (e.g. "Opacity  40%").
 * Shared by the background panel and the service editor.
 *
 * @param {string}  label    - Text shown to the left of the value.
 * @param {number}  min
 * @param {number}  max
 * @param {number} [step]    - Defaults to 1.
 * @param {number}  value
 * @param {(v: number) => void} onChange
 * @param {string} [suffix]  - Appended to the readout (e.g. "%").
 * @param {boolean} [disabled]
 */
export default function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  suffix = '',
  disabled = false,
}) {
  return (
    <label className="slider">
      <span className="slider__label">
        {label}
        <em>
          {value}
          {suffix}
        </em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}
