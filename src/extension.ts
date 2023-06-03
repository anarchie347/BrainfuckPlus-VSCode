import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {

   

    UpdateMethodNames();
    
}

async function UpdateMethodNames() {
    const files = await vscode.workspace.findFiles('**/*.bfp');
    let methodNames: string = "";
    for (let i = 0; i < files.length; i++) {
        const workspaceFolders = vscode.workspace.workspaceFolders
        //if in the same directory, rather than a nested one
        if (workspaceFolders) {
            if (path.dirname(files[i].fsPath) == workspaceFolders[0].uri.fsPath) {
                console.log(path.basename(files[i].fsPath))
                methodNames += path.basename(files[i].fsPath)[0];
            }
        }
    }
    console.log("ok");
    console.log(methodNames);
}




