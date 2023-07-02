import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';
import { start } from 'repl';

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

    const languageProvider = new MyLanguageProvider();
    context.subscriptions.push(provider);
    //context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({language: "bfp"}, languageProvider));
    context.subscriptions.push(languageProvider);

    const diagnosticCollection = vscode.languages.createDiagnosticCollection("TESTDIAG");
    vscode.workspace.onDidChangeTextDocument(event => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && event.document === activeEditor.document) {
            validateTextDocument(event.document, diagnosticCollection);
        }
    })

    if (vscode.window.activeTextEditor) {
        validateTextDocument(vscode.window.activeTextEditor.document, diagnosticCollection)
    }

    context.subscriptions.push(diagnosticCollection);
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

function validateTextDocument(document : vscode.TextDocument, diagnosticCollection : vscode.DiagnosticCollection) {
    /*const diagnostics : vscode.Diagnostic[] = []
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);

        const regex = /[A-Z]/g;
        let match;
        while ((match = regex.exec(line.text)) !== null) {
            const diagnosticRange = new vscode.Range(i, match.index, i, match.index + 1)

            const diagnostic = new vscode.Diagnostic( diagnosticRange, "TEST", vscode.DiagnosticSeverity.Error)
            diagnostics.push(diagnostic);
        }

    }
    diagnosticCollection.set(document.uri, diagnostics);
    */
   const diagnostics : vscode.Diagnostic[] = [];
   let code : string = document.getText();
   console.log(`Line: ${document.positionAt(5).line}, Position: ${document.positionAt(5).character}`);
   let j : number; //can be used to look around the nearby code while still storing the index the check began at
   for (let i = 0; i < code.length; i++) {
    j = i;
    //comment
    if (code[i] == "/") {
        const nextlinePos = new vscode.Position(document.positionAt(i).line + 1,0)
        i = document.offsetAt(nextlinePos) - 1;
        continue;
    }
    //start of injection call  
    if (code[i] == "(") {
        const numCheckResponse = NumCheck(document, i + 1, ")");
        if (numCheckResponse.result == NumCheckResult.Valid) {
            continue;
        }

        const diagnosticRange = new vscode.Range(document.positionAt(i), document.positionAt(numCheckResponse.endChar + 1))
        let errorMsg = "Uknown error - this shouldn't happen";
        switch (numCheckResponse.result) {
            case NumCheckResult.Empty:
                errorMsg = "Invalid injection call - brackets cannot be empty";
                break;
            case NumCheckResult.MissingEndChar:
                errorMsg = "Invalid injection call - no close bracket";
                break;
            case NumCheckResult.NonInteger:
                errorMsg = "Invalid injection call - brackets must contain a non-negative integer";
                break;
        }
        const diagnostic = new vscode.Diagnostic(diagnosticRange, errorMsg, vscode.DiagnosticSeverity.Error)
        diagnostics.push(diagnostic);
    }

    //

    i = j;
   }
   diagnosticCollection.set(document.uri, diagnostics);
   return diagnostics;
}

function NumCheck(document : vscode.TextDocument, startIndex : number, endChar : string) : { result : NumCheckResult, endChar : number} {
    const code = document.getText();
    if (code[startIndex] == endChar) {
        return {
            result: NumCheckResult.Empty,
            endChar: startIndex
        };
    }

    let charCode = code.charCodeAt(startIndex);
    let index = startIndex;
    while (charCode > 47 && charCode < 58) {
        index++;
        charCode = code.charCodeAt(index)
    } 

    if (code[index] != endChar) {
        const nextEndChar = code.indexOf(endChar, index + 1);
        if (nextEndChar > -1) {
            return {
                result: NumCheckResult.NonInteger,
                endChar: nextEndChar
            };
        }

        return {
            result: NumCheckResult.MissingEndChar,
            endChar: startIndex - 1
        }
    }

    return {
        result: NumCheckResult.Valid,
        endChar: index
    };

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
                    tokensBuilder.push(i, j, 1, 0);
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


enum NumCheckResult {NonInteger, Empty, MissingEndChar, Valid}

