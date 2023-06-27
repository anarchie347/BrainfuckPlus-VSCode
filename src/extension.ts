import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';

let methodNames : string = "";

export async function activate(context: vscode.ExtensionContext) {
    console.log("ACTIVATED");
    UpdateMethodNames();

    //for method highlighting
    const changeWSFolder = vscode.workspace.onDidChangeWorkspaceFolders(UpdateMethodNames);
    const createFile = vscode.workspace.onDidCreateFiles(UpdateMethodNames);
    const deleteFile = vscode.workspace.onDidDeleteFiles(UpdateMethodNames);
    const renameFile = vscode.workspace.onDidRenameFiles(UpdateMethodNames);
    context.subscriptions.push(changeWSFolder);
    context.subscriptions.push(createFile);
    context.subscriptions.push(deleteFile);
    context.subscriptions.push(renameFile);

    //for errors
    
    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
        {
            language: "bfp",
            scheme: "file"
        },
        new MySemanticTokensProvider(),
        new vscode.SemanticTokensLegend(["method"])
    );

    vscode.languages.registerCodeActionsProvider("bfp", { provideCodeActions(document : vscode.TextDocument, range : vscode.Range, context : vscode.CodeActionContext, token : vscode.CancellationToken) {
        const codeActions = [];
    
        let regex = new RegExp(/[A-Z]/)
        for (let i = 0; i < document.lineCount; i++) {
            const result = regex.exec(document.lineAt(i).text)
            if (result) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(
                        new vscode.Position(i, result.index),
                        new vscode.Position(i, result.index + 1)
                    ),
                    "TEST ERROR",
                    vscode.DiagnosticSeverity.Error
                );
                codeActions.push(diagnostic);

                const codeAction = new vscode.CodeAction(
                    "Stop running the test build",
                    vscode.CodeActionKind.QuickFix
                );

                codeAction.diagnostics = [diagnostic];
                codeAction.isPreferred = true;
                codeAction.edit = new vscode.WorkspaceEdit();

                codeActions.push(codeAction);
                vscode.prov
            }
        }
        
        return codeActions }});
    //const languageProvider = new MyLanguageProvider();
    //context.subscriptions.push(provider);
    //context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({language: "bfp"}, languageProvider));
    //context.subscriptions.push(languageProvider);
}

async function UpdateMethodNames() {
    const files = await vscode.workspace.findFiles('**/*.bfp');
    methodNames = "";
    for (let i = 0; i < files.length; i++) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        //if in the same directory, rather than a nested one
        if (workspaceFolders) {
            if (path.dirname(files[i].fsPath) == workspaceFolders[0].uri.fsPath) {
                methodNames += path.basename(files[i].fsPath)[0];
            }
        }
    }
    console.log("METHODNAMES UPDATED: " + methodNames);
}

function provideCodeActionsold(document : vscode.TextDocument, range : vscode.Range, context : vscode.CodeActionContext, token : vscode.CancellationToken) {
    const codeActions = [];

    let regex = new RegExp(/[A-Z]/)
    for (let i = 0; i < document.lineCount; i++) {
        const result = regex.exec(document.lineAt(i).text)
        if (result) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(
                    new vscode.Position(i, result.index),
                    new vscode.Position(i, result.index + 1)
                ),
                "TEST ERROR",
                vscode.DiagnosticSeverity.Error
            );
            codeActions.push(diagnostic);
        }
    }
    
    return codeActions;
}


class MySemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens> {
        //console.log("pdst began");
        //vscode.window.showInformationMessage("pdst");
        const tokensBuilder = new vscode.SemanticTokensBuilder();
        const text = document.getText();
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            for (let j = 0; j < line.length; j++) {
                if (methodNames.includes(line[j])) {
                    tokensBuilder.push(i, j, 1, 0, 0);
                }
                
            }
        }
        
        return tokensBuilder.build();
    }
}

class MyLanguageProvider implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
    }

    provideDiagnosticCollection(document: vscode.TextDocument) {
        console.log("diagnostic");
        this.diagnosticCollection.delete(document.uri);

        const text = document.getText();
        
        let lineNo: number = 0;
        let charNo: number = 0;
        const lineCount = document.lineCount;
        


        while (!(lineNo == lineCount)) {
            const lineText = document.lineAt(lineNo).text;
            
            //repetition
            if (lineText[charNo] == "*") {
                const range = new vscode.Range(lineNo, charNo, lineNo, charNo);
                const diag: vscode.Diagnostic = new vscode.Diagnostic(range, "TESTING", vscode.DiagnosticSeverity.Error);
            }


            charNo++;
            if (charNo == lineText.length) {
                charNo == 0;
                lineNo++;
            }
        }
    }

    dispose() {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
    }
}


