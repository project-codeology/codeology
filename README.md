## Codeology
Codeology brings to life the art and science of code. An algorithm analyzes GitHub projects and creates unique organic forms based on the codebase size and language. As no two pieces of code are alike, no two Codeology forms are alike.

## How it works
The application pulls data from GitHub’s public API and creates visuals using WebGL, Three.js, and GLSL Shaders. Shape and color represent an individual language, with size being proportionate to how many characters of code were written.

### Setting up node modules

* Source files are located in `/src` folder and compiled to `/dist` folder.
* Build files are located in `/build` folder.

To setup required node modules just run: `npm install`.

### Compile
To compile all files to dist folder, run: `grunt`.
If you need live compiling (separately: images, fonts, js and scss), just run: `grunt watch`.

### Release
To release project with clean code, run: `grunt release`.

### Contributing
We're excited to hear your ideas for improving this project! Feel free to submit a pull request or create a new [GitHub issue](https://github.com/project-codeology/codeology/issues/new) if you find a bug or have questions. We'll do our best to respond.

### Acknowledgements
This project was made possible by [Braintree](https://www.braintreepayments.com/).
