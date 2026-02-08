/**
 * @typedef {Object} SeaBuildConfig
 * @property {string} bin The name of the binary to build
 * @property {string} [out] The path to output the binary to
 * @property {string} [seaConfig] The path to the SEA configuration JSON file
 * @property {boolean} [clean] Whether to clean the output directory before building
 */

/**
 * The build configuration for the SEA compiler
 * @type {SeaBuildConfig}
 */
const config = {
    bin: 'mindar-compile',
    out: '../dist/sea',
    clean: true,
    //seaConfig: 'sea-config.json',
}

module.exports = config;