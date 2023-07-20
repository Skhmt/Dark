// --allow-read --allow-write change_exe_subsystem.ts pathToBinary:string
// from: https://github.com/denoland/deno/discussions/11638#discussioncomment-1225046

const PATH_TO_BINARY = Deno.args[0];

async function readN(r: Deno.Reader, n: number): Promise<Uint8Array | null> {
    const buf = new Uint8Array(n);
    let nRead = 0;
    // a null value of r.read() will nullish coalesce into NaN and
    // polute nRead, causing (nRead < n) to be false and the loop to exit
    while (nRead < n) {
      nRead += await r.read(buf.subarray(nRead)) ?? NaN;
    }
    return isNaN(nRead) ? null : buf;
}
  
async function writeAll(w: Deno.Writer, buf: ArrayBufferView): Promise<void> {
    const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    let nWritten = 0;
    while (nWritten < bytes.byteLength) {
        nWritten += await w.write(bytes.subarray(nWritten));
    }
}
  
function view(buf: ArrayBufferView) {
    return new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
}

const bin = await Deno.open(PATH_TO_BINARY, { read: true, write: true });

// we're going to validate (loosely) that its a valid EXE/MZ
// reset to index 0, just to be sure
await bin.seek(0, Deno.SeekMode.Start);
const magicBytes = await readN(bin, 2);
if (magicBytes == null) {
    console.log("Encountered EOF at magicBytes");
    Deno.exit(1);
}
const binMagic = new TextDecoder().decode(magicBytes);
  
if ("MZ" != binMagic) {
    console.log(`☹ we didnt find a valid exe at ${PATH_TO_BINARY}`);
    Deno.exit(1);
}
  
// we now know we have a valid exe file
// next we need to get the offset of the 'PE Header'
const PE_ADDRESS_OFFSET = 0x3C;
await bin.seek(PE_ADDRESS_OFFSET, Deno.SeekMode.Start);
// read the peHeaderPointer as 32bit little-endian int/dword/u32
const peHeaderPointerBytes = await readN(bin, 4);
if (peHeaderPointerBytes == null) {
console.log("Encountered EOF at peHeaderPointerBytes");
Deno.exit(1);
}
const peHeaderPointer = view(peHeaderPointerBytes).getUint32(0, true);
  
// we've got the offset of the PE header now
// we'll go to that offset, then a further 92 bytes
// this is where the subsytem field is
await bin.seek(peHeaderPointer + 92, Deno.SeekMode.Start);

// WINDOWS subsystem (don't show a terminal)
// CONSOLE subsystem (show a terminal when running)
const SUBSYSTEM_WINDOWS = 2;
const SUBSYSTEM_CONSOLE = 3;

// before we modify the value we'll do a very rough check
// to make sure that we are modifying the right field
// we'll need to get it as a little-endian u16
const subsystemBytes = await readN(bin, 2);
if (subsystemBytes == null) {
    console.log("Encountered EOF at subsystemBytes");
    Deno.exit(1);
  }
const subsystem = view(subsystemBytes).getUint16(0, true);
if (!(SUBSYSTEM_WINDOWS == subsystem || SUBSYSTEM_CONSOLE == subsystem)) {
    console.log("Oops! The subsystem is not WINDOWS=2 or CONSOLE=3.");
    console.log("We might be editing the wrong field,");
    console.log("  _or_ the EXE uses a different subsystem.");
    Deno.exit(1);
}
  
// okay, now we are pretty sure about the file
// let's update its subsystem
const newSubsystemData = new Uint16Array(1);
view(newSubsystemData).setUint16(0, SUBSYSTEM_WINDOWS, true);
// go back to the subsytem field
await bin.seek(peHeaderPointer + 92, Deno.SeekMode.Start);
// write out our data.
await writeAll(bin, newSubsystemData);
  
  // finish up with a helpful message
const newSubsystemValue = view(newSubsystemData).getUint16(0, true);
if (SUBSYSTEM_WINDOWS == newSubsystemValue) {
    console.log(`Done! Changed ${PATH_TO_BINARY} subsystem=2, WINDOWS.`);
}
else if (SUBSYSTEM_CONSOLE == newSubsystemValue) {
    console.log(`Done! Changed ${PATH_TO_BINARY} subsystem=3, CONSOLE.`);
}