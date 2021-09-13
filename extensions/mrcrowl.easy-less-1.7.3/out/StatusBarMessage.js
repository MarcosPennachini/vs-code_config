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
exports.show = exports.hideError = void 0;
const vscode = __importStar(require("vscode"));
const ERROR_COLOR_CSS = "rgba(255,125,0,1)";
const ERROR_DURATION_MS = 10000;
const SUCCESS_DURATION_MS = 1500;
let errorMessage;
function hideError() {
    if (errorMessage) {
        errorMessage.hide();
        errorMessage = null;
    }
}
exports.hideError = hideError;
function show(message, type) {
    hideError();
    switch (type) {
        case 0 /* SUCCESS */:
            return vscode.window.setStatusBarMessage(message, SUCCESS_DURATION_MS);
        case 1 /* INDEFINITE */:
            return vscode.window.setStatusBarMessage(message);
        case 2 /* ERROR */:
            errorMessage = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
            errorMessage.text = message;
            errorMessage.command = "workbench.action.showErrorsWarnings";
            errorMessage.color = ERROR_COLOR_CSS;
            errorMessage.show();
            setTimeout(hideError, ERROR_DURATION_MS);
            return errorMessage;
    }
}
exports.show = show;
//# sourceMappingURL=StatusBarMessage.js.map