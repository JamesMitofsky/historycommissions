/**
 * Custom TinaCMS fields for values that must match what the site resolves at
 * build time, ported from the Decap widgets they replace.
 *
 * Each one is list-forward rather than a hard whitelist: a native <datalist>
 * gives a searchable dropdown of known values, but an editor can still type a
 * value that is not on it. A Tina `options` select would refuse those outright,
 * which is the wrong trade for country names that may legitimately predate or
 * sit outside the ISO register.
 *
 * Tina compiles Tailwind classes used here into its own stylesheet, so the
 * styling below matches the stock admin inputs.
 */
import React, { useEffect, useId, useState } from "react";
import { wrapFieldsWithMeta, type TinaField } from "tinacms";
import { COUNTRY_OPTIONS } from "./options/countries";
import { LANGUAGE_OPTIONS } from "./options/languages";

const INPUT_CLASS =
  "shadow-inner focus:shadow-outline focus:border-blue-500 focus:outline-none block text-base placeholder:text-gray-300 px-3 py-2 text-gray-600 w-full bg-white border border-gray-200 transition-all ease-out duration-150 focus:text-gray-900 rounded";

/**
 * Tina types `onChange` as taking a change event, but it is react-final-form's
 * `onChange` underneath, which stores whatever it is given. Passing the value
 * directly is how Tina's own list and select fields use it.
 */
type ValueInput<T> = {
  name: string;
  value: T;
  onChange: (value: T) => void;
};

function asValueInput<T>(input: unknown): ValueInput<T> {
  return input as ValueInput<T>;
}

/**
 * The schema's `ui.component` type describes props as `{ field, input, meta }`,
 * but Tina renders the component with its full field props, `form` and
 * `tinaForm` included, which `wrapFieldsWithMeta` needs for the label and
 * error display. The two types come from different Tina packages and do not
 * agree; this is the one place that bridges them.
 */
type StringFieldUI = NonNullable<Extract<TinaField, { type: "string" }>["ui"]>;
type SchemaComponentProps = Parameters<
  Extract<NonNullable<StringFieldUI["component"]>, (...args: never[]) => unknown>
>[0];
type SchemaComponent = (props: SchemaComponentProps) => React.ReactNode;

function schemaComponent(
  component: ReturnType<typeof wrapFieldsWithMeta>,
): SchemaComponent {
  return component as unknown as SchemaComponent;
}

function CountryDatalist({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {COUNTRY_OPTIONS.map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  );
}

/**
 * Many countries (string[]) shown as removable chips. Used for commission
 * memberCountries and post tags.
 */
export const CountryListField = schemaComponent(wrapFieldsWithMeta((props) => {
  const input = asValueInput<string[] | null>(props.input);
  const values = Array.isArray(input.value) ? input.value : [];
  const [draft, setDraft] = useState("");
  const listId = `${useId()}-countries`;

  function add(raw: string) {
    const name = raw.trim();
    setDraft("");
    if (name && !values.includes(name)) input.onChange([...values, name]);
  }

  function remove(name: string) {
    input.onChange(values.filter((v) => v !== name));
  }

  return (
    <div>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2">
          {values.map((name) => (
            <li
              key={name}
              className="inline-flex items-center gap-1 rounded bg-gray-100 pl-2 pr-1 py-0.5 text-sm text-gray-700"
            >
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                className="px-1 text-gray-500 hover:text-red-600"
                onClick={() => remove(name)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={input.name}
        className={INPUT_CLASS}
        type="text"
        list={listId}
        value={draft}
        placeholder={values.length ? "Add another country…" : "Search countries…"}
        onChange={(e) => {
          const v = e.target.value;
          // Picking a datalist entry reports the full option string; commit it
          // straight away rather than waiting for Enter or blur.
          if (COUNTRY_OPTIONS.includes(v)) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && draft === "" && values.length) {
            remove(values[values.length - 1]);
          }
        }}
        onBlur={() => add(draft)}
      />
      <CountryDatalist id={listId} />
    </div>
  );
}));

/** A single country (string). Used for chairs[].country. */
export const CountryField = schemaComponent(wrapFieldsWithMeta((props) => {
  const input = asValueInput<string | null>(props.input);
  const listId = `${useId()}-countries`;
  return (
    <>
      <input
        id={input.name}
        className={INPUT_CLASS}
        type="text"
        list={listId}
        value={input.value ?? ""}
        placeholder="Search countries…"
        onChange={(e) => input.onChange(e.target.value)}
      />
      <CountryDatalist id={listId} />
    </>
  );
}));

function languageLabel(code: string): string {
  const opt = LANGUAGE_OPTIONS.find((o) => o.code === code);
  return opt ? `${opt.name} (${opt.code})` : code;
}

/**
 * Resolve whatever the editor typed or picked to the value we store: an ISO
 * 639-1 code. Accepts the display label, a bare code, or a language name, and
 * otherwise keeps the raw text so an unlisted code is still allowed.
 */
function toLanguageCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  const match =
    LANGUAGE_OPTIONS.find((o) => `${o.name} (${o.code})` === trimmed) ??
    LANGUAGE_OPTIONS.find((o) => o.code.toLowerCase() === lower) ??
    LANGUAGE_OPTIONS.find((o) => o.name.toLowerCase() === lower);
  return match ? match.code : trimmed;
}

/**
 * A language picked by name but stored as its code. Used for
 * name.translations[].language.
 *
 * The runtime matches the code exactly (`t.language === "en"`), so a typo such
 * as "EN" or "english" would silently break English-name resolution. The editor
 * sees and searches "English (en)" while the file only ever gets "en".
 */
export const LanguageField = schemaComponent(wrapFieldsWithMeta((props) => {
  const input = asValueInput<string | null>(props.input);
  const stored = input.value ?? "";
  const [draft, setDraft] = useState(() => languageLabel(stored));
  const listId = `${useId()}-languages`;

  // Keep the visible label in step if the value changes underneath us, e.g.
  // when Tina resets the form after a save.
  useEffect(() => {
    setDraft(languageLabel(stored));
  }, [stored]);

  function commit(raw: string) {
    const code = toLanguageCode(raw);
    input.onChange(code);
    setDraft(languageLabel(code));
  }

  return (
    <>
      <input
        id={input.name}
        className={INPUT_CLASS}
        type="text"
        list={listId}
        value={draft}
        placeholder="Search languages…"
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
          if (LANGUAGE_OPTIONS.some((o) => `${o.name} (${o.code})` === v)) {
            commit(v);
          }
        }}
        onBlur={() => commit(draft)}
      />
      <datalist id={listId}>
        {LANGUAGE_OPTIONS.map((o) => (
          <option key={o.code} value={`${o.name} (${o.code})`} />
        ))}
      </datalist>
    </>
  );
}));

/**
 * A calendar date stored as a bare "YYYY-MM-DD" string, or null when cleared.
 *
 * Tina's own datetime field saves a full ISO timestamp built from local
 * midnight, so for an editor east of UTC "1995-01-01" would be written as
 * "1994-12-31T…Z" and every page that reads `.slice(0, 4)` would show the
 * wrong year. A native date input has no time and no zone, so the stored value
 * is exactly the date the editor picked.
 */
export const DateOnlyField = schemaComponent(wrapFieldsWithMeta((props) => {
  const input = asValueInput<string | null>(props.input);
  return (
    <input
      id={input.name}
      className={INPUT_CLASS}
      type="date"
      value={input.value ?? ""}
      onChange={(e) => input.onChange(e.target.value || null)}
    />
  );
}));
