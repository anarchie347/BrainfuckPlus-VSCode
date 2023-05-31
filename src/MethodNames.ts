import * as vscode from 'vscode';
import * as path from 'path';

export async function UpdateMethodNames() {
    const files = await vscode.workspace.findFiles('**/*.bfp')
    files.forEach(element => {
        console.log(path.basename(element.fsPath));
    });
}

