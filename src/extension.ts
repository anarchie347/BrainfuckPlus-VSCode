import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';

let methodNames : string = "abCD";

export async function activate(context: vscode.ExtensionContext) {
    console.log("ACTIVATED");
    UpdateMethodNames();

    const changeWSFolder = vscode.workspace.onDidChangeWorkspaceFolders(UpdateMethodNames);
    const createFile = vscode.workspace.onDidCreateFiles(UpdateMethodNames);
    const deleteFile = vscode.workspace.onDidDeleteFiles(UpdateMethodNames);
    const renameFile = vscode.workspace.onDidRenameFiles(UpdateMethodNames);
    context.subscriptions.push(changeWSFolder);
    context.subscriptions.push(createFile);
    context.subscriptions.push(deleteFile);
    context.subscriptions.push(renameFile);
    
    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
        {
            language: "bfp",
            scheme: "file"
        },
        new MySemanticTokensProvider(),
        new vscode.SemanticTokensLegend(["comment", "method"], [])
    );
    console.log("semantic highlighting worked out");
    /*
    getProvider().then(
        (provider) => {
            context.subscriptions.push(provider);
        }
    );
*/
    console.log("PROVIDER PUSHED")    
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

function getProvider() {
    return new Promise<vscode.Disposable>(
        (resolve, reject) => {
            const provider = vscode.languages.registerDocumentSemanticTokensProvider(
                {
                    language: "bfp",
                    scheme: "file"
                },
                new MySemanticTokensProvider(),
                new vscode.SemanticTokensLegend(["comment", "method"], [])
            );
            console.log("semantic highlighting worked out");
            
            resolve(provider);
        }
    );
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
                    tokensBuilder.push(i,j,1,1)
                }
                
            }
        }
        
        return tokensBuilder.build();
    }

    async oldprovideDocumentSemanticTokens(document: vscode.TextDocument) : Promise<vscode.SemanticTokens | null> {
        const tokensBuilder = new vscode.SemanticTokensBuilder();
        console.log("PDST BEGAN");
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            for (let j = 0; j < line.length; j++) {
                const tokenType = await this.doesMethodExist(line[j]) ? 1 : 0;
                if (tokenType == 1) {
                    
                }
                
            }
            tokensBuilder.push(i,0,1,1)
            console.log(document.lineAt(i).text[0]);
        }
        return tokensBuilder.build();
    }

     async doesMethodExist(firstChar: string) : Promise<boolean> {
        const files = await vscode.workspace.findFiles('**/*.bfp');
        for (let i = 0; i < files.length; i++) {
            const workspaceFolders = vscode.workspace.workspaceFolders
            //if in the same directory, rather than a nested one
            if (workspaceFolders) {
                if (path.dirname(files[i].fsPath) == workspaceFolders[0].uri.fsPath) {
                    return (firstChar == path.basename(files[i].fsPath)[0]);
                }
            }
        }
        return false;
    }
}


