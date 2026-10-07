/**
 * Custom Decap CMS widgets for picking country names from a fixed list while
 * still allowing novel values (list-forward, but not a hard whitelist).
 *
 * `country`      — single value (string). Used for chair.country.
 * `countryList`  — many values (string[]) shown as removable chips. Used for
 *                  commission memberCountries and post tags.
 *
 * Both back onto a native <datalist>, so the browser supplies an accessible,
 * searchable dropdown of window.COUNTRY_OPTIONS (generated from the same
 * i18n-iso-countries source the runtime map resolver uses) while letting an
 * editor type a value that is not on the list.
 *
 * `createClass` and `h` are globals exposed by the Decap CMS bundle for
 * no-build custom widgets (h === React.createElement).
 */
(function () {
  if (typeof CMS === "undefined") {
    console.error("country-widget: Decap CMS not loaded before this script.");
    return;
  }

  function options() {
    return window.COUNTRY_OPTIONS || [];
  }

  // Decap loads entry values as Immutable structures but does not expose
  // Immutable globally for no-build widgets. Read defensively; write a plain
  // array (serialises correctly for both JSON and frontmatter collections).
  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.toArray === "function") return value.toArray();
    return [];
  }

  function datalistOptions() {
    return options().map(function (name) {
      return h("option", { key: name, value: name });
    });
  }

  var CountryListControl = createClass({
    getInitialState: function () {
      return { input: "" };
    },
    getValues: function () {
      return toArray(this.props.value);
    },
    isValid: function () {
      var field = this.props.field;
      var required = !(field && field.get && field.get("required") === false);
      if (required && this.getValues().length === 0) {
        return { error: { message: "Add at least one country." } };
      }
      return true;
    },
    add: function (name) {
      var trimmed = (name || "").trim();
      if (!trimmed) return;
      var values = this.getValues();
      if (values.indexOf(trimmed) === -1) {
        this.props.onChange(values.concat([trimmed]));
      }
      this.setState({ input: "" });
    },
    remove: function (name) {
      this.props.onChange(
        this.getValues().filter(function (n) {
          return n !== name;
        })
      );
    },
    handleKeyDown: function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.add(this.state.input);
      } else if (e.key === "Backspace" && this.state.input === "") {
        var values = this.getValues();
        if (values.length) this.remove(values[values.length - 1]);
      }
    },
    render: function () {
      var self = this;
      var values = this.getValues();
      var listId = (this.props.forID || "country-list") + "-options";

      var chips = values.map(function (name) {
        return h("span", { key: name, className: "country-chip" }, [
          h("span", { key: "label" }, name),
          h(
            "button",
            {
              key: "x",
              type: "button",
              className: "country-chip__remove",
              "aria-label": "Remove " + name,
              onClick: function () {
                self.remove(name);
              },
            },
            "×"
          ),
        ]);
      });

      return h("div", { className: this.props.classNameWrapper }, [
        h("div", { key: "field", className: "country-field" }, [
          chips,
          h("input", {
            key: "input",
            id: this.props.forID,
            className: "country-field__input",
            type: "text",
            list: listId,
            value: this.state.input,
            placeholder: values.length ? "Add another country…" : "Search countries…",
            onChange: function (e) {
              var v = e.target.value;
              self.setState({ input: v });
              // A datalist click reports the full option string; commit it.
              if (options().indexOf(v) !== -1) self.add(v);
            },
            onKeyDown: this.handleKeyDown,
            onBlur: function () {
              self.add(self.state.input);
            },
          }),
        ]),
        h("datalist", { key: "list", id: listId }, datalistOptions()),
      ]);
    },
  });

  var CountryControl = createClass({
    render: function () {
      var self = this;
      var listId = (this.props.forID || "country") + "-options";
      return h("div", { className: this.props.classNameWrapper }, [
        h("input", {
          key: "input",
          id: this.props.forID,
          className: "country-field__input",
          type: "text",
          list: listId,
          value: this.props.value || "",
          placeholder: "Search countries…",
          onChange: function (e) {
            self.props.onChange(e.target.value);
          },
        }),
        h("datalist", { key: "list", id: listId }, datalistOptions()),
      ]);
    },
  });

  // Previews must coerce values to plain strings: existing entries load as
  // Immutable structures, and rendering one directly as a React child throws.
  var CountryListPreview = createClass({
    render: function () {
      return h("span", {}, toArray(this.props.value).join(", "));
    },
  });

  var CountryPreview = createClass({
    render: function () {
      return h("span", {}, this.props.value || "");
    },
  });

  CMS.registerWidget("countryList", CountryListControl, CountryListPreview);
  CMS.registerWidget("country", CountryControl, CountryPreview);
})();
