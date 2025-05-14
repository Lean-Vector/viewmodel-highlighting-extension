import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  //vscode.window.showInformationMessage("✅ ViewModel formatter started");

  const allowedBlocks = ['body', 'declarations', 'methods', 'functions'];
  const blockFormatStrategy: Record<string, 'object' | 'function'> = {
    declarations: 'function',
    header: 'function',
    body: 'object',
  };

  const scheme = 'viewmodel-format';
  const providerMap = new Map<string, string>();

  const provider: vscode.TextDocumentContentProvider = {
    provideTextDocumentContent(uri: vscode.Uri): string {
      return providerMap.get(uri.toString()) || '';
    }
  };

  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(scheme, provider));

  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((e) => {
      e.waitUntil((async () => {
        const originalText = e.document.getText();
        const edits: vscode.TextEdit[] = [];
        const blockRegex = /\[\[#\#(\w+):(.*?)#\]\]/gms;

        // Reset virtual doc content
        providerMap.clear();

        const editor = vscode.window.visibleTextEditors.find(ed => ed.document.uri.toString() === e.document.uri.toString());
        const insertSpaces = editor?.options.insertSpaces === false ? false : true;
        const tabSize = typeof editor?.options.tabSize === 'number' ? editor.options.tabSize : 2;

        let match;
        let counter = 0;

        while ((match = blockRegex.exec(originalText)) !== null) {
          try {
            const blockName = match[1];
            const blockContent = match[2];

            if (!allowedBlocks.includes(blockName)) continue;

            const startOffset = match.index + match[0].indexOf(blockContent);
            const endOffset = startOffset + blockContent.length;
            const start = e.document.positionAt(startOffset);
            const end = e.document.positionAt(endOffset);
            const range = new vscode.Range(start, end);

            const leadingNewline = /^\s*\n/.test(blockContent) ? "\n" : "";
            const trailingNewline = /\n\s*$/.test(blockContent) ? "\n" : "";

            const templateRegex = /\[\[(=)?([\s\S]*?)\]\]/g;
            const templates: string[] = [];
            const sanitized = blockContent.replace(templateRegex, (_, eq, expr) => {
              const key = `__TEMPLATE_${templates.length}__`;
              templates.push(`[[${eq || ''}${expr}]]`);
              return key;
            });

            const strategy = blockFormatStrategy[blockName] || 'object';
            let wrapperStart = '', wrapperEnd = '';
            if (strategy === 'object') {
              wrapperStart = 'const __obj = {\n';
              wrapperEnd = '\n}';
            } else {
              wrapperStart = 'function __f() {\n';
              wrapperEnd = '\n}';
            }

            const wrappedCode = wrapperStart + sanitized.trim() + wrapperEnd;
            const uri = vscode.Uri.parse(`${scheme}:/block-${Date.now()}-${counter++}.js`);
            providerMap.set(uri.toString(), wrappedCode);

            const virtualDoc = await vscode.workspace.openTextDocument(uri);
            const formattedEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
              'vscode.executeFormatDocumentProvider',
              uri,
              { insertSpaces, tabSize }
            );

            if (!formattedEdits) continue;

            let formatted = wrappedCode;
            for (const edit of formattedEdits.reverse()) {
              const offsetStart = virtualDoc.offsetAt(edit.range.start);
              const offsetEnd = virtualDoc.offsetAt(edit.range.end);
              formatted = formatted.slice(0, offsetStart) + edit.newText + formatted.slice(offsetEnd);
            }

            let unwrapped = formatted;
            if (strategy === 'object') {
              unwrapped = formatted.replace(/^const __obj = \{\n?/, '').replace(/\n?\};?\s*$/, '');
            } else {
              unwrapped = formatted.replace(/^function __f\(\) \{\n?/, '').replace(/\n?\};?\s*$/, '');
            }

            templates.forEach((original, i) => {
              const key = `__TEMPLATE_${i}__`;
              unwrapped = unwrapped.replace(new RegExp(key, 'g'), original);
            });

            edits.push(new vscode.TextEdit(range, `${leadingNewline}${unwrapped.trimEnd()}${trailingNewline}`));
          } catch (err) {
            console.warn('❌ Skipping block due to formatting error:', err);
          }
        }

        return edits;
      })());
    })
  );
}

export function deactivate() { }