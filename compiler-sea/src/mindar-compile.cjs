const {OfflineCompiler} = require('../../src/image-target/offline-compiler.js');
const {writeFile} = require('fs/promises');
const {program} = require("commander");
const {loadImage} = require('canvas');

function commaSeparatedList(value, _) {
    return value.split(',');
}

program
    .name('mindar-compile')
    .description('MindAR image target compiler')
    .version('0.0.1')
    .requiredOption('-i, --images <items>', 'Target images to compile', commaSeparatedList)
    .requiredOption('-o, --output <filepath>', 'Path to output the compiled target data (`.mind` file)');

program.parse(process.argv);
const options = program.opts();


/**
 * Compile the image targets and write the output to a `.mind` file
 * @param {string[]} imagePaths The paths of the target images to compile
 * @param {string} outPath The path to write the compiled target data to
 * @return {Promise<void>} A promise that resolves when the compilation is complete
 */
async function bundle(imagePaths, outPath) {
    const images = await Promise.all(imagePaths.map(value => loadImage(value)));
    const compiler = new OfflineCompiler({prod: true});
    await compiler.compileImageTargets(images, console.log);
    const buffer = compiler.exportData();
    return await writeFile(outPath, buffer);
}

bundle(options.images, options.output)
    .then(() => process.exit(0))
    .catch(console.error);