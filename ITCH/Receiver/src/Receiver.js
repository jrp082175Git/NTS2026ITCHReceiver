import { ReceiverRuntime } from './services/receiverRuntime.js';

// The first two arguments are node executable and script name.
const args = process.argv.slice(2);

const runtime = new ReceiverRuntime();
runtime.start(args).catch(err => {
    console.error('Fatal application error:', err);
    process.exit(1);
});
