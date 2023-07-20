import {Webview, SizeHint} from 'https://raw.githubusercontent.com/aaronhuggins/webview_deno/0.7.6-preview2/mod.ts'

// using aaronhuggins' 0.7.6 preview because webview 0.7.5 is broken with the latest Deno 1.35.x
// this is NOT safe but all that can be done for now

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

const webview = new Webview(true, // debug mode that allows console... currently this does nothing and is always true
{
    width: 620,
    height: 450,
    //can be .NONE, (dimensions are the default) .MIN (dimensions are the min), 
    //.MAX (dimensions are the max), or .FIXED (cannot be changed by user)
    hint: SizeHint.NONE
})
webview.title = "Hello Deno Webview"

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
webview.bind('log', (...args) => console.log(...args))

webview.navigate(`data:text/html,${encodeURIComponent(html)}`)
webview.run()