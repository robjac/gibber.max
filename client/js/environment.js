// singleton 
let Gibber = null,
    CodeMirror = require( 'codemirror' )

const exampleCode = 
`// play note immediately
this.note( 84 )

// ctrl+enter to execute line or selection
this.note.seq( [64,66,67,69], 11025 )

this.note.values.reverse.seq( null, 44100 )
this.note.values.rotate.seq( 1, 88200 )

// stop
this.note.seq.stop()

// start
this.note.seq.start()

// create a parallel sequence with id 1 (0 is default)
this.note.seq( 71, 5512.5, 1 )

// longhand reference to sequence
this.sequences.note[ 1 ].stop()

// sugar
this.note[ 1 ].start()`

require( '../node_modules/codemirror/mode/javascript/javascript.js' )

let Environment = {
  init( gibber ) {
    Gibber = gibber
    
    this.createCodeMirror()
    this.createConsole()
  },
  
  createCodeMirror() {
    CodeMirror.keyMap.gibber = this.keymap
    this.codemirror = CodeMirror( document.querySelector('#editor'), { mode:'javascript', keyMap:'gibber', autofocus:true, value:exampleCode })
    this.codemirror.setSize( null, '100%' ) 
  },

  createConsole() {
    this.console = CodeMirror( document.querySelector('#console'), { mode:'javascript', autofocus:false, lineWrapping:true })
    this.console.setSize( null, '100%' )
  },

  log() {
    let args = Array.prototype.slice.call( arguments, 0 )
    
    // do not place newline before first log message
    let currentValue = Environment.console.getValue() 
    if( currentValue.length ) currentValue += '\n'

    Environment.console.setValue( currentValue + args.join( ' ' ) )
    Environment.console.scrollIntoView({ line:Environment.console.lastLine(), ch:0 })
    
    console.log.apply( console, args ) 
  },

  keymap : {
    fallthrough:'default',

    'Ctrl-Enter'( cm ) {
      try {
        let selectedCode = Environment.getSelectionCodeColumn( Environment.codemirror, false )

        //console.log( selectedCode.code )

        Environment.flash( Environment.codemirror, selectedCode.selection )

        let func = new Function( selectedCode.code ).bind( Gibber.currentTrack )()
        //  Gibber.codeMarkup.process( selectedCode.code, selectedCode.selection )
      } catch (e) {
        console.log( e )
        Environment.log( 'ERROR', e )
      }
    }
  },

 	getSelectionCodeColumn( cm, findBlock ) {
		let pos = cm.getCursor(), 
				text = null
 
  	if( !findBlock ) {
      text = cm.getDoc().getSelection()

      if ( text === "") {
        text = cm.getLine( pos.line )
      }else{
        pos = { start: cm.getCursor('start'), end: cm.getCursor('end') }
        //pos = null
      }
    }else{
      let startline = pos.line, 
          endline = pos.line,
          pos1, pos2, sel
    
      while ( startline > 0 && cm.getLine( startline ) !== "" ) { startline-- }
      while ( endline < cm.lineCount() && cm.getLine( endline ) !== "" ) { endline++ }
    
      pos1 = { line: startline, ch: 0 }
      pos2 = { line: endline, ch: 0 }
    
      text = cm.getRange( pos1, pos2 )

      pos = { start: pos1, end: pos2 }
    }

    if( typeof pos.start === 'undefined' ) {
      let lineNumber = pos.line,
          start = 0,
          end = text.length

      pos = { start:{ line:start, ch:0 }, end:{ line:start, ch: end } }
    }
    //GE.Keymap.flash(cm, pos)
		
		return { selection: pos, code: text }
	},

  flash(cm, pos) {
    let sel,
        cb = function() { sel.clear() }
  
    if (pos !== null) {
      if( pos.start ) { // if called from a findBlock keymap
        sel = cm.markText( pos.start, pos.end, { className:"CodeMirror-highlight" } );
      }else{ // called with single line
        sel = cm.markText( { line: pos.line, ch:0 }, { line: pos.line, ch:null }, { className: "CodeMirror-highlight" } )
      }
    }else{ // called with selected block
      sel = cm.markText( cm.getCursor(true), cm.getCursor(false), { className: "CodeMirror-highlight" } );
    }
  
    window.setTimeout(cb, 250);
  }
}

module.exports = Environment