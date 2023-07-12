import * as vscode from 'vscode';
import * as path from 'path';

//let methodNames : string = "";
//let methods : {[folder : string] : {character : string, parameterDetails : string[], requiredCells : number[], description : string }[]} = {};
let methods : Record<string, MethodInfo[]>

export async function activate(context: vscode.ExtensionContext) {
    console.log("BFP extension activated");
    UpdateMethodNames();

    //for method name updates
    const changeWSFolder = vscode.workspace.onDidChangeWorkspaceFolders(UpdateMethodNames);
    const createFile = vscode.workspace.onDidCreateFiles(UpdateMethodNames);
    const deleteFile = vscode.workspace.onDidDeleteFiles(UpdateMethodNames);
    const renameFile = vscode.workspace.onDidRenameFiles(UpdateMethodNames);
    context.subscriptions.push(changeWSFolder);
    context.subscriptions.push(createFile);
    context.subscriptions.push(deleteFile);
    context.subscriptions.push(renameFile);

    //for method hiighlighting
    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
        {
            language: "bfp",
            scheme: "file"
        },
        new MySemanticTokensProvider(),
        new vscode.SemanticTokensLegend(["entity.name.function"])
    );
    context.subscriptions.push(provider);

    //for errors
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("BFPDiagnostics");
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

    //update method names, then re-validate the text document once it is complete
    UpdateMethodNames().finally(() => {
        if (vscode.window.activeTextEditor) {
            validateTextDocument(vscode.window.activeTextEditor.document, diagnosticCollection);
        }
    });
}

async function UpdateMethodNames() {
    const files = await vscode.workspace.findFiles('**/*.bfp');
    //vscode.workspace.findFiles('**/*.bfp').then(res => UpdateMethodNamesAfterFoundFiles(res))
    methods = {};
    for (const file of files) {
        
        const filePath = file.fsPath;
        console.log(path.dirname(filePath), path.basename(filePath)[0]);
        if (!methods[path.dirname(filePath)]) {
            methods[path.dirname(filePath)] = [];
        }
        methods[path.dirname(filePath)].push({
            character: path.basename(filePath)[0],
            parameters: getParameterDetails(filePath),
            requiredCells: getRequiredCells(filePath),
            description: getDescription(filePath),
        });
        
    }
    console.log("\n\n\n");
}
function UpdateMethodNamesAfterFoundFiles(files : vscode.Uri[]) {
    
}
function getParameterDetails(path : string) : string[] {
    return [];
}
function getRequiredCells(path : string) : number[] {
    return [];
}
function getDescription(path : string) : string {
    return "";
}

function CheckIfMethod(char : string, fileAddress : string) {
    const methodInfos = methods[path.dirname(fileAddress)];
    for (const methodInfo of methodInfos) {
        if (methodInfo.character == char) {
            console.log("ITS TRUE");
            return true;
        }
    }
    return false;
}

