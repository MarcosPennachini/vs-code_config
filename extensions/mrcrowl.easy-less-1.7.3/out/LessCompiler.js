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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const fs = __importStar(require("fs"));
const less_1 = __importDefault(require("less"));
const mkpath_1 = __importDefault(require("mkpath"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const Configuration = __importStar(require("./Configuration"));
const FileOptionsParser = __importStar(require("./FileOptionsParser"));
const LessDocumentResolverPlugin_1 = require("./LessDocumentResolverPlugin");
const DEFAULT_EXT = ".css";
// compile the given less file
async function compile(lessFile, content, defaults) {
    const options = FileOptionsParser.parse(content, defaults);
    const lessPath = path.dirname(lessFile);
    // main is set: compile the referenced file instead
    if (options.main) {
        const mainFilePaths = resolveMainFilePaths(options.main, lessPath, lessFile);
        if (mainFilePaths && mainFilePaths.length > 0) {
            for (const filePath of mainFilePaths) {
                const mainPath = path.parse(filePath);
                const mainRootFileInfo = Configuration.getRootFileInfo(mainPath);
                const mainDefaults = Object.assign(Object.assign({}, defaults), { rootFileInfo: mainRootFileInfo });
                const mainContent = await readFilePromise(filePath, "utf-8");
                await compile(filePath, mainContent, mainDefaults);
            }
            return;
        }
    }
    // out
    if (options.out === null || options.out === false) {
        // is null or false: do not compile
        return;
    }
    const out = options.out;
    const extension = chooseExtension(options);
    const baseFilename = path.parse(lessFile).name;
    let cssRelativeFilename;
    if (typeof out === "string") {
        // out is set: output to the given file name
        // check whether is a folder first
        const interpolatedOut = intepolatePath(out.replace('$1', baseFilename).replace('$2', extension), lessFile);
        cssRelativeFilename = interpolatedOut;
        const lastCharacter = cssRelativeFilename.slice(-1);
        if (lastCharacter === "/" || lastCharacter === "\\") {
            cssRelativeFilename += baseFilename + extension;
        }
        else if (path.extname(cssRelativeFilename) === "") {
            cssRelativeFilename += extension;
        }
    }
    else {
        // out is not set: output to the same basename as the less file
        cssRelativeFilename = baseFilename + extension;
    }
    const cssFile = path.resolve(lessPath, cssRelativeFilename);
    delete options.out;
    // sourceMap
    let sourceMapFile;
    if (options.sourceMap) {
        // currently just has support for writing .map file to same directory
        const lessPath = path.parse(lessFile).dir;
        const cssPath = path.parse(cssFile).dir;
        const lessRelativeToCss = path.relative(cssPath, lessPath);
        const sourceMapOptions = {
            outputSourceFiles: false,
            sourceMapBasepath: lessPath,
            sourceMapFileInline: options.sourceMapFileInline,
            sourceMapRootpath: lessRelativeToCss,
        };
        if (!sourceMapOptions.sourceMapFileInline) {
            sourceMapFile = cssFile + ".map";
            const sourceMapFilename = path.parse(sourceMapFile).base;
            sourceMapOptions.sourceMapURL = "./" + sourceMapFilename; // baseFilename + extension + ".map";
        }
        options.sourceMap = sourceMapOptions;
    }
    // plugins
    options.plugins = [];
    if (options.autoprefixer) {
        const LessPluginAutoPrefix = require("less-plugin-autoprefix");
        const browsers = cleanBrowsersList(options.autoprefixer);
        const autoprefixPlugin = new LessPluginAutoPrefix({ browsers });
        options.plugins.push(autoprefixPlugin);
    }
    options.plugins.push(new LessDocumentResolverPlugin_1.LessDocumentResolverPlugin());
    // set up the parser
    const output = await less_1.default.render(content, options);
    await writeFileContents(cssFile, output.css);
    if (output.map && sourceMapFile) {
        await writeFileContents(sourceMapFile, output.map);
    }
}
exports.compile = compile;
function cleanBrowsersList(autoprefixOption) {
    const browsers = Array.isArray(autoprefixOption)
        ? autoprefixOption
        : ("" + autoprefixOption).split(/,|;/);
    return browsers.map((browser) => browser.trim());
}
function intepolatePath(path, lessFilePath) {
    if (path.includes("${workspaceFolder}")) {
        const lessFileUri = vscode_1.Uri.file(lessFilePath);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(lessFileUri);
        if (workspaceFolder) {
            path = path.replace(/\$\{workspaceFolder\}/g, workspaceFolder.uri.fsPath);
        }
    }
    if (path.includes("${workspaceRoot}")) {
        if (vscode.workspace.rootPath) {
            path = path.replace(/\$\{workspaceRoot\}/g, vscode.workspace.rootPath);
        }
    }
    return path;
}
function resolveMainFilePaths(main, lessPath, currentLessFile) {
    let mainFiles;
    if (typeof main === "string") {
        mainFiles = [main];
    }
    else if (Array.isArray(main)) {
        mainFiles = main;
    }
    else {
        mainFiles = [];
    }
    const interpolatedMainFilePaths = mainFiles.map((mainFile) => intepolatePath(mainFile, lessPath));
    const resolvedMainFilePaths = interpolatedMainFilePaths.map((mainFile) => path.resolve(lessPath, mainFile));
    if (resolvedMainFilePaths.indexOf(currentLessFile) >= 0) {
        return []; // avoid infinite loops
    }
    return resolvedMainFilePaths;
}
// writes a file's contents in a path where directories may or may not yet exist
function writeFileContents(filepath, content) {
    return new Promise((resolve, reject) => {
        mkpath_1.default(path.dirname(filepath), (err) => {
            if (err) {
                return reject(err);
            }
            fs.writeFile(filepath, content.toString(), (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(void 0);
                }
            });
        });
    });
}
function readFilePromise(filename, encoding) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, encoding, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
function chooseExtension(options) {
    if (options && options.outExt) {
        if (options.outExt === "") {
            // special case for no extension (no idea if anyone would really want this?)
            return "";
        }
        return ensureDotPrefixed(options.outExt) || DEFAULT_EXT;
    }
    return DEFAULT_EXT;
}
function ensureDotPrefixed(extension) {
    if (extension.startsWith(".")) {
        return extension;
    }
    return extension ? `.${extension}` : "";
}
//# sourceMappingURL=LessCompiler.js.map