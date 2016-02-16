var SERVER = "http://codeology.kunstu.com/";

if (window.location.hostname == 'codeology.lhx')
    SERVER = "http://codeology.lhx/";
if (window.location.hostname == '54.191.204.67')
    SERVER = "http://54.191.204.67/";
if (window.location.hostname == 'codeology.braintreepayments.com')
    SERVER = "http://codeology.braintreepayments.com/";
if (window.location.hostname == 'localhost')
    SERVER = "http://codeology.braintreepayments.com/";

SERVER = SERVER.replace('http:', window.location.protocol);

var TYPES_STRING = 'unknown, JavaScript, HTML, Ruby, Java, PHP, Python, C, C++, CSS, Shell, C#, Objective-C, Perl, CoffeeScript, Go, Scala, VimL, R, Haskell, Clojure, Lua, Groovy, Emacs Lisp, Erlang, Puppet, TeX, Swift, Matlab, ActionScript, Arduino, Batchfile, GLSL, OCaml, Tcl, Visual Basic, TypeScript, D, Assembly, Common Lisp, Dart, Prolog, XSLT, PowerShell, Scheme, FORTRAN, Rust, ASP, Processing, Julia, F#, Elixir, ColdFusion, Vala, Apex, Racket, VHDL, Pascal, Smalltalk, Haxe, Verilog, Logos, Delphi, Makefile, Kotlin, AutoHotkey, CMake, QMake, UnrealScript, LiveScript, HaXe, BlitzBasic, IDL, Standard ML, XML, SQL, OpenEdge ABL, Objective-C++, AppleScript, SuperCollider, PureScript, Eiffel, Elm, Gosu, M, Smarty, Pure Data, nesC, XQuery, SQF, Scilab, DOT, Postscript, Cuda, Slash, Max, Game Maker Language, AutoIt, Mathematica, SourcePawn, Groff';
var TYPES = TYPES_STRING.split(', ');

var MOBILE_VERSION = window.mobileAndTabletcheck();
var SKIP_INTRO = false;
var HISTORY_ENABLED = true;
var MIN_FPS = 10;

var ZOOM_IN_MIN = 300;
var ZOOM_IN_MAX = 900;
var ZOOM_IN = 500;

var asciiShader = {enabled: true};