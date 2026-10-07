/**
 * Custom Decap CMS widget for picking a language by name while storing its ISO
 * 639-1 code (list-forward, but not a hard whitelist).
 *
 * `language` — single value (string). Used for name.translations[].language.
 *
 * The field's stored value is a bare code (e.g. "en") because the runtime
 * matches it exactly and case-sensitively. The editor, however, sees and
 * searches a friendly "English (en)" label backed by a native <datalist>, so a
 * mistyped value can no longer silently break English-name resolution while an
 * unlisted code is still accepted.
 *
 * `createClass` and `h` are globals exposed by the Decap CMS bundle for
 * no-build custom widgets (h === React.createElement).
 */
(function () {
  if (typeof CMS === "undefined") {
    console.error("language-widget: Decap CMS not loaded before this script.");
    return;
  }

  function options() {
    return window.LANGUAGE_OPTIONS || [];
  }

  function displayFor(opt) {
    return opt.name + " (" + opt.code + ")";
  }

  // Map the stored code back to its friendly label so the input shows
  // "English (en)" rather than a bare code on load.
  function labelForCode(code) {
    if (!code) return "";
    var opts = options();
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].code === code) return displayFor(opts[i]);
    }
    return code;
  }

  // True when the raw input exactly equals a known option's display label —
  // i.e. the editor clicked a datalist entry rather than mid-typing.
  function matchedOption(raw) {
    var opts = options();
    for (var i = 0; i < opts.length; i++) {
      if (displayFor(opts[i]) === raw) return opts[i];
    }
    return null;
  }

  // Resolve whatever the editor typed or picked to the value we store: a code.
  // Accepts the display label, a bare code, or a language name; otherwise keeps
  // the raw text so unlisted values are still allowed.
  function toCode(raw) {
    var trimmed = (raw || "").trim();
    if (!trimmed) return "";
    var exact = matchedOption(trimmed);
    if (exact) return exact.code;
    var lower = trimmed.toLowerCase();
    var opts = options();
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].code.toLowerCase() === lower) return opts[i].code;
    }
    for (var j = 0; j < opts.length; j++) {
      if (opts[j].name.toLowerCase() === lower) return opts[j].code;
    }
    return trimmed;
  }

  var LanguageControl = createClass({
    getInitialState: function () {
      return { input: labelForCode(this.props.value || "") };
    },
    commit: function (raw) {
      var code = toCode(raw);
      this.props.onChange(code);
      this.setState({ input: labelForCode(code) });
    },
    render: function () {
      var self = this;
      var listId = (this.props.forID || "language") + "-options";
      return h("div", { className: this.props.classNameWrapper }, [
        h("input", {
          key: "input",
          id: this.props.forID,
          className: "country-field__input",
          type: "text",
          list: listId,
          value: this.state.input,
          placeholder: "Search languages…",
          onChange: function (e) {
            var v = e.target.value;
            self.setState({ input: v });
            // A datalist click reports the full label; commit it immediately.
            if (matchedOption(v)) self.commit(v);
          },
          onBlur: function () {
            self.commit(self.state.input);
          },
        }),
        h(
          "datalist",
          { key: "list", id: listId },
          options().map(function (opt) {
            return h("option", { key: opt.code, value: displayFor(opt) });
          })
        ),
      ]);
    },
  });

  // Previews load existing values as plain strings; show the friendly label.
  var LanguagePreview = createClass({
    render: function () {
      return h("span", {}, labelForCode(this.props.value || ""));
    },
  });

  CMS.registerWidget("language", LanguageControl, LanguagePreview);
})();
