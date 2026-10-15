'use client';

export interface CategoryField {
  id: number;
  field_key: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'select' | 'boolean';
  options: string[];
  placeholder: string | null;
  is_required: boolean;
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none';

/** First required field left unanswered, so each form can surface the same message. */
export function findMissingRequiredField(
  fields: CategoryField[],
  values: Record<string, string>
): CategoryField | undefined {
  return fields.find((field) => field.is_required && !(values[field.field_key] || '').trim());
}

/**
 * Renders the posting details a category defines. Answers are kept as plain
 * strings and posted as a JSON `attributes` object, which the backend
 * re-validates against the category's field definitions.
 */
export default function CategoryFieldsInput({
  fields,
  values,
  onChange,
  heading,
}: {
  fields: CategoryField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  heading?: string;
}) {
  if (fields.length === 0) return null;

  const setValue = (key: string, value: string) => onChange({ ...values, [key]: value });

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      {heading && (
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{heading}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className={field.field_type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.is_required && <span className="text-red-500">*</span>}
            </label>

            {field.field_type === 'textarea' ? (
              <textarea
                rows={3}
                value={values[field.field_key] || ''}
                onChange={(e) => setValue(field.field_key, e.target.value)}
                placeholder={field.placeholder || ''}
                className={inputClass}
              />
            ) : field.field_type === 'select' ? (
              <select
                value={values[field.field_key] || ''}
                onChange={(e) => setValue(field.field_key, e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.field_type === 'boolean' ? (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={values[field.field_key] === 'true'}
                  onChange={(e) => setValue(field.field_key, String(e.target.checked))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {field.placeholder || 'Yes'}
              </label>
            ) : (
              <input
                type={field.field_type === 'number' ? 'number' : 'text'}
                value={values[field.field_key] || ''}
                onChange={(e) => setValue(field.field_key, e.target.value)}
                placeholder={field.placeholder || ''}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}