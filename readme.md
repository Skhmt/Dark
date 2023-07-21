# Dark

A proof of concept of an Electron-like Deno app for Windows 11

Creates a ~76mb stand-alone (assuming Windows 11 or something with WebView2 installed) executable, zipped is ~30mb

## Installing

Install Deno with powershell: `irm https://deno.land/install.ps1 | iex`

## Running

`deno task dev`

## Building for Windows 11

`deno task build`

## Debugging

`deno task debug`

Go to `edge://inspect` in Edge (Chromium) or `chrome://inspect` in Chrome to debug

## Known issues

- Debug toggle doesn't work in Webview
- Update to Webview 0.7.6 as soon as it's released

## References

- deno docs: https://deno.land/manual@v1.35.2/introduction
- deno webview api: https://deno.land/x/webview@0.7.5/mod.ts?s=Webview