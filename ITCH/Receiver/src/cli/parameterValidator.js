export function validateParameters(args) {
  if (args.length !== 5) {
    printUsageAndExit();
  }

  const [envRaw, startModeRaw, versionRaw, displayModeRaw, initialsRaw] = args;

  const env = envRaw.toUpperCase();
  if (env !== 'PROD' && env !== 'DR') {
    console.error('Error: Environment must be PROD or DR');
    printUsageAndExit();
  }

  const startMode = startModeRaw.toUpperCase();
  if (startMode !== 'START:Y' && startMode !== 'START:N') {
    console.error('Error: Start mode must be START:Y or START:N');
    printUsageAndExit();
  }

  const version = versionRaw.toUpperCase();
  if (version !== 'V2026' && version !== 'V2015') {
    console.error('Error: Version must be V2026 or V2015');
    printUsageAndExit();
  }

  const displayMode = displayModeRaw.toUpperCase();
  if (displayMode !== 'DISPLAY:ON' && displayMode !== 'DISPLAY:OFF') {
    console.error('Error: Display mode must be DISPLAY:ON or DISPLAY:OFF');
    printUsageAndExit();
  }

  const userInitials = initialsRaw.split(',').map(i => i.trim()).filter(i => i);
  if (userInitials.length === 0) {
    console.error('Error: At least one user initial must be provided');
    printUsageAndExit();
  }

  return {
    environment: env,
    startMode: startMode,
    version: version,
    displayMode: displayMode,
    userInitials: userInitials,
    isStartModeY: startMode === 'START:Y',
    isDisplayOn: displayMode === 'DISPLAY:ON'
  };
}

function printUsageAndExit() {
  console.log(`
Usage: node src/Receiver.js <ENV> <START_MODE> <VERSION> <DISPLAY_MODE> <INITIALS>

Parameters:
  <ENV>          : PROD or DR
  <START_MODE>   : START:Y or START:N
  <VERSION>      : V2026 or V2015
  <DISPLAY_MODE> : DISPLAY:ON or DISPLAY:OFF
  <INITIALS>     : User initials (e.g., JP or JP,AB)

Example:
  node src/Receiver.js PROD START:Y V2026 DISPLAY:ON JP
`);
  process.exit(1);
}
