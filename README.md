[![npm](https://img.shields.io/npm/v/asap-web.svg?maxAge=3600&style=flat-square)](https://www.npmjs.com/package/asap-web)
[![npm](https://img.shields.io/npm/l/asap-web.svg?maxAge=3600&style=flat-square)](https://github.com/talmobi/asap-web/blob/master/LICENSE)

# asap-web
An updated Atari music player for the web based on Piotr Fusik's [Another Slight Atari Player](http://asap.sourceforge.net)

Now available as a UMD module! Install directly from `npm`! `npm install asap-web`

![](https://i.imgur.com/01DY6rX.png)

## Demo
https://talmobi.github.io/asap-web/

## Easy to use

#### CommonJS
```javascript
const asap = require( 'asap-web' )
const player = asap.createAsapPlayer()

const url = 'https://s3-eu-west-1.amazonaws.com/s3.jin.bucket/gsl_chip_archive/Grayscale/DrillDance.sap'
const track = player.Track( url )

const audioElement = track.open()
audioElement.play()
```

#### UMD (Browser)
```javascript
<script src="dist/wrapper.min.js" type="text/javascript"></script>
<script type="text/javascript">
  const asap = window.asap
  const player = asap.createAsapPlayer()

  const url = 'https://s3-eu-west-1.amazonaws.com/s3.jin.bucket/gsl_chip_archive/Grayscale/DrillDance.sap'
  const track = player.Track( url )

  const audioElement = track.open()
  audioElement.play()
</script>
```

## About
Additions like seeking, bugfixes and API refactoring on Piotr Fusik's old ASAP project.

## Why
To easily play Atari music. The web code for getting ASAP to work was quite obscure and tricky to use with bugs and lack of features (such as seeking) and
proper time tracking etc.

Works as a UMD module. Exposes window.asap with window.asap.createAsapPlayer() function as a global browser module.

## Other
The dist build comes at around 200kb. The average size of a SAP song is around 5kb.
http://asap.sourceforge.net/sap-format.html

## API
TODO

## For who?

## How
Heavily based on Piotr Fusik's [Another Slight Atari Player](http://asap.sourceforge.net)

Bugfixes, some new features ( seeking, time tracking, event emitting, strict mode compatibly etc ), a simpler API based on Cowbell Plugin interface -> this attaches directly to Cowbell.Player.ASAP if it's available.

Cowbell uses the older version of the ASAP web player though without seeking etc and some other bugs/crashes. Isn't compatible with strict mode, can't be lodaed as CommonJS module etc.

## Similar Alternatives
[Another Slight Atari Player](http://asap.sourceforge.net)
[Cowbell](https://github.com/demozoo/cowbell)

## Test
```
No tests..
```
