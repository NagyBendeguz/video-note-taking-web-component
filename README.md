# Video note-taking web component

Easy to use note-taking web component for videos. The project can be used as being deployed, as a JavaScript library or with a browser extension.

## Live demo

In the following link you can test the project in a live demo.

https://nagybendeguz.github.io/video-note-taking-web-component/
- (GitHub Pages limit could cause the page to be very slow.)

## Prerequisites

The following needs to be installed:
- Node.js: ^20.19.0 or ^22.12.0 or ^24.0.0
- npm

## Start the application

Go inside the video-note-taking-web-component folder:

```
cd video-note-taking-web-component
```

In the video-note-taking-web-component folder install dependencies (only for the first time):

```
npm install
```

Start the application (still in the video-note-taking-web-component folder):

```
ng serve
```

Open the application in the browser:

```
http://localhost:4200
```

## Deploy project

You can deploy the project with `ng deploy` if your git repo it set up correctly.

More info about deploying projects: https://github.com/angular-schule/angular-cli-ghpages

## Build JavaScript library

You can build the project as a JavaScript library.

Build the project (in the video-note-taking-web-component folder):

```
ng build
```

Produce the bundle files:
- Make sure the in the video-note-taking-web-component/dist/video-note-taking-web-component/browser/ folder the style.css and main.js file matches the filenames that is in the video-note-taking-web-component/src/loader.js file.
- Now run the following command in the video-note-taking-web-component folder:

```
npx rollup -c
```

Copy the video-note-taking-web-component/dist/video-note-taking-web-component/browser/ assets and media folders to the lib folder.

Go inside the lib folder:

```
cd lib
```

Build the JavaScript library (in the lib folder):

```
npm pack
```

## Use JavaScript library

### Angular

Create a new Angular project:

```
ng new project-name --standalone=false
```

In the following command adjust the path to be the .tgz file that you just built and install the video note-taking web component to your project. If you build a new version of the library then you need the rerun this command.

```
npm install video-note-taking-web-component-1.0.0.tgz
```

First: import the library to the main.ts file.

```ts
import 'video-note-taking-web-component';
```

Second: import the CUSTOM_ELEMENTS_SCHEMA in the app-module.ts file in @NgModule({...}).

```ts
schemas: [CUSTOM_ELEMENTS_SCHEMA]
```

Third: import the used icons for the project in the angular.json file.
- projects -> 'project-name' -> architect -> build -> options -> assets -> here create new assets

```json
{
  "glob": "**/*",
  "input": "node_modules/video-note-taking-web-component/assets/bootstrap-icons",
  "output": "assets/bootstrap-icons"
},
{
  "glob": "**/*",
  "input": "node_modules/video-note-taking-web-component/media",
  "output": "media"
}
```

And lastly add videos and subtitles to the project and use it in the components like the following. Make sure the video and subtitle paths are correct. The subtitle and lang attributes are not necessary, you can skip them.

```html
<video-player src="video.mp4" subtitle="subtitle.vtt" lang="en"></video-player>
```

## Browser extension

[Demo browser extension](./browser-extension/README.md)

## Possible problems

The application uses the canvas for generating the thumbnails. If the canvas is blocked or disabled in the browser you need to enable it (or disable fingerprinting protection that blocks canvas access). Most likely you need to reload the page after that.
