const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

/**
 * This function runs the get-pandoc script in order to download the requested
 * version of Pandoc. This way we can guarantee that the correct Pandoc version
 * will be present when packaging the application.
 *
 * @param   {string}  platform  The platform for which to download.
 * @param   {string}  arch      The architecture for which to download.
 */
async function downloadPandoc (platform, arch) {
  // Check we have a valid platform ...
  if (![ 'mac', 'linux', 'win' ].includes(platform)) {
    throw new Error(`Cannot download Pandoc: Platform ${platform} is not recognised!`)
  }

  // ... and a valid architecture.
  if (![ 'x64', 'arm64' ].includes(arch)) {
    throw new Error(`Cannot download Pandoc: Architecture ${arch} is not supported!`)
  }

  // Now run the script and wait for it to finish.
  await new Promise((resolve, reject) => {
    const argWin = [ 'bash.exe', [ path.join(__dirname, './get-pandoc.sh'), platform, arch ] ]
    const argUnix = [ path.join(__dirname, './get-pandoc.sh'), [ platform, arch ] ]
    // Use the spread operator to spawn the process using the correct arguments.
    const shellProcess = (process.platform === 'win') ? spawn(...argWin) : spawn(...argUnix)

    // Resolve or reject once the process has finished.
    shellProcess.on('close', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`Failed to download Pandoc: Process quit with code ${code}.`))
      } else {
        resolve()
      }
    })

    // Reject on errors.
    shellProcess.on('error', (err) => {
      reject(err)
    })
  })
}

exports.default = async function embedPandoc (context) {
  const { platform: { name: platform }, arch } = context;

  // Second, we need to make sure we can bundle Pandoc.
  const isMacOS = platform === 'mac'
  const isLinux = platform === 'linux'
  const isWin = platform === 'win'
  const isArm64 = arch === 'arm64'
  const is64Bit = arch === 'x64'

  // macOS has Rosetta 2 built-in, so we can bundle Pandoc 64bit
  const supportsPandoc = is64Bit || (isMacOS && isArm64) || (isLinux && isArm64)


  if (supportsPandoc && isWin) {
    // Download Pandoc beforehand, if it's not yet there.
    try {
      await fs.lstat(path.join(__dirname, './pandoc-win-x64.exe'))
    } catch (err) {
      await downloadPandoc('win', 'x64')
    }

    await fs.mkdir(path.join(__dirname, '..', '..', `./resources/win/`), { recursive: true })
    await fs.copyFile(path.join(__dirname, './pandoc-win-x64.exe'), path.join(__dirname, '..', '..', `./resources/win/pandoc.exe`))
  } else if (supportsPandoc && (isMacOS || isLinux)) {
    const pandocArch = (isLinux && isArm64) ? 'arm64' : 'x64'
    try {
      await fs.lstat(path.join(__dirname, `./pandoc-${pandocPlatform}-${pandocArch}`))
    } catch (err) {
      await downloadPandoc(platform, pandocArch)
    }

    await fs.mkdir(path.join(__dirname, '..', '..', `./resources/${platform}/`), { recursive: true })
    await fs.copyFile(path.join(__dirname, `./pandoc-${platform}-${pandocArch}`), path.join(__dirname, '..', '..', `./resources/${platform}/pandoc`))
  } else {
    // If someone is building this on an unsupported platform, drop a warning.
    console.log(`\nBuilding for an unsupported platform/arch-combination ${platform}/${arch} - not bundling Pandoc.`)
  }
}
