import * as vscode from 'vscode';
import * as vscodetextmate from 'vscode-textmate'
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {

   

    //UpdateMethodNames();
    
}

async function UpdateMethodNames() {
    if (!vscode.window.activeTextEditor) {
        return;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
    if (!workspaceFolder) {
        return;
    }

    const files = await vscode.workspace.findFiles('**/*.bfp')
    const filenames = files.map(file => path.basename(file.fsPath, ".bfp"))

    const decorations = vscode.DecorationOptions[] = [];
}




