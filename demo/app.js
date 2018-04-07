const { mount, el, list } = require( 'redom' )

// const asap = require( '../dist/wrapper.min.js' )
const asap = require( '../dist/wrapper.js' )

const player = asap.createAsapPlayer()
let _currentTrack
let _currentAudioElement

const store = require( 'ya' )()

store.state.search = ''
store.state.activeUrl = ''

store.state.songs = [
  'music/drilldance.sap',
  'music/Shake_Your_Ass.sap',
  'music/X_Ray_2.sap',
  'music/Zizibum.sap',
  'music/Jatatap.sap',
  'music/Komar.sap',
]

store.state.matches = store.state.songs.slice()

function App ()
{
  let _search
  let _list
  let _more
  let _moreText
  let _video
  let _progress

  const _el = el( 'div.app',
    _progress = el( 'span.progress' ),
    _video = el( 'video#bg-video', {
      loop: true,
      muted: true,
      autoplay: false,
      src: 'https://i.imgur.com/IvPmyye.mp4',
      style: {
        position: 'fixed',
        opacity: 0,
        maxHeight: 0,
      }
    } ),
    el( 'a.app-title', 'asap-web', { href: 'https://github.com/talmobi/asap-web' } ),
    el( 'a.app-desc', 'easily play atari music files on the web' ),
    el( 'div.search-container',
      _search = SearchInput(),
      _list = list( 'ul.search-list', SearchItem )
    ),
    _more = el( 'button.more-music-button',
      _moreText = el( 'span', 'More songs?' ),
      el( 'img.more-music-button__spinner', { src: 'https://i.imgur.com/jvK34qS.gif' } )
    )
  )

  store.on( 'timestamp', function ( timestamp ) {
    _progress.innerText =  timestamp
  } )

  window.onscroll = function ( evt ) {
    const scroll = document.documentElement.scrollTop
    if ( scroll > 20 ) {
      _progress.style.left = '10%'
    } else {
      _progress.style.left = ''
    }
  }

  _video.onloadeddata = function () {
    const h = 1920

    const vw = _video.videoWidth
    const vh = _video.videoHeight

    const k = h / vh
    const woffset = Math.floor( vw * k )

    _video.style.top = 0
    _video.style.left = -( woffset / 4 ) + 'px'
    _video.style.height = h + 'px'

    _video.style.opacity = 0.15
    _video.style.maxHeight = ''
  }

  _more.onclick = function () {
    if ( _moreText.textContent === '' ) return

    _moreText.textContent = ''
    _more.classList.add( 'more-music-button--loading' )

    getMoreMusic( function ( err, songs ) {
      if ( !err && songs ) {
        _more.classList.add( 'more-music-button--active' )

        setTimeout( function () {
          const chunks = []

          for ( let i = 0; i < 11; i++ ) {
            const len = Math.ceil( songs.length / 10 )
            chunks.push( songs.splice( 0, len ) )
          }
          chunks.push( [] )

          chunks.forEach( function ( songs, ind ) {
            setTimeout( function () {
              songs.forEach( function ( song ) {
                store.state.songs.push( song )
              } )

              store.emit( 'songs' )
            }, 500 * ind )
          } )
        }, 300 )
      } else {
        _more.classList.remove( 'more-music-button--loading' )
        _moreText.textContent = err
      }
    } )
  }

  store.on( 'search', function () {
    const matches = store.state.songs.filter( function ( v, a, r) {
      return v.toLowerCase().indexOf( store.state.search.toLowerCase() ) >= 0
    } )

    store.state.matches = matches
    store.emit( 'matches', store.state.matches )

    _list.update( matches )
  } )

  _list.update( store.state.songs )
  store.on( 'songs', function () {
    _list.update( store.state.songs )
    store.emit( 'search' )
  } )

  function onmount () {
    _search.el.focus()
  }

  return {
    el: _el,
    onmount: onmount
  }
}

function SearchInput ()
{
  const _el = el( 'input.search-input', { spellcheck: false } )

  function update ( text ) {
    _el.value = text
  }

  _el.onkeyup = function ( evt ) {
    const keyCode = evt.keyCode || evt.which

    switch ( keyCode ) {
      case 13: // enter
        playTrack( store.state.matches[ 0 ] )
        break

      default:
        store.state.search = _el.value
        store.emit( 'search', store.state.search )
    }
  }

  return {
    el: _el,
    update
  }
}

