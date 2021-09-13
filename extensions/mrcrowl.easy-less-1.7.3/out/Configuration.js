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
exports.getRootFileInfo = exports.getGlobalOptions = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function getGlobalOptions(document) {
    const lessFilenamePath = path.parse(document.fileName);
    const defaultOptions = {
        plugins: [],
        rootFileInfo: getRootFileInfo(lessFilenamePath),
        relativeUrls: false,
    };
    const configuredOptions = vscode.workspace
        .getConfiguration("less", document.uri)
        .get("compile");
    return Object.assign(Object.assign({}, defaultOptions), configuredOptions);
}
exports.getGlobalOptions = getGlobalOptions;
function getRootFileInfo(parsedPath) {
    parsedPath.ext = ".less";
    parsedPath.base = parsedPath.name + ".less";
    return {
        filename: parsedPath.base,
        currentDirectory: parsedPath.dir,
        relativeUrls: false,
        entryPath: parsedPath.dir + "/",
        rootpath: null,
        rootFilename: null,
        reference: undefined,
    };
}
exports.getRootFileInfo = getRootFileInfo;
//# sourceMappingURL=Configuration.js.map