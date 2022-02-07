// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands, workspace, Uri } from 'vscode';

const exportRegex = /export { default } from '.+';?/; // matches export { default } from './my-file.js'
const filenameRegex = /\'.+\'/; // matches the filename substring

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate() {
  async function openDefaultFile(doc: vscode.TextDocument) {
		let newFileName = '';
		// loop of lines in file and find the line with the export
		for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
			const lineOfText = doc.lineAt(lineIndex);
			if (lineOfText.text.match(exportRegex)) {
				const filename = lineOfText.text.match(filenameRegex);
				newFileName = filename ? filename[0].replace('./', '').replace(/'/g, '') : '';
			}
		}

		// don't do anything if no filename
		if (!newFileName) { return; };

		// find the path of the file with the export and remove the filename
		const currentFilePath = doc.fileName?.split('/');
		currentFilePath.pop(); // remove last element of current = filename

		// create the base url
		const base = Uri.parse(currentFilePath.join('/'));
		// find all the files in this folder
		const dirStats = await workspace.fs.readDirectory(base);
		// find the file in the directory, that has the filename we already found
		const filename = dirStats.find(([file]) => file.includes(newFileName));

		// create the uri for the file we want to open
		let uri = filename && Uri.joinPath(base, `${filename[0]}`);
		let success = await commands.executeCommand('vscode.open', uri); // open the file
  }

  vscode.workspace.onDidOpenTextDocument((doc) => {
    if (doc && ["javascript", "typescript"].includes(doc.languageId)) {
      openDefaultFile(doc);
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