function SearchItem ( url )
{
  let _text
  let _bread
  let _url = url || ''

  const _el = el( '.search-item',
    _text = el( '.search-item__text', _url ),
    _bread = el( '.search-item__bread', '[Enter]' )
  )

  _el.onclick = function ( evt ) {
    evt.preventDefault()

    if ( _currentAudioElement && store.state.activeUrl === _url ) {
      if ( _currentAudioElement.paused ) {
        _currentAudioElement.play()
      } else {
        _currentAudioElement.pause()
      }
    } else {
      playTrack( _url )
    }
  }

  function update ( url, ind, arr ) {
    if ( ind === 0 ) {
      _el.classList.add( 'search-item--first' )
    } else {
      _el.classList.remove( 'search-item--first' )
    }

    _url = url

    var aurl = store.state.activeUrl
    if ( _url === aurl ) {
      _el.classList.add( 'search-item--active' )
    } else {
      _el.classList.remove( 'search-item--active' )
    }

    let text = url

    text = text.split( '/' ).slice( -2 ).join( '/' )
    _text.textContent = text
  }

  store.on( 'active-url', function () {
    var aurl = store.state.activeUrl
    if ( _url === aurl ) {
      _el.classList.add( 'search-item--active' )
    } else {
      _el.classList.remove( 'search-item--active' )
    }
  } )

  return {
    el: _el,
    update
  }
}

const rootEl = document.querySelector( '#root' )
mount( rootEl, App() )

function getRandomMusicUrl ()
{
  const index = Math.floor( Math.random() * store.state.songs.length )
  return store.state.songs[ index ]
}

let _videoPauseTimeout
function playTrack ( url )
{
  if ( _currentTrack ) {
    _currentTrack.close()
  }

  if ( !url ) return console.log( 'faulty url: ' + url )

  _currentTrack = player.Track( url )
  const audioElement = _currentTrack.open()
  _currentAudioElement = audioElement

  audioElement.play()

  store.state.activeUrl = url
  store.emit( 'active-url', url )
  console.log( 'playing: ' + url )

  let _lastTimestamp = ''
  audioElement.ontimeupdate = function () {
    let currentTime = audioElement.currentTime | 0
    let duration = audioElement.duration | 0

    let timestamp = ( `${ currentTime } / ${ duration }` )

    if ( timestamp !== _lastTimestamp ) {
      console.log( timestamp )
      store.emit( 'timestamp', timestamp  + 's' )
    }

    _lastTimestamp = timestamp
  }

  pauseBgVideo()
  audioElement.onpause = function () {
    pauseBgVideo()
  }

  audioElement.onplay = function () {
    playBgVideo()
  }

  audioElement.onended = function () {
    console.log( 'song ended' )

    // play next song lined up
    setTimeout( function () {
      const aurl = store.state.activeUrl
      try {
        const matches = store.state.matches
        const index = matches.indexOf( aurl )
        playTrack( matches[ ( index + 1 ) % matches.length ] )
      } catch ( err ) {
        console.log( err )
      }
    }, 200 )
  }
}

function getMoreMusic ( callback )
{
  const xhr = new XMLHttpRequest()
  xhr.open( 'GET', 'files.txt', true )
  xhr.onload = function () {
    const status = xhr.status

    if ( status >= 200 && status < 400 ) {
      const data = xhr.responseText

      const list = (
        data.split( '\n' )
        .map( function ( item ) {
          return item.trim()
        } )
        .filter( function ( item ) {
          return item.indexOf( '.sap' ) >= 0
        } )
      )

      console.log( 'xhr success' )
      callback( null, list )
    } else {
      console.log( 'failed' )
      console.log( xhr.responseText )
      callback( 'failed' )
    }

    callback( null )
  }

  xhr.onerror = function () {
    console.log( 'connecion error' )
    callback( 'connection error' )
  }

  setTimeout( function () {
    xhr.send()
  }, 300 )
}

function pauseBgVideo ()
{
  const vid = document.getElementById( 'bg-video' )
  if ( vid ) {
    vid.pause()
  }
}

function playBgVideo ()
{
  const vid = document.getElementById( 'bg-video' )
  if ( vid ) {
    vid.play()
  }
}