function validateTextDocument(document : vscode.TextDocument, diagnosticCollection : vscode.DiagnosticCollection) {
    const diagnostics : vscode.Diagnostic[] = [];
    let code : string = document.getText();
    let j : number; //can be used to look around the nearby code while still storing the index the check began at

    let CurlybracketOpenIndexes : number[] = [];
    let CurlybracketCloseIndexes : number[] = [];
    let SquarebracketOpenIndexes : number[] = [];
    let SquarebracketCloseIndexes : number[] = [];

    //main loop for each char
    for (let i = 0; i < code.length; i++) {
        j = i;
        //comment
       if (code[i] == "/") {
            const nextlinePos = new vscode.Position(document.positionAt(i).line + 1,0)
            i = document.offsetAt(nextlinePos) - 1;
            continue;
        }
        //injection call  
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

        //shorthand repetition
        if (code[i] == "*") {
            const reg = /[0-9]/
            if (!/[0-9]/.test(code[i + 1])) {
                const diagnosticRange = new vscode.Range(document.positionAt(i), document.positionAt(i + 1))
                const diagnostic = new vscode.Diagnostic(diagnosticRange, "Invalid shorthand repetition - no number", vscode.DiagnosticSeverity.Error)
                diagnostics.push(diagnostic);
                continue;
            }
            let charCode;
            do {
                j++;
                charCode = code.charCodeAt(j);
            } while (charCode > 47 && charCode < 58)
            if (!code[j]) {
                const diagnosticRange = new vscode.Range(document.positionAt(i), document.positionAt(j))
                const diagnostic = new vscode.Diagnostic(diagnosticRange, "Invalid Shorthand repetition - no instruction", vscode.DiagnosticSeverity.Error)
                diagnostics.push(diagnostic);
                continue;
            }
            if (!isCodeChar(code[j], { debug: true, methods: true, bfp: false}, "(", document.uri.fsPath)) {
                const diagnosticRange = new vscode.Range(document.positionAt(j), document.positionAt(j + 1))
                const diagnostic = new vscode.Diagnostic(diagnosticRange, "Invalid Shorthand repetition - invalid instruction", vscode.DiagnosticSeverity.Error)
                diagnostics.push(diagnostic);
                continue;
            }
            //go back one character if successful so that the instruction char is analysed on next loop
            j--;
        }

        //bracket check
        switch (code[i]) {
            case "{":
                CurlybracketOpenIndexes.push(i);
                break;
            case "}":
                CurlybracketCloseIndexes.push(i);
                break;
            case "[":
                SquarebracketOpenIndexes.push(i);
                break;
            case "]":
                SquarebracketCloseIndexes.push(i);
                break;
        }

    i = j;
    }


   //curly bracket check
    if (CurlybracketOpenIndexes.length > CurlybracketCloseIndexes.length) {
        for (let i = 0; i < CurlybracketOpenIndexes.length - CurlybracketCloseIndexes.length; i++) {
            const diagnosticRange = new vscode.Range(document.positionAt(CurlybracketOpenIndexes[i]), document.positionAt(CurlybracketOpenIndexes[i] + 1))
            const diagnostic = new vscode.Diagnostic(diagnosticRange, "No corresponding } found", vscode.DiagnosticSeverity.Error)
            diagnostics.push(diagnostic);
        }
    } else if (CurlybracketOpenIndexes.length < CurlybracketCloseIndexes.length) {
        for (let i = CurlybracketOpenIndexes.length; i < CurlybracketCloseIndexes.length; i++) {
            const diagnosticRange = new vscode.Range(document.positionAt(CurlybracketCloseIndexes[i]), document.positionAt(CurlybracketCloseIndexes[i] + 1))
            const diagnostic = new vscode.Diagnostic(diagnosticRange, "No corresponding { found", vscode.DiagnosticSeverity.Error)
            diagnostics.push(diagnostic);
        }
    }

    //square bracket check
    if (SquarebracketOpenIndexes.length > SquarebracketCloseIndexes.length) {
        for (let i = 0; i < SquarebracketOpenIndexes.length - SquarebracketCloseIndexes.length; i++) {
            const diagnosticRange = new vscode.Range(document.positionAt(SquarebracketOpenIndexes[i]), document.positionAt(SquarebracketOpenIndexes[i] + 1))
            const diagnostic = new vscode.Diagnostic(diagnosticRange, "No corresponding } found", vscode.DiagnosticSeverity.Error)
            diagnostics.push(diagnostic);
        }
    } else if (SquarebracketOpenIndexes.length < SquarebracketCloseIndexes.length) {
        for (let i = SquarebracketOpenIndexes.length; i < SquarebracketCloseIndexes.length; i++) {
            const diagnosticRange = new vscode.Range(document.positionAt(SquarebracketCloseIndexes[i]), document.positionAt(SquarebracketCloseIndexes[i] + 1))
            const diagnostic = new vscode.Diagnostic(diagnosticRange, "No corresponding { found", vscode.DiagnosticSeverity.Error)
            diagnostics.push(diagnostic);
        }
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

function isCodeChar(char : string, extraChars : {debug : boolean, methods : boolean, bfp : boolean}, miscExtraChars : string, fileAddress : string) : boolean {
    let codeChars : string = "+-,.<>[]";
    if (extraChars.debug) {
        codeChars += "\\:?\"|"
    }
    if (extraChars.bfp) {
        codeChars += "{}()*";
    }
    codeChars += miscExtraChars;
    return codeChars.indexOf(char) > -1 || (extraChars.methods && CheckIfMethod(char, fileAddress))
}

class MySemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens> {
        const tokensBuilder = new vscode.SemanticTokensBuilder();
        const text = document.getText();
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;          
            for (let j = 0; j < line.length; j++) {
                if (line[j] == "/") {
                    break;
                } else if (CheckIfMethod(line[j], document.uri.fsPath)) {
                    tokensBuilder.push(i, j, 1, 0);
                }
                
            }
        }
        
        return tokensBuilder.build();
    }
}

class MethodInfo {
    character : string = "";
    requiredCells : number[] = [];
    parameters : string[] = [];
    description : string = "";
}

enum NumCheckResult {NonInteger, Empty, MissingEndChar, Valid}