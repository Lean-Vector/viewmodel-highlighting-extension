# ViewModel Highlighting & Formatter

**ViewModel Highlighting & Formatter** is a VSCode extension that provides syntax highlighting and smart formatting for `.viewmodel` files that include embedded JavaScript and custom `[[ ... ]]` templating.

---

## ✨ Features

- Syntax highlighting for `.viewmodel` templates
- JavaScript-aware formatting using VSCode’s built-in formatter
- Preserves original structure: semicolons, blank lines, `var` declarations, etc.
- Supports `[[ ... ]]` and `[[= ... ]]` templating placeholders
- Only formats the content of selected blocks: `header`, `body`, `declarations`

---

## 🧩 Example Template

```viewmodel
[[##body:
    createProperties: function () {
        const self = this;
        self.superclass.createProperties.apply(self, arguments);
    },

    selectItems: function(){
        const itemRoute = [[= JSON.stringify(getRoute()) ]];
    }
#]]
```

---

## ⚙️ Configuration

Uses your workspace or global VSCode settings:

- `editor.tabSize`
- `editor.insertSpaces`

Optional custom setting:

```json
"viewmodelFormatter.printWidth": 120
```

---

## 🛠️ Installation

### From VSIX

1. Run: `vsce package`
2. Install: `code --install-extension viewmodel-highlighting-extension-1.0.0.vsix`

### From Marketplace *(after publishing)*

Coming soon…

---

## 📄 License

[MIT](./LICENSE)

---

## 💡 Feedback / Issues

Please open issues or feature requests on [GitHub](https://github.com/Lean-Vector/viewmodel-highlighting-extension/issues).
