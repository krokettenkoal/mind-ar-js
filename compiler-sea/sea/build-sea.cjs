const {copyFile, readFile, mkdir, rm} = require("node:fs/promises");
const {dirname} = require("node:path");
const {inject} = require('postject');
const {execAsync, sign, resolveConfig} = require('./sea-utils.cjs');
const buildConfig = resolveConfig(require('./build-sea.config.cjs'));

/**
 * Generate the Node SEA blob from the configuration file
 * @param {string} seaConfig The configuration file to use
 * @return {Promise<Buffer>} A promise that resolves with the generated blob when it is generated
 */
async function generateBlob(seaConfig) {
    await execAsync(`node --experimental-sea-config ${seaConfig}`);
    return await readFile(seaConfig);
}

/**
 * Inject the sea blob into the binary
 * @param {string} binaryFile The path to the binary file to inject the blob into
 * @param {Buffer} blob The blob to inject
 * @param {boolean} [overwrite=false] Whether to overwrite the existing blob (if present)
 * @return {Promise<void>} A promise that resolves when the blob is injected
 */
async function injectBlob(binaryFile, blob, overwrite = false) {
    const opts = {
        overwrite,
        sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'
    };
    if (process.platform === 'darwin') {
        opts.machoSegmentName = 'NODE_SEA';
    }
    return await inject(binaryFile, 'NODE_SEA_BLOB', blob, opts);
}

/**
 * Clean the output directory
 * @param outPath The path to the output directory
 * @return {Promise<void>} A promise that resolves when the output directory is cleaned
 */
async function cleanOutputDirectory(outPath) {
    try {
        await rm(outPath, {recursive: true});
    } catch {
        //  Ignore errors when cleaning the output directory
    }
}

/**
 * Copy the current node executable to the current directory
 * @param {string} destPath The path to copy the executable to (including the file name)
 * @return {Promise<void>} A promise that resolves when the copy is complete
 */
async function copyNodeExecutable(destPath) {
    const dirPath = dirname(destPath);
    await mkdir(dirPath, {recursive: true});
    return await copyFile(process.execPath, destPath);
}

/**
 * Build the compiler executable
 * @param {SeaBuildConfig} cfg The build configuration to use
 * @return {Promise<void>} A promise that resolves when the build is complete
 */
async function build(cfg) {
    console.group(`Building Node SEA '${cfg.bin}'`);

    console.log('Generating SEA blob...');
    const blob = await generateBlob(cfg.seaConfig);

    if (cfg.clean) {
        console.log('Cleaning output directory...');
        await cleanOutputDirectory(cfg.out);
    }

    console.log('Copying node executable...');
    await copyNodeExecutable(cfg.bin);

    //  Removing the signature is not mandatory, so it is allowed to fail without stopping the build
    try {
        console.log('Removing binary signature...');
        await sign(cfg.bin, {remove: true});
    } catch (e) {
        console.warn("Could not remove binary signature:", e);
    }

    console.log('Injecting SEA blob...');
    await injectBlob(cfg.bin, blob);

    try {
        console.log('Signing binary...');
        await sign(cfg.bin);
    } catch (e) {
        console.warn('Could not sign binary:', e);
    }

    console.groupEnd();
}


build(buildConfig)
    .then(() => console.log('Build complete.'))
    .catch(err => console.error('Build failed with error', err));