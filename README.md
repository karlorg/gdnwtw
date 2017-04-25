A tiny game for the game jam Ludum Dare #38 with the theme "A Small World".

Map tiles by Buch at OpenGameArt.org, http://blog-buch.rhcloud.com and Jeffrey Kern (committer and creative consultant).  Retrieved from https://opengameart.org/content/overworld-tiles-0

Some sound effects based on those available online, including:

* https://www.freesound.org/people/pushtobreak/sounds/16793/ by pushtobreak
* https://www.freesound.org/people/ryanlouis/sounds/366958/ by ryanlouis
* https://www.freesound.org/people/juskiddink/sounds/149488/ by juskiddink

The game is made with [Phaser](https://github.com/photonstorm/phaser-ce) and this repository was based on the [Phaser/ES6/Webpack template](https://github.com/lean/phaser-es6-webpack) on Github.

# Setup
To use this bootstrap you’ll need to install a few things before you have a working copy of the project.

## 1. Clone this repo:

Navigate into your workspace directory.

Run:

```git clone https://github.com/lean/phaser-es6-webpack.git```

## 2. Install node.js and npm:

https://nodejs.org/en/


## 3. Install dependencies (optionally you could install [yarn](https://yarnpkg.com/)):

Navigate to the cloned repo’s directory.

Run:

```npm install``` 

or if you choose yarn, just run ```yarn```

## 4. Run the development server:

Run:

```npm run dev```

This will run a server so you can run the game in a browser.

Open your browser and enter localhost:3000 into the address bar.

Also this will start a watch process, so you can change the source and the process will recompile and refresh the browser


## Build for deployment:

Run:

```npm run deploy```

This will optimize and minimize the compiled bundle.
