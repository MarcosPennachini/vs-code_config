"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const Configuration = __importStar(require("./Configuration"));
const LessCompiler = __importStar(require("./LessCompiler"));
const StatusBarMessage = __importStar(require("./StatusBarMessage"));
const RANGE_EOL = 4096;
class CompileLessCommand {
    constructor(document, lessDiagnosticCollection) {
        this.document = document;
        this.lessDiagnosticCollection = lessDiagnosticCollection;
    }
    async execute() {
        StatusBarMessage.hideError();
        const globalOptions = Configuration.getGlobalOptions(this.document);
        const compilingMessage = StatusBarMessage.show("$(zap) Compiling less --> css", 1 /* INDEFINITE */);
        const startTime = Date.now();
        try {
            await LessCompiler.compile(this.document.fileName, this.document.getText(), globalOptions);
            const elapsedTime = Date.now() - startTime;
            compilingMessage.dispose();
            this.lessDiagnosticCollection.set(this.document.uri, []);
            StatusBarMessage.show(`$(check) Less compiled in ${elapsedTime}ms`, 0 /* SUCCESS */);
        }
        catch (error) {
            compilingMessage.dispose();
            let { message, range } = this.getErrorMessageAndRange(error);
            let affectedUri = this.getErrorAffectedUri(error);
            if (affectedUri === undefined || range === undefined) {
                affectedUri = this.document.uri;
                range = new vscode.Range(0, 0, 0, 0);
            }
            const diagnosis = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
            this.lessDiagnosticCollection.set(affectedUri, [diagnosis]);
            StatusBarMessage.show("$(alert) Error compiling less (more detail in Problems)", 2 /* ERROR */);
        }
    }
    getErrorAffectedUri(error) {
        let affectedUri;
        if (error.filename) {
            affectedUri = vscode.Uri.file(error.filename);
            const isCurrentDocument = !error.filename.includes("/") &&
                !error.filename.includes("\\") &&
                error.filename === path.basename(this.document.fileName);
            if (isCurrentDocument) {
                affectedUri = this.document.uri;
            }
        }
        return affectedUri;
    }
    // hello world
    /*
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    */
    getErrorMessageAndRange(error) {
        if (error.code) {
            // fs errors
            const fileSystemError = error;
            switch (fileSystemError.code) {
                case "EACCES":
                case "ENOENT":
                    return {
                        message: `Cannot open file '${fileSystemError.path}'`,
                        range: new vscode.Range(0, 0, 0, RANGE_EOL),
                    };
            }
        }
        else if (error.line !== undefined && error.column !== undefined) {
            // less errors: try to highlight the affected range
            const lineIndex = error.line - 1;
            return {
                message: error.message,
                range: new vscode.Range(lineIndex, error.column, lineIndex, RANGE_EOL),
            };
        }
        return {
            message: error.message,
            range: new vscode.Range(0, 0, 0, RANGE_EOL),
        };
    }
}
exports.default = CompileLessCommand;
//# sourceMappingURL=CompileLessCommand.js.map