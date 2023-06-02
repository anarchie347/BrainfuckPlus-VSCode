import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';

import { UpdateMethodNames } from './MethodNames';

export async function activate(context: vscode.ExtensionContext) {

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const fileNames = vscode.workspace.getConfiguration().get<string[]>("files.exclude");
        if (fileNames) {
            for (const fileName of fileNames) {
                const grammar = vscode.workspace.createFileSystemWatcher(fileName);
                context.subscriptions.push(grammar);

                grammar.onDidChange(() => {
                    //reapply grammar when file changes
                    vscode.window.visibleTextEditors.forEach(editor => {
                        if (editor.document.uri.fsPath.endsWith(fileName)) {
                            vscode.languages.setTextDocumentLanguage(editor.document, "bfp");

                        }
                    });
                });

                //set initial grammar for existing files
                vscode.workspace.findFiles(fileName).then(files => {
                    files.forEach(file => {
                        vscode.workspace.openTextDocument(file).then(document => {
                            if (document.languageId === "plaintext" && document.uri.fsPath.endsWith(fileName)) {
                                vscode.languages.setTextDocumentLanguage(document, "bfp");
                            }
                        });
                    });
                });
            }
        }
    }

    //UpdateMethodNames();
    
}



const staticGrammar = [
    [
        {
            name: "keyword.operator.bfp",
            match: "[\\+-]"
        },
        {
            name: "keyword.move.bfp",
            match: "[<>]"
        },
        {
            name: "keyword.io.bfp",
            match: "[\\.,]"
        },
        {
            name: "keyword.debug.bfp",
            match: "[\\\\:?\"\\|]"
        },
        {
            name: "keyword.repetition.bfp",
            match: "\\*"
        },
        {
            name: "comment.line.bfp",
            match: "/.*$"
        },
        {
            name: "constant.numeric.bfp",
            match: "[0123456789]"
        }
    ]
];
