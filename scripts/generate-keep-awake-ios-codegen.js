/**
 * Regenerate ReactNativeKCKeepAwakeSpec iOS headers from the package realpath.
 * Needed because pnpm symlinks cause RN codegen to skip NativeKCKeepAwake.ts.
 */
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const pkgJson = require.resolve('@sayem314/react-native-keep-awake/package.json', {
  paths: [root],
});
const pkgDir = fs.realpathSync(path.dirname(pkgJson));
const outDir = path.join(root, 'ios/build/generated/ios/ReactCodegen');
const tmpDir = path.join(root, 'node_modules/.cache/keep-awake-codegen');

fs.rmSync(tmpDir, {recursive: true, force: true});
fs.mkdirSync(tmpDir, {recursive: true});
fs.mkdirSync(outDir, {recursive: true});

const schemaPath = path.join(tmpDir, 'schema.json');
const combineCli = require.resolve(
  '@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
  {paths: [root]},
);
const generateCli = require.resolve(
  'react-native/scripts/generate-specs-cli.js',
  {paths: [root]},
);

function run(cmd, args) {
  const result = spawnSync(cmd, args, {stdio: 'inherit', cwd: root});
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run(process.execPath, [combineCli, '--platform', 'ios', schemaPath, pkgDir]);
run(process.execPath, [
  generateCli,
  '--platform',
  'ios',
  '--schemaPath',
  schemaPath,
  '--outputDir',
  path.join(tmpDir, 'ios'),
  '--libraryName',
  'ReactNativeKCKeepAwakeSpec',
  '--libraryType',
  'modules',
]);

const generated = path.join(tmpDir, 'ios');
const specDir = path.join(outDir, 'ReactNativeKCKeepAwakeSpec');
fs.mkdirSync(specDir, {recursive: true});
fs.copyFileSync(
  path.join(generated, 'ReactNativeKCKeepAwakeSpec/ReactNativeKCKeepAwakeSpec.h'),
  path.join(specDir, 'ReactNativeKCKeepAwakeSpec.h'),
);
fs.copyFileSync(
  path.join(
    generated,
    'ReactNativeKCKeepAwakeSpec/ReactNativeKCKeepAwakeSpec-generated.mm',
  ),
  path.join(specDir, 'ReactNativeKCKeepAwakeSpec-generated.mm'),
);
fs.copyFileSync(
  path.join(generated, 'ReactNativeKCKeepAwakeSpecJSI.h'),
  path.join(outDir, 'ReactNativeKCKeepAwakeSpecJSI.h'),
);

for (const kind of ['Public', 'Private']) {
  const headerRoot = path.join(root, `ios/Pods/Headers/${kind}/ReactCodegen`);
  const headerSpec = path.join(headerRoot, 'ReactNativeKCKeepAwakeSpec');
  fs.mkdirSync(headerSpec, {recursive: true});
  fs.copyFileSync(
    path.join(specDir, 'ReactNativeKCKeepAwakeSpec.h'),
    path.join(headerSpec, 'ReactNativeKCKeepAwakeSpec.h'),
  );
  fs.copyFileSync(
    path.join(outDir, 'ReactNativeKCKeepAwakeSpecJSI.h'),
    path.join(headerRoot, 'ReactNativeKCKeepAwakeSpecJSI.h'),
  );
}

console.log('Generated ReactNativeKCKeepAwakeSpec from', pkgDir);
