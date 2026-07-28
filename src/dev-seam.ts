// App-owned tuning seam (spike for docs/prds/scaffold-devtool in the
// personal-productivity-scripting repo).
//
// The app reads these BAKED DEFAULTS at the point of use. A dev tool under
// src/devtools/ may overlay live values onto them at runtime while you dial
// them in. The app imports this seam (which it owns); it never imports the dev
// tool. Delete src/devtools/ + the <DevTools/> mount and these defaults still
// stand — the app keeps working, unchanged.
//
// Read at the point of use every time (per frame for canvas layers), never
// cached, so a live overlay takes effect immediately without re-init.
export const devSeam = {
  atoms: {
    depthShift: 30, // parallax swing at the dome apex, px (was DEPTH_SHIFT)
    autoOrbit: false, // dev-only perception aid: synthesize pointer motion so
    //                   the parallax is visible without waving the mouse
    frozen: false, // dev-only perception aid: pause the physics and hold the
    //                pointer at holdX, so a still frame is inspectable
    holdX: 0.44, // fixed pointer x-offset used while frozen (-0.5..0.5)
  },
};
