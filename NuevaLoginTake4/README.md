#INFO Thingy

- Set up GeoFencing for Android (DONE)
- create  api until I can get in contact with tech office
- save user data to local storage or something.
- make look nice (DONE)
- show map of user location and school boundary (DONE)
- fallback to button logout if no logout
- widget
- IOS if time (DONE ISH)

to run:

Android:
Running Android requires at least 12 gigabytes of free space on your computer
 - Install package managers:
```
brew install yarn
brew install npm
```
 - Download Android Studio from their website: [https://developer.android.com/studio](url)
 - Download Metro
```
yarn add --dev metro metro-core
```
 - Install packages:
```
npm install
yarn install
```
 - Follow React's setup instructions at: [https://reactnative.dev/docs/set-up-your-environment?os=macos&platform=android&guide=native#android-sdk](url)
 - Navigate to the _android_ directory and start _Metro_
```
cd NuevaLoginTake4/android
yarn start
```
 - In a new terminal window, navigate to the _NuevaLoginTake4_ and run the program
```
cd NuevaLoginTake4
yarn android
```


IOS:
get xcode, install cocoapods, have a working Xcode version (MacOS Tahoe or something) that's compatible with this RN version.
You'll need to do a lot of troubleshooting here. Worst case scenario, scrap the IOS all together. get rid of the IOS folder and just run on android.

What I'd hope for:

Build the API call and get in touch with the tech office. (right now it's vibecoded because I was lazy so you'll need to swap the API payload type checkers around) Review some of the easy TODO items and call it a day. Maybe document my code a bit better

Don't worry about:

Anything in the android in kotlin or the IOS. that's just nasty geofence API stuff.

GOAL:
I've laid some unstable groundwork with a android emulator working app but not IOS at all. I don't care if you don't do the IOS. it's just the side project that I was too stubborn to drop. Just get the app upto a level of production and make it look nicer. 
