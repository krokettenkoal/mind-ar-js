const {exec} = require('node:child_process');
const {resolve, join} = require('node:path');
const {sync: commandExistsSync} = require("command-exists");

/**
 * Execute a command asynchronously
 * @param cmd The command to execute
 * @return {Promise<string>} A promise that resolves with the command output, or rejects if an error occurs
 */
function execAsync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}

/**
 * Get the code signing tool for the specified platform
 * @param {NodeJS.Platform} platform The platform to get the signing tool
 * @return {null|string} The signing tool for the platform, or `null` if the platform is not supported
 */
function getSignTool(platform = process.platform) {
    switch (platform) {
        case 'darwin':
            return 'codesign';
        case 'win32':
            return 'signtool';
        default:
            return null;
    }
}

/**
 * Get the arguments for the code signing tool for the specified platform
 * @param {NodeJS.Platform} platform The platform to get the signing tool arguments for
 * @param {SignOptions} [opts] Signing options
 * @return {string[]}
 */
function getSignToolArgs(platform = process.platform, opts = {}) {
    switch (platform) {
        case 'darwin':
            return opts?.remove ? ['--remove-signature'] : ['--sign', '-'];
        case 'win32':
            return opts?.remove ? ['remove', '/s'] : ['sign', '/fd', 'SHA256'];
        default:
            return [];
    }
}

/**
 * @typedef {Object} SignOptions
 * @property {boolean} [remove] Whether to remove the signature from the file
 */

/**
 * Sign a file with the specified options
 * @param {string} file The file to sign
 * @param {SignOptions} [opts] The options to use for signing
 * @return {Promise<string>} A promise that resolves with the command output when the file is signed, or rejects if an error occurs
 */
function sign(file, opts = {}) {
    return new Promise(async (resolve, reject) => {
        const signTool = getSignTool();
        if (!signTool) {
            reject(`${process.platform} is not supported for code signing.`);
            return;
        }

        if (!commandExistsSync(signTool)) {
            reject(`'${signTool}' could not be found. Make sure it is installed and added to your system's PATH variable.`);
            return;
        }

        const args = getSignToolArgs(process.platform, opts);
        const cmd = `${signTool} ${args.join(' ')} ${file}`;
        execAsync(cmd).then(resolve).catch(reject);
    });
}

/**
 * Check if the platform is Windows
 * @param {NodeJS.Platform} platform The platform to check
 * @return {boolean} `true` if the platform is Windows, `false` otherwise
 */
function isWin(platform = process.platform) {
    return platform === 'win32';
}

/**
 * The default build configuration for the SEA compiler
 * @type {SeaBuildConfig}
 */
const DEFAULT_BUILD_CONFIG = {
    bin: 'node-sea',
    out: '.',
    seaConfig: 'sea-config.json',
};

/**
 * Resolve the build configuration for the SEA compiler
 * @param {SeaBuildConfig} cfg The configuration to resolve
 * @return {SeaBuildConfig} The resolved configuration
 */
function resolveConfig(cfg = {}) {
    const resolved = {...DEFAULT_BUILD_CONFIG, ...cfg};
    const binary = resolved.bin + (isWin() ? '.exe' : '');

    resolved.out = resolve(__dirname, resolved.out);
    resolved.bin = join(resolved.out, binary);
    resolved.seaConfig = resolve(__dirname, resolved.seaConfig);

    return resolved;
}

module.exports = {
    execAsync,
    sign,
    resolveConfig
}