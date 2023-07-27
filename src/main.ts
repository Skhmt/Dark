
import { SizeHint, Webview } from 'https://deno.land/x/webview@0.7.6/mod.ts'

// outputting log to a file since this is supposed to act like a windows application without a console
import * as log from 'https://deno.land/std@0.195.0/log/mod.ts'
await log.setup({
	handlers: {
		file: new log.handlers.RotatingFileHandler('DEBUG', {
			filename: './log.txt',
			formatter: '{levelName} {msg}', // {datetime} can be added here, but it's very verbose
			maxBytes: 1024 * 1024,
			maxBackupCount: 10,
		}),
	},
	loggers: {
		default: {
			level: 'DEBUG',
			handlers: ['file'],
		},
	},
})

// creating a webpage in a string - this can be read from a file instead
const html = `
<html>
    <body>
        hello from deno v${Deno.version.deno}
        <br>
        <button onclick="pressTest()">click me</button>
        <br>
        <div id="output"></div>
    </body>
    <script>
        async function pressTest() {
            let count = await press(2)
            console.log(count)
            log(count)
        }
    </script>
</html>
`

const webview = new Webview(
	false, // debug mode that allows console... currently this does nothing and is always true
	{
		width: 620,
		height: 450,
		//can be .NONE, (dimensions are the default) .MIN (dimensions are the min),
		//.MAX (dimensions are the max), or .FIXED (cannot be changed by user)
		hint: SizeHint.NONE,
	},
)
webview.title = 'Hello Deno Webview'

let counter = 1
webview.bind('press', (increment: number) => {
	// return counter += increment
	counter += increment || 1

	// automatically update the #output div
	// this is not the ideal way to do this - the view should be updated in the frontend, not here...
	// but this is just showing how it COULD be done.
	webview.eval(`
		document.querySelector('#output').innerHTML = ${counter};
    `)

	// async return this value to webviewland
	return counter
})

// this lets the webviewland log to denoland
webview.bind('log', (...args) => log.debug(args[0]))

webview.navigate(`data:text/html,${encodeURIComponent(html)}`)
webview.run()
