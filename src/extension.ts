import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {
    UpdateMethodNames();
    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
        {
            language: "bfp",
            scheme: "source"
        },
        new MySemanticTokensProvider(),
        new vscode.SemanticTokensLegend(["comment", "method"], [])
    );
    console.log("PROVIDER CREATED");
    context.subscriptions.push(provider);

    console.log("PROVIDER PUSHED")    
}

async function UpdateMethodNames() {
    const files = await vscode.workspace.findFiles('**/*.bfp');
    let methodNames: string = "";
    for (let i = 0; i < files.length; i++) {
        const workspaceFolders = vscode.workspace.workspaceFolders
        //if in the same directory, rather than a nested one
        if (workspaceFolders) {
            if (path.dirname(files[i].fsPath) == workspaceFolders[0].uri.fsPath) {
                methodNames += path.basename(files[i].fsPath)[0];
            }
        }
    }
    console.log("METHODNAMES UPDATED");
}


class MySemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
        console.log("pdst began");
        vscode.window.showInformationMessage("pdst");
        const tokensBuilder = new vscode.SemanticTokensBuilder();
        
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            for (let j = 0; j < line.length; j++) {
                const tokenType = 1;
                if (tokenType == 1) {
                    
                }
                
            }
        }
        tokensBuilder.push(0,0,1, 1)
        return tokensBuilder.build();
    }

    async oldprovideDocumentSemanticTokens(document: vscode.TextDocument) : Promise<vscode.SemanticTokens | null> {
        const tokensBuilder = new vscode.SemanticTokensBuilder();
        console.log("old pdst began");
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            for (let j = 0; j < line.length; j++) {
                const tokenType = await this.doesMethodExist(line[j]) ? 1 : 0;
                if (tokenType == 1) {
                    
                }
                tokensBuilder.push(i,j,1, tokenType)
            }
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


