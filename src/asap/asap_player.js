function createAsapPlayer ( opts ) {
  // console.log( '  CREATING ASAP PLAYER  ' )

  // ref: https://github.com/talmobi/asap-radio-js/blob/master/js/asapweb.js
  var player = {
    _timerIds: 1
  }

  player.stop = function () {
    player._timerIds += 1
  }

  /**
    * Loads music data ("module").
    * @param filename Filename, used to determine the format.
    * @param module Contents of the file.
    * @param moduleLen Length of the file.
    *
    * ref: https://raw.githubusercontent.com/epi/asap/master/asap.h
    */
  player.load = function ( filename, module, song ) {
    var asap = new ASAP();
    player.asap = asap;
    asap.load(filename, module, module.length);
    var info = asap.getInfo();
    player.info = info;

    if (song == null) {
      song = info.getDefaultSong();
    }

    asap.playSong( song, info.getDuration( song ) )

    var ae = player.audioElement
    ae.duration = ( asap.currentDuration / 1000 )
    if ( ae.onloadedmetadata ) ae.onloadedmetadata()

    var buffer = new Array(8192);

    var channels = info.getChannels() || 2
    var sampleRate = ASAP.SAMPLE_RATE || 44100
    var bufLow = 8192
    var bufHigh = 8192 * 2

    player.underRunCallback = function ( samplesRequested ) {
      var ae = player.audioElement

      // executed manually by ticking function
      // using audio.executeCallback()

      buffer.length = asap.generate(buffer, samplesRequested, ASAPSampleFormat.U8);

      if ( buffer.length > 0 ) {
        ae.readyState = ae.HAVE_ENOUGH_DATA
      }

      for (var i = 0; i < buffer.length; i++) {
        buffer[i] = (buffer[i] - 128) / 128;
      }

      if ( buffer.length === 0 ) {
        // console.log( 'buffer.length ZERO' )

        player.stop()

        if ( ae ) {
          ae.pause()
          ae.seek( 0 )
          ae.onended && ae.onended()
        }
      }

      return buffer;
    }

    player.heartbeatCallback = undefined
    player.postheartbeatCallback = undefined

    var volume = 1.0

    player.failureCallback = function ( err ) {
      console.log( err )
    }

    var audio = new XAudioServer(
      channels,
      sampleRate,
      bufLow,
      bufHigh,
      player.underRunCallback,
      player.heartbeatCallback,
      volume,
      player.failureCallback
    )

    asap.onseeking = function () {
      //
    }
    asap.onseekingdone = function () {
      if ( player.updateTime ) {
        player.updateTime()
      }
    }

    player.heartbeat = function () {
      if ( !asap.seeking ) {
        audio.executeCallback();

        if ( player.updateTime ) {
          player.updateTime()
        }
      }
    }

    if ( player.playWasRequestedBeforeReady ) {
      player.playWasRequestedBeforeReady = false
      player.startTicking()
    }

    if ( player.onloaded ) {
      player.onloaded()
    }
  }

  player.startTicking = function () {
    var timerId = player._timerIds
    // console.log( 'start ticking: ' + timerId )

    if ( !player.heartbeat ) {
      player.playWasRequestedBeforeReady = true
      return
    }

    tick()
    function tick () {
      if ( player._timerIds !== timerId ) {
        // console.log( 'timer id mismatch, stopping.' )
        return
      }

      // console.log( 'ticking: ' + timerId )
      player.heartbeat()

      setTimeout( tick, 45 )
    }
  }

  player.close = function () {
    var audioElement = player.audioElement
    if ( audioElement ) {
      player.stop()
      audioElement.stop()
    }
  }

  var api = {}

  api.Track = function ( url, trackOpts ) {
    var track = {}

    track.open = function () {
      var self = {};

      self.HAVE_NOTHING = 0;
      self.HAVE_NOTHING = 0;
      self.HAVE_METADATA = 1;
      self.HAVE_CURRENT_DATA = 2;
      self.HAVE_FUTURE_DATA = 3;
      self.HAVE_ENOUGH_DATA = 4;
      self.readyState = self.HAVE_NOTHING;

      player.audioElement = self
      self.player = player

      var _currentTime = 0
      var _pausedTime = 0
      var _lastCurrentTime = 0

      player.updateTime = function () {
        var asap = player.asap
        if ( !asap ) return

        var duration = (
          asap.currentDuration / 1000
        )

        var currentTime = (
          ASAP.blocksToMilliseconds( asap.blocksPlayed ) / 1000
        )

        self.duration = duration
        _currentTime = currentTime

        if ( currentTime > _lastCurrentTime ) {
          _lastCurrentTime = currentTime

          if ( _canTriggerPlayHandler && !self.paused ) {
            _canTriggerPlayHandler = false
            self.onplay && self.onplay()
          }

          self.ontimeupdate && self.ontimeupdate()
        }
      }

      self.paused = true

      var _canTriggerPlayHandler = true
      self.play = function () {
        if ( self.paused ) {
          self.paused = false
        }

        _lastCurrentTime = _currentTime

        player.startTicking()
      }

      self.stop = function () {
        player.stop()
      }

      self.pause = function () {
        _canTriggerPlayHandler = true
        self.paused = true
        _pausedTime = _currentTime

        player.stop()

        self.onpause && self.onpause()
      }

      // implement the Cowbell seekable interface
      self.seekable = {
        length: 1,
        start: function ( i ) {
          if ( i !== 0 ) throw "Out of range";
          return 0;
        },
        end: function( i ) {
          if (i !== 0 ) throw "Out of range";
          return self.duration;
        }
      }

      self.seek = function ( seconds ) {
        var s = seconds

        if ( s > self.duration ) {
          s = self.duration
        }

        var milliseconds = s * 1000

        if ( player.asap ) {
          player.asap.seek( milliseconds )
        } else {
          return player.onloaded = function () {
            self.seek( seconds )
          }
        }

        _lastCurrentTime = seconds
      }

      binaryHttpRequest( url, player.load )

      self.__defineGetter__( 'currentTime', function() {
        return _currentTime
      } )

      self.__defineSetter__( 'currentTime', function( newTime ) {
        self.seek( newTime )
      } )

      return self
    }

    track.close = function () {
      player.close()
    }

    return track
  }

  return api
}

// attach to Cowbell
if ( typeof Cowbell 'object' && typeof Cowbell.Player === 'object' ) {
  Cowbell.Player.ASAP = function(opts) {
    // return new Cowbell.Common.WebAudioPlayer(ASAPGenerator, opts);
    return createAsapPlayer( opts )
  }
}

