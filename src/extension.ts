import * as vscode from 'vscode';

import { UpdateMethodNames } from './MethodNames';

export async function activate(context: vscode.ExtensionContext) {
    UpdateMethodNames();
    
}